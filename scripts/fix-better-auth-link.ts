/**
 * Fix Better Auth user ID linking
 * This script updates the users table to set betterAuthUserId for existing users
 */

const { neon: neonClient2 } = require('@neondatabase/serverless');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function fixBetterAuthLink() {
  console.log('Fixing Better Auth user ID linking...');

  try {
    const sql = neonClient2(connectionString);

    // Get all users
    const users = await sql`
      SELECT id, email FROM users
    `;

    console.log(`Found ${users.length} users in users table`);

    // Get Better Auth users
    const betterAuthUsers = await sql`
      SELECT id, email FROM "user"
    `;

    console.log(`Found ${betterAuthUsers.length} users in Better Auth user table`);

    // Link users by email
    let updated = 0;
    for (const user of users) {
      const betterAuthUser = betterAuthUsers.find((ba: any) => ba.email === user.email);
      if (betterAuthUser) {
        await sql`
          UPDATE users
          SET better_auth_user_id = ${betterAuthUser.id}
          WHERE id = ${user.id}
        `;
        updated++;
        console.log(`Linked user ${user.email} with Better Auth ID ${betterAuthUser.id}`);
      }
    }

    console.log(`Successfully linked ${updated} users`);
  } catch (error) {
    console.error('Error fixing Better Auth link:', error);
    process.exit(1);
  }
}

fixBetterAuthLink();
