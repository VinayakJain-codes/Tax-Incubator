const XLSX = require('xlsx');
const fs = require('fs');

const EXCEL_FILE = 'Group_Governance_and_Control_v6_SJ Comments.xlsx';
const SCHEMA_FILE = 'schema.sql';

const SHEET_TABLE_MAP = {
  'Entity_Master':        'entities',
  'Addresses':            'addresses',
  'Directors_Officers':   'directors_officers',
  'UBO_Register':         'ubo_register',
  'Bank_Accounts':        'bank_accounts',
  'Signatories':          'signatories',
  'VAT_Regulatory_Matrix':'vat_matrix',
  'CT_Regulatory_Matrix': 'ct_matrix',
  'Licenses_Regulatory':  'licenses',
  'Auditors':             'auditors',
  'Document_Control':     'document_control',
  'Controls_Log':         'controls_log',
  'Renewal_Calendar':     'renewal_calendar',
};

function cleanHeader(h) {
  return String(h)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function parseSchema() {
  const content = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  const tableCols = {};
  let currentTable = null;
  
  for (const line of content.split('\n')) {
    const tableMatch = line.match(/create table public\.(\w+)/i);
    if (tableMatch) {
      currentTable = tableMatch[1];
      tableCols[currentTable] = new Set();
      continue;
    }
    
    if (currentTable && line.trim().startsWith(');')) {
      currentTable = null;
      continue;
    }
    
    if (currentTable) {
      const colMatch = line.trim().match(/^([a-z0-9_]+)\s+/i);
      if (colMatch) {
        tableCols[currentTable].add(colMatch[1].toLowerCase());
      }
    }
  }
  return tableCols;
}

try {
  const schemaCols = parseSchema();
  const workbook = XLSX.readFile(EXCEL_FILE);
  const report = [];

  for (const sheetName of workbook.SheetNames) {
    const tableName = SHEET_TABLE_MAP[sheetName];
    if (!tableName) continue;

    const ws = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(ws, { defval: null });
    
    if (rawRows.length === 0) continue;

    const headers = Object.keys(rawRows[0]).map(k => ({
      original: k,
      cleaned: cleanHeader(k)
    }));
    
    const tableFields = schemaCols[tableName] || new Set();
    const missing = headers.filter(h => h.cleaned && !tableFields.has(h.cleaned));
    
    if (missing.length > 0) {
      report.push({
        sheet: sheetName,
        table: tableName,
        missingFields: missing
      });
    }
  }

  fs.writeFileSync('scan-report.json', JSON.stringify(report, null, 2), 'utf-8');

} catch (err) {
  console.error("Error:", err);
}
