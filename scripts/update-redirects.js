const fs = require('fs');
const path = require('path');

const files = [
  'src/app/dashboard/layout.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/dashboard/clients/page.tsx',
  'src/app/dashboard/portal/page.tsx',
  'src/app/dashboard/renewals/page.tsx',
  'src/app/dashboard/risk/page.tsx',
  'src/app/dashboard/settings/page.tsx',
  'src/app/dashboard/settings/billing/page.tsx',
  'src/app/dashboard/settings/branding/page.tsx',
  'src/app/dashboard/settings/email-campaigns/page.tsx',
  'src/app/dashboard/settings/notifications/page.tsx',
  'src/app/dashboard/settings/profile/page.tsx',
  'src/app/dashboard/settings/team/page.tsx'
];

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/redirect\(["']\/sign-in["']\)/g, 'redirect("/api/auth/login")');
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${file}`);
  } else {
    console.warn(`File ${file} not found`);
  }
});
