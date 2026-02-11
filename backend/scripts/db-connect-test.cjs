/**
 * Test database connectivity. Run: node scripts/db-connect-test.cjs
 * Requires DATABASE_URL (and DIRECT_URL if using Prisma migrate) in .env.
 */
require('dotenv').config({ path: '.env' });

const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!url) {
  console.error('Missing DATABASE_URL (and DIRECT_URL) in .env');
  process.exit(1);
}

// Parse host from URL for clearer errors
const m = url.match(/@([^/]+)/);
const host = m ? m[1] : '(unknown)';

if (host.startsWith('db.') && host.includes('supabase.co')) {
  console.error('You are using the DIRECT host (db.xxx.supabase.co).');
  console.error('It is often unreachable. Use the SESSION POOLER instead:');
  console.error('  Supabase → Project Settings → Database → Connection string → URI → choose "Session"');
  console.error('  Host should be: aws-0-<region>.pooler.supabase.com, port 6543');
  process.exit(1);
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma
  .$connect()
  .then(() => {
    console.log('Database reachable at', host);
    return prisma.$disconnect();
  })
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Connection failed:', e.message);
    if (e.message && e.message.includes("Can't reach")) {
      console.error('\nCheck: 1) Project not paused (Supabase dashboard → Restore if needed)');
      console.error('       2) DATABASE_URL uses Session pooler: aws-0-REGION.pooler.supabase.com:6543');
      console.error('       3) Password in URL is correct (no extra spaces)');
    }
    process.exit(1);
  });
