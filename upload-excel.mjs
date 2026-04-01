/**
 * upload-excel.mjs
 * Reads all sheets from the Excel file and uploads data to Supabase.
 * Run: node upload-excel.mjs
 */

import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIG ---
const SUPABASE_URL = 'https://uqkauaqlysffhzdqhwhv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxa2F1YXFseXNmZmh6ZHFod2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODY3NTgsImV4cCI6MjA5MDQ2Mjc1OH0.9uf9nB1G1cjaMenBOVTGdeo2CtItCHbF98K8cFNOHBY';
const EXCEL_FILE = 'Group_Governance_and_Control_v6_SJ Comments.xlsx';

// Map Excel sheet names → Supabase table names
// Adjust these mappings to match the actual sheet names in your Excel file
const SHEET_TABLE_MAP = {
  'Entity Master':        'entities',
  'Entities':             'entities',
  'Addresses':            'addresses',
  'Directors & Officers': 'directors_officers',
  'Directors':            'directors_officers',
  'UBO Register':         'ubo_register',
  'UBO':                  'ubo_register',
  'Bank Accounts':        'bank_accounts',
  'Banks':                'bank_accounts',
  'Signatories':          'signatories',
  'VAT Matrix':           'vat_matrix',
  'VAT':                  'vat_matrix',
  'CT Matrix':            'ct_matrix',
  'CT':                   'ct_matrix',
  'Licenses':             'licenses',
  'Licenses & Regulatory':'licenses',
  'Auditors':             'auditors',
  'Document Control':     'document_control',
  'Documents':            'document_control',
  'Controls Log':         'controls_log',
  'Controls':             'controls_log',
  'Renewal Calendar':     'renewal_calendar',
  'Renewals':             'renewal_calendar',
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

function cleanRow(row) {
  const cleaned = {};
  for (const [k, v] of Object.entries(row)) {
    const key = cleanHeader(k);
    if (!key || key === '') continue;
    // Convert Excel date serials to ISO strings
    if (typeof v === 'number' && key.includes('date') || key.includes('_at')) {
      try {
        const d = XLSX.SSF.parse_date_code(v);
        cleaned[key] = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
      } catch {
        cleaned[key] = v;
      }
    } else {
      cleaned[key] = v === '' || v === null || v === undefined ? null : v;
    }
  }
  return cleaned;
}

async function uploadSheet(sheetName, tableName, rows) {
  console.log(`\n📤 Uploading sheet "${sheetName}" → table "${tableName}" (${rows.length} rows)...`);
  
  // Upload in chunks of 50 to avoid payload limits
  const CHUNK = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from(tableName).insert(chunk);
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

    // Clean all rows
    const rows = rawRows.map(cleanRow);
    // Remove rows where all values are null (blank rows)
    const nonEmpty = rows.filter(r => Object.values(r).some(v => v !== null));

    await uploadSheet(sheetName, tableName, nonEmpty);
    matched++;
  }

  console.log(`\n🎉 Done! ${matched} sheets uploaded, ${skipped} skipped.`);
  console.log('👉 Refresh your dashboard at http://localhost:3000/dashboard to see the data.');
}

main().catch(console.error);
