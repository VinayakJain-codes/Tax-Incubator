# Missing Excel Columns vs Database Schema

## Goal
The Excel file `Group_Governance_and_Control_v6_SJ Comments.xlsx` was scanned against the target database schema `schema.sql`. Many columns appear "missing", but most of this is due to a mismatch between exact Excel header titles and clean database column names in `schema.sql`. 
The goal of this phase is to fix the ingestion script (`upload-excel.mjs`) by implementing an explicit mapping dictionary, and additionally identify & resolve any genuinely missing columns in the DB or the front-end dashboard.

## Findings from the Scan
The simple `cleanHeader()` regex in `upload-excel.mjs` changes Excel headers into literal db columns that don't match the existing `schema.sql`. 

Examples of mismatches that just need a mapping in `upload-excel.mjs`:
- `Address Type (Registered/Admin/Operational)` -> should map to `address_type`
- `ID / Passport No` -> should map to `passport_no`
- `Photo (Insert Image)` -> should map to `photo_asset_image`
- `Logo (Insert Image)` -> should map to `logo_asset_image`
- `Tax Identification Number` -> should map to `tin`
- `Corporate Tax Applicable (Y/N)` -> should map to `ct_applicable`
- `Economic Substance (Y/N)` -> should map to `economic_substance`
- `Return Filing Frequency` -> should map to `filing_frequency`
- `Return Filing Due Date` -> should map to `return_due_date`
- `Active (Y/N)` -> should map to `active`
- `Licese Link` -> should map to `license_link`
- `Auditor ID` -> should map to `auditor_code`
- `Audit Firm Name` -> should map to `firm_name`

Examples of Auto/Formula fields in Excel that should NOT be uploaded directly (or should be computed/handled on the frontend):
- `Regulatory Group (auto)` 
- `Risk rating (auto)`
- `Days to Expiry (Auto)`
- `Days to Due (Auto)`
- `Next Due Date (Auto)`
- `RAG (Auto)`
- `Filing Status (Auto)`
- `Reminder Flag (Auto)`

## Proposed Execution Plan Requirements
1. **Update `upload-excel.mjs`**: 
   - Introduce an explicit `HEADER_MAP` mapping exactly these complex Excel headers to the cleaner `schema.sql` column names.
   - Refactor the row processor to use this map if a key exists; fall back to `cleanHeader()` if it doesn't.
   - Exclude the `(Auto)` mapped columns entirely from the Supabase insert payload, to prevent insert errors.
2. **Review `schema.sql`**: Ensure no critical, user-entered data column is actually missing. If one is, create an `ALTER TABLE` SQL file to add it.
3. **Verify Uploads**: Run `upload-excel.mjs` to ensure the data ingests cleanly without missing column/field errors hitting Supabase.
