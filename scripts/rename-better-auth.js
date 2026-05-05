const fs = require('fs');
const path = require('path');

const files = [
  'src/actions/data.ts',
  'src/app/api/user/delete/route.ts',
  'src/db/schema.ts',
  'src/lib/auth-wrapper.ts',
  'src/lib/env.ts'
];

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Rename betterAuthUserId to workosUserId
    content = content.replace(/betterAuthUserId/g, 'workosUserId');
    content = content.replace(/better_auth_user_id/g, 'workos_user_id');
    content = content.replace(/Better Auth/g, 'WorkOS');
    content = content.replace(/better-auth/g, 'WorkOS');
    content = content.replace(/users_better_auth_user_id_idx/g, 'users_workos_user_id_idx');
    
    // In schema.ts, remove the obsolete tables if we are in schema.ts
    if (file === 'src/db/schema.ts') {
        // Remove export const user, session, account, verification
        content = content.replace(/\/\/ WorkOS user table \(required by WorkOS\)\nexport const user = pgTable\('user', \{[\s\S]*?\}\);\n\n/, '');
        content = content.replace(/\/\/ WorkOS session table\nexport const session = pgTable\('session', \{[\s\S]*?\}\);\n\n/, '');
        content = content.replace(/\/\/ WorkOS account table \(for OAuth providers\)\nexport const account = pgTable\('account', \{[\s\S]*?\}\);\n\n/, '');
        content = content.replace(/\/\/ WorkOS verification table\nexport const verification = pgTable\('verification', \{[\s\S]*?\}\);\n\n/, '');
    }

    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${file}`);
  }
});
