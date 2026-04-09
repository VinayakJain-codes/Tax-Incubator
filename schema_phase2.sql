-- ================================================================
-- Phase 2 Schema Migration
-- Run this in your Supabase SQL Editor to apply all Phase 2 changes
-- ================================================================

-- 1. Entity Master: Remove logo_asset_image column
ALTER TABLE public.entities DROP COLUMN IF EXISTS logo_asset_image;

-- 2. Addresses: Add entity_legal_name column (auto-synced by trigger)
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS entity_legal_name text;

-- 3. Signatories: Add entity_id + entity_legal_name columns
ALTER TABLE public.signatories ADD COLUMN IF NOT EXISTS entity_id text REFERENCES public.entities(entity_id);
ALTER TABLE public.signatories ADD COLUMN IF NOT EXISTS entity_legal_name text;

-- 4. CT Matrix: Remove data_protection_regime column
ALTER TABLE public.ct_matrix DROP COLUMN IF EXISTS data_protection_regime;
ALTER TABLE public.ct_matrix DROP COLUMN IF EXISTS data_protection; -- boolean toggle, also removing if present

-- 5. Compliance tables: Add is_completed boolean
ALTER TABLE public.vat_matrix    ADD COLUMN IF NOT EXISTS is_completed boolean DEFAULT false;
ALTER TABLE public.ct_matrix     ADD COLUMN IF NOT EXISTS is_completed boolean DEFAULT false;
ALTER TABLE public.licenses      ADD COLUMN IF NOT EXISTS is_completed boolean DEFAULT false;
ALTER TABLE public.auditors      ADD COLUMN IF NOT EXISTS is_completed boolean DEFAULT false;

-- 6. People tables: Add is_resigned + resignation_date
ALTER TABLE public.directors_officers ADD COLUMN IF NOT EXISTS is_resigned  boolean DEFAULT false;
ALTER TABLE public.directors_officers ADD COLUMN IF NOT EXISTS resignation_date date;

ALTER TABLE public.ubo_register ADD COLUMN IF NOT EXISTS is_resigned  boolean DEFAULT false;
ALTER TABLE public.ubo_register ADD COLUMN IF NOT EXISTS resignation_date date;

ALTER TABLE public.signatories ADD COLUMN IF NOT EXISTS is_resigned  boolean DEFAULT false;
ALTER TABLE public.signatories ADD COLUMN IF NOT EXISTS resignation_date date;

-- 7. Bank Accounts: Add is_closed + closure_date
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS is_closed   boolean DEFAULT false;
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS closure_date date;

-- 8. Deletion Requests: New table for manager approval
CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id text not null,
  entity_id text,
  record_snapshot jsonb,      -- JSON snapshot of the record at time of deletion request
  reason text not null,
  requested_by_id uuid,
  requested_by_email text,
  requested_at timestamptz default now(),
  status text default 'Pending', -- Pending | Approved | Rejected
  reviewed_by_email text,
  reviewed_at timestamptz,
  review_notes text
);

-- Enable RLS
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can insert (request deletion)
CREATE POLICY IF NOT EXISTS "Anyone can request deletion"
  ON public.deletion_requests FOR INSERT TO authenticated WITH CHECK (true);

-- Policy: Anyone authenticated can view requests
CREATE POLICY IF NOT EXISTS "Anyone can view deletion requests"
  ON public.deletion_requests FOR SELECT TO authenticated USING (true);

-- Policy: Anyone authenticated can update (for manager approval)
CREATE POLICY IF NOT EXISTS "Anyone can update deletion requests"
  ON public.deletion_requests FOR UPDATE TO authenticated USING (true);

-- 9. Sync trigger for addresses.entity_legal_name
-- (addresses didn't have entity_legal_name before, so we add its trigger)

-- Bottom-up trigger already exists for addresses but may need to be refreshed
-- since addresses.entity_legal_name column is new.
-- Re-run bottom-up trigger (the function already handles it):
DROP TRIGGER IF EXISTS sync_addresses_entity_name ON public.addresses;
CREATE OR REPLACE TRIGGER sync_addresses_entity_name
  BEFORE INSERT OR UPDATE OF entity_id ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION sync_entity_legal_name_on_child();

-- Sync trigger for signatories.entity_legal_name
DROP TRIGGER IF EXISTS sync_signatories_entity_name ON public.signatories;
CREATE OR REPLACE TRIGGER sync_signatories_entity_name
  BEFORE INSERT OR UPDATE OF entity_id ON public.signatories
  FOR EACH ROW EXECUTE FUNCTION sync_entity_legal_name_on_child();

-- 10. Backfill entity_legal_name for existing addresses and signatories
UPDATE public.addresses a
  SET entity_legal_name = e.legal_name
  FROM public.entities e
  WHERE a.entity_id = e.entity_id AND a.entity_legal_name IS NULL;

-- 11. Add year column to auditors for annual filtering
ALTER TABLE public.auditors ADD COLUMN IF NOT EXISTS audit_year int;

-- ================================================================
-- END OF MIGRATION
-- ================================================================
