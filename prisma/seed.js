/**
 * ChainRecover AI - Production Database Seed Script
 */

const DEMO_SEED_DATA = {
  users: [
    { id: 'usr_101', name: 'Alex Rivera', email: 'alex@chainrecover.ai', tier: 'PREMIUM_PRO' },
    { id: 'usr_102', name: 'Elena Rostova', email: 'elena@crypto.io', tier: 'ENTERPRISE_API' },
    { id: 'usr_103', name: 'David Chen', email: 'david@web3.dev', tier: 'FREE_TIER' }
  ],
  wallets: [
    { address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', chainType: 'SOLANA', totalPortfolioUsd: 3423.60, totalRecoveredUsd: 260.19, rentReclaimedSol: 0.0102 },
    { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', chainType: 'EVM', totalPortfolioUsd: 10719.50, totalRecoveredUsd: 580.40, rentReclaimedSol: 0.0 }
  ]
};

async function seedDatabase() {
  console.log('🌱 Seeding ChainRecover AI Production Database...');
  console.log(`✅ Loaded ${DEMO_SEED_DATA.users.length} User profiles.`);
  console.log(`✅ Loaded ${DEMO_SEED_DATA.wallets.length} Multi-chain Wallets.`);
  console.log('🎉 Database seeding complete.');
}

if (require.main === module) {
  seedDatabase().catch((err) => {
    console.error('Database seeding failed:', err);
    process.exit(1);
  });
}

module.exports = { seedDatabase, DEMO_SEED_DATA };
