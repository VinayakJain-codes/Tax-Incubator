-- ================================================================
-- Phase 5 Schema Migration
-- ================================================================

-- 1. Shareholders: Add address
ALTER TABLE public.shareholders ADD COLUMN IF NOT EXISTS address text;

-- 2. Signatories: Add bank_account_name
ALTER TABLE public.signatories ADD COLUMN IF NOT EXISTS bank_account_name text;

-- 3. Auditors: Remove audit_period
ALTER TABLE public.auditors DROP COLUMN IF EXISTS audit_period;

-- 4. Signatories Trigger: Sync bank_account_name
CREATE OR REPLACE FUNCTION sync_bank_account_name_on_child()
RETURNS trigger AS $$
BEGIN
  IF NEW.bank_account_id IS NOT NULL THEN
    SELECT account_name INTO NEW.bank_account_name
    FROM public.bank_accounts
    WHERE bank_account_id = NEW.bank_account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_signatories_bank_account_name ON public.signatories;
CREATE TRIGGER sync_signatories_bank_account_name
  BEFORE INSERT OR UPDATE OF bank_account_id ON public.signatories
  FOR EACH ROW EXECUTE FUNCTION sync_bank_account_name_on_child();
