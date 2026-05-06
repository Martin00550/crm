const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/analytics/performance/route.ts',
  'src/app/api/bulk/route.ts',
  'src/app/api/clients/route.ts',
  'src/app/api/clients/[id]/documents/route.ts',
  'src/app/api/clients/[id]/policies/route.ts',
  'src/app/api/clients/[id]/route.ts',
  'src/app/api/documents/[id]/download/route.ts',
  'src/app/api/invite/[token]/route.ts',
  'src/app/api/notifications/archive-all/route.ts',
  'src/app/api/notifications/mark-all-read/route.ts',
  'src/app/api/notifications/route.ts',
  'src/app/api/notifications/seed/route.ts',
  'src/app/api/notifications/[id]/read/route.ts',
  'src/app/api/policies/route.ts',
  'src/app/api/policies/[id]/route.ts',
  'src/app/api/portal/config/route.ts',
  'src/app/api/portal/invite/route.ts',
  'src/app/api/risk/dashboard/route.ts'
];

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes('await db') && !content.includes('if (!db)')) {
    // Find the first instance of await db and insert check before it
    // But we need to find the beginning of the block/function
    // Simplest way: find 'await db' and insert check before the line
    const lines = content.split('\n');
    let firstIdx = lines.findIndex(line => line.includes('await db'));
    if (firstIdx !== -1) {
      // Find the indentation
      const indent = lines[firstIdx].match(/^\s*/)[0];
      const check = `\n${indent}if (!db) {\n${indent}  return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });\n${indent}}\n`;
      lines.splice(firstIdx, 0, check);
      fs.writeFileSync(fullPath, lines.join('\n'));
      console.log(`Fixed ${file}`);
    }
  }
});
