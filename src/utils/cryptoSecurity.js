/**
 * ChainRecover AI - Crypto Security & Encryption Utilities
 * 
 * Guarantees:
 * - Never accepts seed phrases (12/24 words) or private keys (standalone 64-char hex / 88-char base58).
 * - AES-256-GCM encryption & decryption for sensitive session payloads.
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_SECRET || crypto.randomBytes(32);

/**
 * STRICT SECURITY POLICY: Throws error if any standalone seed phrase or private key is detected
 */
function assertNoPrivateKeysOrSeedPhrases(input) {
  if (!input) return;
  const str = typeof input === 'string' ? input : JSON.stringify(input);

  // Allow standard EVM 4-byte selector + padded calldata (starts with 0x095ea7b3, 0x38ed1739, etc.)
  if (typeof input === 'string' && /^0x[a-fA-F0-9]{8,}/.test(input) && input.length > 70) {
    return; // Valid EVM Transaction Calldata
  }

  // Check for 12/24 word BIP39 seed phrases
  const wordCount = str.trim().split(/\s+/).length;
  if ((wordCount === 12 || wordCount === 24) && /^[a-z\s]+$/i.test(str.trim())) {
    throw new Error('SECURITY VIOLATION: Seed phrases are strictly prohibited. ChainRecover AI uses wallet signatures only.');
  }

  // Check for standalone 64-character EVM private keys
  if (/^0x[a-fA-F0-9]{64}$/.test(str.trim()) || /^[a-fA-F0-9]{64}$/.test(str.trim())) {
    throw new Error('SECURITY VIOLATION: Private keys are strictly prohibited. ChainRecover AI uses wallet signatures only.');
  }

  // Check for standalone 88-character Solana base58 private keys
  if (/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(str.trim())) {
    throw new Error('SECURITY VIOLATION: Private keys are strictly prohibited. ChainRecover AI uses wallet signatures only.');
  }
}

/**
 * AES-256-GCM Encrypt Payload
 */
function encryptPayload(text) {
  assertNoPrivateKeysOrSeedPhrases(text);
  const iv = crypto.randomBytes(12);
  const key = Buffer.isBuffer(SECRET_KEY) ? SECRET_KEY : crypto.scryptSync(SECRET_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag
  };
}

/**
 * AES-256-GCM Decrypt Payload
 */
function decryptPayload({ iv, encryptedData, authTag }) {
  const key = Buffer.isBuffer(SECRET_KEY) ? SECRET_KEY : crypto.scryptSync(SECRET_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  assertNoPrivateKeysOrSeedPhrases(decrypted);
  return decrypted;
}

module.exports = {
  assertNoPrivateKeysOrSeedPhrases,
  encryptPayload,
  decryptPayload
};
