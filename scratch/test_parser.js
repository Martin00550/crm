
const csvText = `client_name,client_email,client_phone,client_industry,policy_number,carrier,policy_type,premium,effective_date,expiration_date,status
"Acme Corp","contact@acme.com","555-123-4567","Manufacturing","GLA-123456","Travelers","General Liability","15000","2024-01-01","2025-01-01","active"
"Tech Solutions","info@techsolutions.com","555-987-6543","Technology","BOP-789012","The Hartford","Business Owners Policy","8500","2024-03-15","2025-03-15","active"`;

function parseCSV(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  const lines = cleanText.split(/\r?\n/);
  
  const headerLine = lines[0];
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  const splitCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase());
  console.log('Headers:', headers);
  
  const columnMap = {
    'client_name': 'clientName',
    'policy_number': 'policyNumber',
    // ... other maps
  };

  const mappedHeaders = headers.map(h => columnMap[h] || h);
  console.log('Mapped Headers:', mappedHeaders);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = splitCSVLine(lines[i]);
    const row = {};
    mappedHeaders.forEach((header, index) => {
      if (header && values[index] !== undefined) {
        row[header] = values[index];
      }
    });
    if (row.clientName || row.policyNumber) {
      rows.push(row);
    }
  }
  return rows;
}

const result = parseCSV(csvText);
console.log('Result length:', result.length);
console.log('First row:', result[0]);
