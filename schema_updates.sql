-- ============================================================
-- schema_updates.sql
-- Apply these in your Supabase SQL Editor to bring the
-- live database in line with schema.sql
-- ============================================================

-- 1. UBO Register — missing columns in live DB
ALTER TABLE public.ubo_register
  ADD COLUMN IF NOT EXISTS entity_legal_name text,
  ADD COLUMN IF NOT EXISTS photo_asset_image text;

-- 2. Bank Accounts — missing columns in live DB
ALTER TABLE public.bank_accounts
  ADD COLUMN IF NOT EXISTS entity_legal_name text,
  ADD COLUMN IF NOT EXISTS bank_account_id text;

-- 3. Signatories — missing columns in live DB
ALTER TABLE public.signatories
  ADD COLUMN IF NOT EXISTS signatory_id text;

-- 4. VAT Matrix — add entity_legal_name
ALTER TABLE public.vat_matrix
  ADD COLUMN IF NOT EXISTS entity_legal_name text;

-- 5. CT Regulatory Matrix — missing columns in live DB
ALTER TABLE public.ct_matrix
  ADD COLUMN IF NOT EXISTS entity_legal_name text,
  ADD COLUMN IF NOT EXISTS data_protection_regime text;

-- 6. Licenses — add entity_legal_name
ALTER TABLE public.licenses
  ADD COLUMN IF NOT EXISTS entity_legal_name text;

-- 7. Auditors — add entity_legal_name
ALTER TABLE public.auditors
  ADD COLUMN IF NOT EXISTS entity_legal_name text;

-- 8. Document Control — add entity_legal_name (for consistency)
ALTER TABLE public.document_control
  ADD COLUMN IF NOT EXISTS entity_legal_name text;

-- 9. Controls Log — add entity_legal_name (for consistency)
ALTER TABLE public.controls_log
  ADD COLUMN IF NOT EXISTS entity_legal_name text;

-- 10. Renewal Calendar — missing columns in live DB
ALTER TABLE public.renewal_calendar
  ADD COLUMN IF NOT EXISTS entity_legal_name text,
  ADD COLUMN IF NOT EXISTS item_id text;

-- ============================================================
-- IMPORTANT FIX NEEDED IN SUPABASE LIVE DB:
-- The signatories table has bank_account_id referencing bank_accounts
-- but the live DB may have it as a UUID FK instead of a text field.
-- If you see error: invalid input syntax for type uuid: "B-001"
-- Run this fix:
-- ============================================================

-- Fix: Drop incorrect FK constraint and re-add bank_account_id as text
ALTER TABLE public.signatories
  DROP CONSTRAINT IF EXISTS signatories_bank_account_id_fkey;

-- If the column type is wrong:
-- ALTER TABLE public.signatories ALTER COLUMN bank_account_id TYPE text USING bank_account_id::text;

