import { config } from 'dotenv';
config();

import { seedMockData } from '@/lib/mock-data';
import { db } from '@/lib/db';

const MOCK_AGENCY_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('Seeding database...');
  
  if (!db) {
    console.error('Database not connected. Check DATABASE_URL.');
    process.exit(1);
  }
  
  try {
    const result = await seedMockData(MOCK_AGENCY_ID);
    console.log(`Seeded ${result.clients} clients and ${result.policies} policies`);
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

main();
