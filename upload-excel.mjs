/**
 * upload-excel.mjs
 * Reads all sheets from the Excel file and uploads data to Supabase.
 * Run: node upload-excel.mjs
 */

import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIG ---
const SUPABASE_URL = 'https://uqkauaqlysffhzdqhwhv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxa2F1YXFseXNmZmh6ZHFod2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODY3NTgsImV4cCI6MjA5MDQ2Mjc1OH0.9uf9nB1G1cjaMenBOVTGdeo2CtItCHbF98K8cFNOHBY';
const EXCEL_FILE = 'Group_Governance_and_Control_v6_SJ Comments.xlsx';

// Map Excel sheet names → Supabase table names
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
  'Renewal_Calendar':     'renewal_calendar'
};

const EXCEL_TO_DB_MAP = {
  // Shared / entity lookup
  'Entity Legal Name': 'entity_legal_name',
  'Entity Legal Name (Lookup)': 'entity_legal_name',

  // Entity Master overrides
  'Logo (Insert Image)': 'logo_asset_image',
  'Address Type (Registered/Admin/Operational)': 'address_type',

  // People (Directors, UBOs, Signatories)
  'UBO ID': 'ubo_id',
  'ID / Passport No': 'passport_no',
  'Photo (Insert Image)': 'photo_asset_image',
  'Active (Y/N)': 'active',
  'Ownership %': 'ownership_pct',
  'Date of Birth': 'dob',
  'Limit': 'limit_amount',

  // Bank Accounts
  'SWIFT/BIC': 'swift_bic',
  'Bank Account ID': 'bank_account_id',

  // VAT Matrix
  'Audit Required (Y/N)': 'audit_required',

  // CT Matrix
  'Tax Identification Number': 'tin',
  'Corporate Tax Applicable (Y/N)': 'ct_applicable',
  'Return Filing Frequency': 'filing_frequency',
  'Return Filing Due Date': 'return_due_date',
  'Economic Substance (Y/N)': 'economic_substance',
  'Transfer Pricing (Y/N)': 'transfer_pricing',
  'Data Protection Regime': 'data_protection_regime',

  // Licenses
  'Licese Link': 'license_link',        // note: typo is in the Excel file itself
  'Owner (Role/Person)': 'owner',

  // Auditors
  'Auditor ID': 'auditor_code',
  'Audit Firm Name': 'firm_name',

  // Document Control
  'Doc ID': 'doc_id',
  'Document Type': 'doc_type',
  'Document Description': 'description',
  'Responsible Person': 'responsible_person',
  'Review Status': 'review_status',

  // Controls Log
  'Control ID': 'control_id',
  'Date Logged': 'date_logged',
  'Control Type': 'control_type',
  'Risk Rating': 'risk_rating',
  'Evidence Link': 'evidence_link',
  'Due Date': 'due_date',
  'Closure Date': 'closure_date',

  // Renewal Calendar
  'Item ID': 'item_id'
};

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function cleanHeader(h) {
  // Lowercase, replace spaces with underscores, remove special chars
  return String(h)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function cleanRow(row, tableName) {
  const cleaned = {};
  for (const [k, v] of Object.entries(row)) {
    if (!k || typeof k !== 'string') continue;
    const kstr = k.toLowerCase();
    // Ignore columns generated via Excel formulas/macros, but keep (lookup) since 
    // Entity Legal Name (Lookup) is a valid user-entered field in Renewal Calendar
    if (kstr.includes('(auto)') || kstr.includes('__empty')) {
      continue;
    }

    // Special case: "Entity Legal Name" on the entities table → maps to legal_name (PK column)
    // On all other tables → maps to entity_legal_name (FK denormalized copy)
    let key;
    const trimmedK = k.trim();
    if ((trimmedK === 'Entity Legal Name' || trimmedK === 'Entity Legal Name (Lookup)') && tableName === 'entities') {
      key = 'legal_name';
    } else {
      key = EXCEL_TO_DB_MAP[trimmedK] || cleanHeader(k);
    }
    
    // Date Parsing logic
    const isDateKey = key.includes('date') || key.includes('_at') || key.includes('_expiry') || key.includes('dob');
    
    if (v !== null && v !== "" && isDateKey) {
      if (typeof v === 'number') {
        try {
          const d = XLSX.SSF.parse_date_code(v);
          cleaned[key] = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
        } catch { cleaned[key] = v; }
      } else if (typeof v === 'string') {
        const dayMonthRegex = /^(\d+)(st|nd|rd|th)\s+(January|February|March|April|May|June|July|August|September|October|November|December)$/i;
        if (dayMonthRegex.test(v.trim())) {
          const match = v.trim().match(dayMonthRegex);
          const day = match[1];
          const month = match[3];
          const currentYear = new Date().getFullYear();
          cleaned[key] = new Date(`${month} ${day}, ${currentYear}`).toISOString().split('T')[0];
        } else {
          cleaned[key] = v;
        }
      } else {
        cleaned[key] = v;
      }
    } else {
      cleaned[key] = v === '' || v === null || v === undefined ? null : v;
    }
  }
  return cleaned;
}

function parseSchema() {
  const content = readFileSync('schema.sql', 'utf-8');
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

const schemaCols = parseSchema();

async function uploadSheet(sheetName, tableName, rows) {
  console.log(`\n📤 Uploading sheet "${sheetName}" → table "${tableName}" (${rows.length} rows)...`);
  
  // Upload in chunks of 50 to avoid payload limits
  const CHUNK = 50;
  let inserted = 0;
  let errors = 0;

  const allowedCols = schemaCols[tableName] || new Set();

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK).map(row => {
      const dbRow = {};
      for (const [k, v] of Object.entries(row)) {
        if (allowedCols.has(k)) {
          dbRow[k] = v;
        }
      }
      return dbRow;
    }).filter(row => {
      // Ensure required NOT NULL columns are present to avoid bulk constraint failures
      if (tableName === 'entities' && !row.legal_name) return false;
      if (tableName === 'addresses' && !row.entity_id) return false;
      if (tableName === 'directors_officers' && !row.entity_id) return false;
      return true;
    });

    if (chunk.length === 0) continue;

    let query = supabase.from(tableName);
    // Use upsert for entities to avoid unique constraint errors
    if (tableName === 'entities') {
      query = query.upsert(chunk, { onConflict: 'entity_id' });
    } else {
      query = query.insert(chunk);
    }

    const { error } = await query;
    if (error) {
      console.error(`  ❌ Error on rows ${i}-${i+CHUNK}:`, error.message);
      errors++;
    } else {
      inserted += chunk.length;
      process.stdout.write(`  ✓ ${inserted}/${rows.length} rows\r`);
    }
  }

  if (errors === 0) {
    console.log(`  ✅ Done! ${inserted} rows uploaded.`);
  } else {
    console.log(`  ⚠️  Completed with ${errors} chunk error(s). ${inserted} rows uploaded.`);
  }
}

async function main() {
  console.log('📂 Reading Excel file:', EXCEL_FILE);
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheetNames = workbook.SheetNames;
  console.log(`📋 Found ${sheetNames.length} sheets:`, sheetNames.join(', '));

  let matched = 0;
  let skipped = 0;

  for (const sheetName of sheetNames) {
    const tableName = SHEET_TABLE_MAP[sheetName];
    if (!tableName) {
      console.log(`\n⏭️  Skipping sheet "${sheetName}" (no table mapping)`);
      skipped++;
      continue;
    }

    const ws = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(ws, { defval: null });
    
    if (rawRows.length === 0) {
      console.log(`\n⏭️  Skipping sheet "${sheetName}" (empty)`);
      skipped++;
      continue;
    }

    // Clean all rows (pass tableName so entity_legal_name vs legal_name resolves correctly)
    const rows = rawRows.map(row => cleanRow(row, tableName));
    // Remove rows where all values are null (blank rows)
    const nonEmpty = rows.filter(r => Object.values(r).some(v => v !== null));

    await uploadSheet(sheetName, tableName, nonEmpty);
    matched++;
  }

  console.log(`\n🎉 Done! ${matched} sheets uploaded, ${skipped} skipped.`);
  console.log('👉 Refresh your dashboard at http://localhost:3000/dashboard to see the data.');
}

main().catch(err => {
  writeFileSync('error.log', err.stack || String(err));
  console.error("Fatal error written to error.log");
});
