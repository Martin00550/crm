const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { agencies } = require('./src/db/schema.js');

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function updateAgencyTier() {
  try {
    // Update first agency to Enterprise tier
    await db
      .update(agencies)
      .set({ subscriptionTier: 'enterprise' })
      .where(eq(agencies.id, 'your-agency-id-here')); // You'll need to get the actual ID
    
    console.log('Agency tier updated to enterprise');
  } catch (error) {
    console.error('Error updating agency tier:', error);
  }
}

updateAgencyTier();
