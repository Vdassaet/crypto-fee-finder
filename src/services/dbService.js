/**
 * ChainRecover AI - Database Service Wrapper (Prisma ORM with Standalone Fallback)
 */

let prisma = null;

try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (e) {
  // Prisma client optional if running standalone
}

/**
 * Gets Prisma client instance or returns fallback status
 */
function getDbClient() {
  return prisma;
}

/**
 * Checks database health
 */
async function checkDatabaseHealth() {
  if (!prisma) {
    return { status: 'STANDALONE_IN_MEMORY', connected: true };
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'POSTGRES_CONNECTED', connected: true };
  } catch (err) {
    return { status: 'DATABASE_DISCONNECTED', connected: false, error: err.message };
  }
}

module.exports = {
  getDbClient,
  checkDatabaseHealth
};
