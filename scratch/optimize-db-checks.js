const fs = require('fs');
const path = require('path');

const files = [
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
  
  // Remove existing checks added by previous script
  content = content.replace(/\n\s*if \(!db\) \{\n\s*return NextResponse\.json\(\{ error: 'Database connection failed' \}, \{ status: 500 \}\);\n\s*\}\n/g, '');
  
  // Find the first async function or handler start and insert at the top of the body
  const lines = content.split('\n');
  const handlerIdx = lines.findIndex(line => line.includes('async (') || line.includes('async function'));
  
  if (handlerIdx !== -1) {
    let braceIdx = -1;
    for (let i = handlerIdx; i < lines.length; i++) {
        if (lines[i].includes('{')) {
            braceIdx = i;
            break;
        }
    }
    
    if (braceIdx !== -1) {
      const indent = '    '; // Default indent
      const check = `\n${indent}if (!db) {\n${indent}  return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });\n${indent}}\n`;
      lines.splice(braceIdx + 1, 0, check);
      fs.writeFileSync(fullPath, lines.join('\n'));
      console.log(`Optimized check in ${file}`);
    }
  }
});
