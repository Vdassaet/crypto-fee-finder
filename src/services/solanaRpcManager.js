/**
 * ChainRecover AI - Solana RPC Connection Manager
 * 
 * Provides a resilient Solana connection with:
 * - Multiple RPC endpoint fallback (rotates on rate limit)
 * - Automatic retry with exponential backoff
 * - Shared connection instance across all services
 */

const { Connection } = require('@solana/web3.js');

// ── RPC Endpoints (ordered by priority) ────────────────────────────────────
// The primary endpoint is configurable via .env
// Fallbacks are free public RPCs to avoid rate-limit and 403 forbidden failures
const RPC_ENDPOINTS = [
  process.env.SOLANA_RPC_URL || 'https://solana-rpc.publicnode.com',
  'https://solana-rpc.publicnode.com',
  'https://rpc.ankr.com/solana',
  'https://solana.drpc.org',
  'https://api.mainnet-beta.solana.com',
].filter(Boolean);

let currentRpcIndex = 0;

/**
 * Create a connection to the current best RPC endpoint
 */
function createConnection() {
  const url = RPC_ENDPOINTS[currentRpcIndex] || RPC_ENDPOINTS[0];
  console.log('[RPC] Using endpoint:', url.replace(/api-key=.*/, 'api-key=***'));
  return new Connection(url, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  });
}

let connection = createConnection();

/**
 * Rotate to the next RPC endpoint on failure
 */
function rotateRpc() {
  currentRpcIndex = (currentRpcIndex + 1) % RPC_ENDPOINTS.length;
  connection = createConnection();
  console.log('[RPC] Rotated to endpoint index', currentRpcIndex);
  return connection;
}

/**
 * Execute a Solana RPC call with automatic retry and RPC rotation
 * 
 * @param {Function} fn - Async function that receives a Connection and returns a result
 * @param {number} maxRetries - Maximum number of retries (default: 4)
 * @returns {Promise<*>} Result from the RPC call
 */
async function withRetry(fn, maxRetries = 4) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn(connection);
      return result;
    } catch (err) {
      lastError = err;
      const errMsg = (err.message || '').toLowerCase();
      const isRateLimit = errMsg.includes('rate limit') || 
                          errMsg.includes('429') || 
                          errMsg.includes('403') ||
                          errMsg.includes('forbidden') ||
                          errMsg.includes('access denied') ||
                          errMsg.includes('too many requests') ||
                          errMsg.includes('banned') ||
                          errMsg.includes('exceeded') ||
                          errMsg.includes('failed to fetch') ||
                          errMsg.includes('network error');
      const isTimeout = errMsg.includes('timeout') || errMsg.includes('timed out');
      const isServerError = errMsg.includes('503') || errMsg.includes('502') || errMsg.includes('500') || errMsg.includes('504');

      if (isRateLimit || isTimeout || isServerError) {
        console.warn('[RPC] Attempt ' + (attempt + 1) + '/' + (maxRetries + 1) + ' failed (' + 
          (isRateLimit ? 'rate-limited/forbidden (403/429)' : isTimeout ? 'timeout' : 'server error') + 
          '). Rotating RPC...');
        rotateRpc();
        
        // Exponential backoff: 500ms, 1s, 2s
        const delay = Math.min(500 * Math.pow(2, attempt), 4000);
        await new Promise(function(resolve) { setTimeout(resolve, delay); });
        continue;
      }
      
      // Non-retryable error (e.g. invalid address) — throw immediately
      throw err;
    }
  }
  
  throw lastError;
}

/**
 * Resiliently broadcast a raw signed transaction buffer to the Solana network
 * across rotated RPC nodes.
 * @param {Buffer|Uint8Array} rawTransaction 
 * @returns {Promise<string>} Transaction signature
 */
async function broadcastRawTransaction(rawTransaction) {
  return await withRetry(async function(conn) {
    return await conn.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });
  });
}

/**
 * Get the current active connection
 */
function getConnection() {
  return connection;
}

module.exports = {
  getConnection,
  withRetry,
  rotateRpc,
  broadcastRawTransaction,
  RPC_ENDPOINTS
};
