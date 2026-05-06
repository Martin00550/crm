const fs = require('fs');

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  
  const columnMap = {
    'client_name': 'clientName',
    'policy_number': 'policyNumber',
    'carrier': 'carrier',
    'policy_type': 'policyType',
    'premium': 'premium',
    'expiration_date': 'expirationDate',
  };

  const mappedHeaders = headers.map(h => columnMap[h] || h);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
    const row = {};
    
    mappedHeaders.forEach((header, index) => {
      if (header && values[index]) {
        row[header] = values[index];
      }
    });
    
    if (row.clientName || row.policyNumber) {
      rows.push(row);
    }
  }

  return rows;
}

function validateRow(row) {
  const errors = [];
  if (!row.clientName) errors.push('Missing client name');
  if (!row.policyNumber) errors.push('Missing policy number');
  if (!row.carrier) errors.push('Missing carrier');
  if (!row.policyType) errors.push('Missing policy type');
  if (!row.premium || isNaN(parseFloat(row.premium))) errors.push('Invalid premium amount');
  if (!row.expirationDate) errors.push('Missing expiration date');
  return { valid: errors.length === 0, errors };
}

try {
  const csvText = fs.readFileSync('test_import.csv', 'utf8');
  console.log('--- CSV Content ---');
  console.log(csvText);
  
  const rows = parseCSV(csvText);
  console.log('\n--- Parsed Rows ---');
  console.log(JSON.stringify(rows, null, 2));
  
  console.log('\n--- Validation Results ---');
  rows.forEach((row, i) => {
    const result = validateRow(row);
    console.log(`Row ${i + 1}: ${result.valid ? 'VALID' : 'INVALID'} ${result.errors.join(', ')}`);
  });
} catch (error) {
  console.error('Error:', error.message);
}
