const fs = require('fs');
const path = require('path');

const files = [
  'src/app/dashboard/risk/page.tsx',
  'src/app/dashboard/settings/page.tsx',
  'src/app/dashboard/settings/billing/page.tsx',
  'src/app/dashboard/settings/branding/page.tsx',
  'src/app/dashboard/settings/email-campaigns/page.tsx',
  'src/app/dashboard/settings/notifications/page.tsx',
  'src/app/dashboard/settings/profile/page.tsx',
  'src/app/dashboard/settings/team/page.tsx',
  'src/app/dashboard/renewals/page.tsx',
  'src/app/dashboard/clients/page.tsx',
  'src/app/dashboard/portal/page.tsx'
];

files.forEach(file => {
  const absolutePath = path.join(process.cwd(), file);
  if (!fs.existsSync(absolutePath)) return;
  
  let content = fs.readFileSync(absolutePath, 'utf8');
  
  // Replace import
  content = content.replace(/import { auth } from ["']@\/lib\/better-auth["'];/g, 'import { withAuth } from "@workos-inc/authkit-nextjs";');
  
  // Replace session call
  content = content.replace(/const headersList = await headers\(\);\s+const session = await auth\.api\.getSession\({ headers: headersList }\);/g, 'const session = await withAuth();');
  
  // Handle variations where headers might be used later or imported differently
  content = content.replace(/const session = await auth\.api\.getSession\({ headers: headersList }\);/g, 'const session = await withAuth();');

  fs.writeFileSync(absolutePath, content);
  console.log(`Updated ${file}`);
});
