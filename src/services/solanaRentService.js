/**
 * ChainRecover AI - Module 2: Live Solana Rent Recovery Engine
 * 
 * Replicates refundyoursol.com functionality:
 * 1. Fetch live SPL & Token-2022 accounts via RPC.
 * 2. Filter accounts with 0 balance.
 * 3. Generate CloseAccount transactions securely.
 */

const { Connection, PublicKey, Transaction } = require('@solana/web3.js');
const { createCloseAccountInstruction, TOKEN_PROGRAM_ID } = require('@solana/spl-token');

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

// Constants
const LAMPORTS_PER_SOL = 1000000000;
const DEFAULT_ACCOUNT_RENT_LAMPORTS = 2039280; // ~0.00203928 SOL
const SOL_PRICE_ESTIMATE_USD = 180.0;
const TRANSACTION_FEE_LAMPORTS = 5000;

function isValidSolanaPublicKey(pubKeyStr) {
  if (!pubKeyStr || typeof pubKeyStr !== 'string') return false;
  try {
    new PublicKey(pubKeyStr);
    return true;
  } catch (err) {
    return false;
  }
}

function toPublicKey(pubKeyStr) {
  return new PublicKey(pubKeyStr);
}

/**
 * 1. Fetch live accounts and filter empties
 */
async function findEmptyTokenAccounts(walletPubKeyStr) {
  if (!isValidSolanaPublicKey(walletPubKeyStr)) {
    throw new Error(`Invalid Solana wallet address: '${walletPubKeyStr}'`);
  }

  const owner = toPublicKey(walletPubKeyStr);
  
  // Fetch SPL Token (classic)
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID });
  // Fetch SPL Token 2022
  const token2022Accounts = await connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID });
  
  const allAccounts = [...tokenAccounts.value, ...token2022Accounts.value];
  const emptyAccounts = [];

  for (const account of allAccounts) {
    const parsedInfo = account.account.data.parsed.info;
    const tokenAmount = parseFloat(parsedInfo.tokenAmount.uiAmount || 0);
    
    // Only close perfectly empty accounts for safety (Safety Burn equivalent for zero balance)
    if (tokenAmount === 0) {
      emptyAccounts.push({
        accountAddress: account.pubkey.toBase58(),
        mintAddress: parsedInfo.mint,
        tokenSymbol: 'Unknown',
        tokenName: 'Empty Account',
        balance: 0,
        isClosable: true,
        rentLamports: DEFAULT_ACCOUNT_RENT_LAMPORTS,
        rentSol: DEFAULT_ACCOUNT_RENT_LAMPORTS / LAMPORTS_PER_SOL,
        rentUsd: (DEFAULT_ACCOUNT_RENT_LAMPORTS / LAMPORTS_PER_SOL) * SOL_PRICE_ESTIMATE_USD,
        programId: account.account.owner.toBase58() // Token or Token2022
      });
    }
  }

  return calculateRentSummary(walletPubKeyStr, emptyAccounts);
}

/**
 * 2. Rent Summary Math
 */
function calculateRentSummary(walletAddress, accounts) {
  const closableAccounts = accounts.filter(a => a.isClosable && a.balance === 0);
  const totalRentLamports = closableAccounts.reduce((sum, a) => sum + a.rentLamports, 0);
  const totalRentSol = totalRentLamports / LAMPORTS_PER_SOL;
  const netRentSol = Math.max(0, totalRentSol - (TRANSACTION_FEE_LAMPORTS / LAMPORTS_PER_SOL));
  const totalRentUsd = totalRentSol * SOL_PRICE_ESTIMATE_USD;
  const netRentUsd = netRentSol * SOL_PRICE_ESTIMATE_USD;

  return {
    walletAddress,
    scanTimestamp: new Date().toISOString(),
    totalEmptyAccountsCount: closableAccounts.length,
    rentPerAccountSol: DEFAULT_ACCOUNT_RENT_LAMPORTS / LAMPORTS_PER_SOL,
    summary: {
      totalRentLamports,
      totalRentSol: parseFloat(totalRentSol.toFixed(6)),
      totalRentUsd: parseFloat(totalRentUsd.toFixed(2)),
      estimatedTxFeeSol: TRANSACTION_FEE_LAMPORTS / LAMPORTS_PER_SOL,
      netRecoverableSol: parseFloat(netRentSol.toFixed(6)),
      netRecoverableUsd: parseFloat(netRentUsd.toFixed(2))
    },
    emptyAccounts: closableAccounts
  };
}

/**
 * 3. Generate Live Unsigned Transaction
 */
async function buildCloseAccountTransaction(walletPubKeyStr, accountAddressesToClose = []) {
  if (!isValidSolanaPublicKey(walletPubKeyStr)) {
    throw new Error(`Invalid Solana wallet address`);
  }

  const walletOwnerPubKey = toPublicKey(walletPubKeyStr);
  const transaction = new Transaction();
  const addedInstructions = [];

  for (const accObj of accountAddressesToClose) {
    try {
      const accountPubKey = toPublicKey(accObj.accountAddress);
      const programId = toPublicKey(accObj.programId || TOKEN_PROGRAM_ID.toBase58());

      const ix = createCloseAccountInstruction(
        accountPubKey,
        walletOwnerPubKey, // destination for refunded SOL lamports
        walletOwnerPubKey, // account owner authority
        [],
        programId
      );
      transaction.add(ix);
      addedInstructions.push({
        type: 'CloseAccount',
        tokenAccount: accountPubKey.toBase58(),
        refundDestination: walletOwnerPubKey.toBase58(),
        programId: programId.toBase58()
      });
    } catch (err) {
      console.warn(`Skipping invalid account '${accObj.accountAddress}':`, err.message);
    }
  }

  // Get live blockhash
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = walletOwnerPubKey;

  let rawBase64 = '';
  try {
    const serialized = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
    rawBase64 = serialized.toString('base64');
  } catch (err) {
    rawBase64 = '';
  }

  const grossRentSol = (addedInstructions.length * DEFAULT_ACCOUNT_RENT_LAMPORTS) / LAMPORTS_PER_SOL;

  return {
    success: true,
    module: 'MODULE_2_LIVE_SOLANA_RENT_RECOVERY',
    walletAddress: walletPubKeyStr,
    accountsClosedCount: addedInstructions.length,
    grossRentReclaimedSol: parseFloat(grossRentSol.toFixed(6)),
    grossRentReclaimedUsd: parseFloat((grossRentSol * SOL_PRICE_ESTIMATE_USD).toFixed(2)),
    instructionsCount: addedInstructions.length,
    instructions: addedInstructions,
    transactionPayload: {
      feePayer: walletOwnerPubKey.toBase58(),
      recentBlockhash: blockhash,
      serializedTransactionBase64: rawBase64
    },
    securityGuarantee: 'Non-custodial. Signature required by user Phantom/Solflare wallet.'
  };
}

module.exports = {
  LAMPORTS_PER_SOL,
  DEFAULT_ACCOUNT_RENT_LAMPORTS,
  isValidSolanaPublicKey,
  findEmptyTokenAccounts,
  calculateRentSummary,
  buildCloseAccountTransaction
};
