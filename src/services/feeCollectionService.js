/**
 * ChainRecover AI - Fee Collection Service
 * 
 * Replicates refundyoursol.com fee model:
 * - Injects a SystemProgram.transfer instruction into the close-accounts TX
 * - Transfers a configurable % of recovered rent to the platform fee wallet
 * - User signs ONE transaction that closes accounts + pays fee atomically
 * - Non-custodial: no private keys ever touch the server
 */

const {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');
const { createCloseAccountInstruction, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const { withRetry } = require('./solanaRpcManager');

// ── Configuration ──────────────────────────────────────────────────────────
const FEE_WALLET_ADDRESS = process.env.FEE_WALLET_ADDRESS || '';
const FEE_PERCENT = parseFloat(process.env.FEE_PERCENT) || 15;

const DEFAULT_ACCOUNT_RENT_LAMPORTS = 2039280; // ~0.00203928 SOL per token account
const SOL_PRICE_ESTIMATE_USD = 180.0;
const TRANSACTION_FEE_LAMPORTS = 5000; // Solana base tx fee

/**
 * Calculate the fee breakdown for display in the UI
 * @param {number} totalRentLamports - Total rent recoverable in lamports
 * @returns {Object} Breakdown with gross, fee, net amounts
 */
function calculateFeeBreakdown(totalRentLamports) {
  const feePercent = FEE_PERCENT;
  const grossLamports = totalRentLamports;
  const feeLamports = Math.floor(grossLamports * (feePercent / 100));
  const netLamports = grossLamports - feeLamports - TRANSACTION_FEE_LAMPORTS;

  return {
    feePercent,
    feeWalletAddress: FEE_WALLET_ADDRESS || 'NOT_CONFIGURED',
    grossRecoverableLamports: grossLamports,
    grossRecoverableSol: parseFloat((grossLamports / LAMPORTS_PER_SOL).toFixed(6)),
    grossRecoverableUsd: parseFloat(((grossLamports / LAMPORTS_PER_SOL) * SOL_PRICE_ESTIMATE_USD).toFixed(2)),
    serviceFee: {
      percent: feePercent,
      lamports: feeLamports,
      sol: parseFloat((feeLamports / LAMPORTS_PER_SOL).toFixed(6)),
      usd: parseFloat(((feeLamports / LAMPORTS_PER_SOL) * SOL_PRICE_ESTIMATE_USD).toFixed(2))
    },
    networkFee: {
      lamports: TRANSACTION_FEE_LAMPORTS,
      sol: parseFloat((TRANSACTION_FEE_LAMPORTS / LAMPORTS_PER_SOL).toFixed(6)),
      usd: parseFloat(((TRANSACTION_FEE_LAMPORTS / LAMPORTS_PER_SOL) * SOL_PRICE_ESTIMATE_USD).toFixed(4))
    },
    netReceivable: {
      lamports: Math.max(0, netLamports),
      sol: parseFloat((Math.max(0, netLamports) / LAMPORTS_PER_SOL).toFixed(6)),
      usd: parseFloat(((Math.max(0, netLamports) / LAMPORTS_PER_SOL) * SOL_PRICE_ESTIMATE_USD).toFixed(2))
    }
  };
}

/**
 * Build a close-accounts transaction WITH an embedded fee transfer.
 * 
 * The transaction atomically:
 * 1. Closes each empty token account -> rent returns to user
 * 2. Transfers fee % from user wallet -> platform fee wallet
 * 
 * User signs ONE transaction in Phantom/Solflare for everything.
 * 
 * @param {string} walletPubKeyStr - User's Solana public key
 * @param {Array} accountAddressesToClose - Array of { accountAddress, programId }
 * @returns {Object} Transaction payload + fee breakdown
 */
async function buildCloseWithFeeTransaction(walletPubKeyStr, accountAddressesToClose = []) {
  // Validate wallet address
  let walletOwnerPubKey;
  try {
    walletOwnerPubKey = new PublicKey(walletPubKeyStr);
  } catch (err) {
    throw new Error("Invalid Solana wallet address: '" + walletPubKeyStr + "'");
  }

  if (accountAddressesToClose.length === 0) {
    throw new Error('No accounts provided to close.');
  }

  const transaction = new Transaction();
  const addedInstructions = [];
  let totalRentRecoverable = 0;

  // ── Step 1: Add CloseAccount instructions ──────────────────────────────
  for (const accObj of accountAddressesToClose) {
    try {
      const accountPubKey = new PublicKey(accObj.accountAddress);
      const programId = new PublicKey(accObj.programId || TOKEN_PROGRAM_ID.toBase58());

      const ix = createCloseAccountInstruction(
        accountPubKey,        // token account to close
        walletOwnerPubKey,    // destination for refunded rent lamports
        walletOwnerPubKey,    // account owner (signer)
        [],                   // multisig signers (none)
        programId             // SPL Token or Token-2022
      );
      transaction.add(ix);
      addedInstructions.push({
        type: 'CloseAccount',
        tokenAccount: accountPubKey.toBase58(),
        refundDestination: walletOwnerPubKey.toBase58(),
        programId: programId.toBase58()
      });
      totalRentRecoverable += DEFAULT_ACCOUNT_RENT_LAMPORTS;
    } catch (err) {
      console.warn("[FeeCollection] Skipping invalid account '" + accObj.accountAddress + "':", err.message);
    }
  }

  if (addedInstructions.length === 0) {
    throw new Error('No valid accounts could be processed for closing.');
  }

  // ── Step 2: Add fee transfer instruction ───────────────────────────────
  const feeBreakdown = calculateFeeBreakdown(totalRentRecoverable);
  let feeTransferIncluded = false;

  if (FEE_WALLET_ADDRESS && feeBreakdown.serviceFee.lamports > 0) {
    try {
      const feeRecipient = new PublicKey(FEE_WALLET_ADDRESS);
      
      const feeTransferIx = SystemProgram.transfer({
        fromPubkey: walletOwnerPubKey,
        toPubkey: feeRecipient,
        lamports: feeBreakdown.serviceFee.lamports
      });
      transaction.add(feeTransferIx);
      
      addedInstructions.push({
        type: 'FeeTransfer',
        from: walletOwnerPubKey.toBase58(),
        to: feeRecipient.toBase58(),
        lamports: feeBreakdown.serviceFee.lamports,
        sol: feeBreakdown.serviceFee.sol,
        description: FEE_PERCENT + '% service fee on recovered rent'
      });
      feeTransferIncluded = true;
    } catch (err) {
      console.warn('[FeeCollection] Invalid FEE_WALLET_ADDRESS, skipping fee transfer:', err.message);
    }
  }

  // ── Step 3: Set blockhash and serialize ────────────────────────────────
  const { blockhash, lastValidBlockHeight } = await withRetry(async function(conn) {
    return conn.getLatestBlockhash('confirmed');
  });
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = walletOwnerPubKey;

  let serializedBase64 = '';
  try {
    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });
    serializedBase64 = serialized.toString('base64');
  } catch (err) {
    console.error('[FeeCollection] Serialization error:', err.message);
    throw new Error('Failed to serialize transaction. Too many accounts may exceed transaction size limit.');
  }

  return {
    success: true,
    module: 'SOLANA_RENT_RECOVERY_WITH_FEE',
    walletAddress: walletPubKeyStr,
    accountsToClose: addedInstructions.filter(function(i) { return i.type === 'CloseAccount'; }).length,
    feeTransferIncluded,
    feeBreakdown,
    instructions: addedInstructions,
    transactionPayload: {
      feePayer: walletOwnerPubKey.toBase58(),
      recentBlockhash: blockhash,
      lastValidBlockHeight,
      serializedTransactionBase64: serializedBase64
    },
    securityGuarantee: 'Non-custodial. Transaction requires explicit wallet signature. No private keys are ever handled by the server.'
  };
}

module.exports = {
  FEE_WALLET_ADDRESS,
  FEE_PERCENT,
  calculateFeeBreakdown,
  buildCloseWithFeeTransaction
};
