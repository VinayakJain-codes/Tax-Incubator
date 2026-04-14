-- ============================================================
-- sync_triggers.sql
-- Entity Legal Name Auto-Sync Triggers
--
-- HOW IT WORKS:
-- 1. BOTTOM-UP (on INSERT/UPDATE of any child row):
--    When a child row gains an entity_id, this trigger
--    automatically stamps entity_legal_name from the entities table.
--
-- 2. TOP-DOWN (on UPDATE of entities.legal_name):
--    When the master entity name changes, a trigger cascades
--    the new name to ALL child table rows sharing that entity_id.
--
-- Run this entire file once in your Supabase SQL Editor.
-- ============================================================


-- ============================================================
-- PART 1: Bottom-Up Sync Function
-- Runs BEFORE INSERT OR UPDATE on each child table.
-- Looks up entity_legal_name from entities and stamps it.
-- ============================================================

CREATE OR REPLACE FUNCTION sync_entity_legal_name_on_child()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.entity_id IS NOT NULL THEN
    SELECT legal_name INTO NEW.entity_legal_name
    FROM public.entities
    WHERE entity_id = NEW.entity_id
      AND is_deleted = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Apply bottom-up sync triggers to all child tables

CREATE OR REPLACE TRIGGER sync_ubo_register_entity_name
  BEFORE INSERT OR UPDATE OF entity_id ON public.ubo_register
  FOR EACH ROW EXECUTE FUNCTION sync_entity_legal_name_on_child();

CREATE OR REPLACE TRIGGER sync_bank_accounts_entity_name
  BEFORE INSERT OR UPDATE OF entity_id ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION sync_entity_legal_name_on_child();

CREATE OR REPLACE TRIGGER sync_vat_matrix_entity_name
  BEFORE INSERT OR UPDATE OF entity_id ON public.vat_matrix
  FOR EACH ROW EXECUTE FUNCTION sync_entity_legal_name_on_child();

CREATE OR REPLACE TRIGGER sync_ct_matrix_entity_name
  BEFORE INSERT OR UPDATE OF entity_id ON public.ct_matrix
  FOR EACH ROW EXECUTE FUNCTION sync_entity_legal_name_on_child();

CREATE OR REPLACE TRIGGER sync_licenses_entity_name
  BEFORE INSERT OR UPDATE OF entity_id ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION sync_entity_legal_name_on_child();

CREATE OR REPLACE TRIGGER sync_auditors_entity_name
  BEFORE INSERT OR UPDATE OF entity_id ON public.auditors
  FOR EACH ROW EXECUTE FUNCTION sync_entity_legal_name_on_child();

CREATE OR REPLACE TRIGGER sync_document_control_entity_name
  BEFORE INSERT OR UPDATE OF entity_id ON public.document_control
  FOR EACH ROW EXECUTE FUNCTION sync_entity_legal_name_on_child();

CREATE OR REPLACE TRIGGER sync_controls_log_entity_name
  BEFORE INSERT OR UPDATE OF entity_id ON public.controls_log
  FOR EACH ROW EXECUTE FUNCTION sync_entity_legal_name_on_child();

CREATE OR REPLACE TRIGGER sync_renewal_calendar_entity_name
  BEFORE INSERT OR UPDATE OF entity_id ON public.renewal_calendar
  FOR EACH ROW EXECUTE FUNCTION sync_entity_legal_name_on_child();

CREATE OR REPLACE TRIGGER sync_directors_officers_entity_name
  BEFORE INSERT OR UPDATE OF entity_id ON public.directors_officers
  FOR EACH ROW EXECUTE FUNCTION sync_entity_legal_name_on_child();

CREATE OR REPLACE TRIGGER sync_addresses_entity_name
  BEFORE INSERT OR UPDATE OF entity_id ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION sync_entity_legal_name_on_child();


-- ============================================================
-- PART 2: Top-Down Cascade Function
-- Runs AFTER UPDATE on entities when legal_name changes.
-- Cascades new name to ALL child rows with matching entity_id.
-- ============================================================

CREATE OR REPLACE FUNCTION cascade_entity_legal_name_to_children()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act if legal_name actually changed
  IF NEW.legal_name IS DISTINCT FROM OLD.legal_name THEN

    UPDATE public.ubo_register
      SET entity_legal_name = NEW.legal_name
      WHERE entity_id = NEW.entity_id;

    UPDATE public.bank_accounts
      SET entity_legal_name = NEW.legal_name
      WHERE entity_id = NEW.entity_id;

    UPDATE public.vat_matrix
      SET entity_legal_name = NEW.legal_name
      WHERE entity_id = NEW.entity_id;

    UPDATE public.ct_matrix
      SET entity_legal_name = NEW.legal_name
      WHERE entity_id = NEW.entity_id;

    UPDATE public.licenses
      SET entity_legal_name = NEW.legal_name
      WHERE entity_id = NEW.entity_id;

    UPDATE public.auditors
      SET entity_legal_name = NEW.legal_name
      WHERE entity_id = NEW.entity_id;

    UPDATE public.document_control
      SET entity_legal_name = NEW.legal_name
      WHERE entity_id = NEW.entity_id;

    UPDATE public.controls_log
      SET entity_legal_name = NEW.legal_name
      WHERE entity_id = NEW.entity_id;

    UPDATE public.renewal_calendar
      SET entity_legal_name = NEW.legal_name
      WHERE entity_id = NEW.entity_id;

    UPDATE public.directors_officers
      SET entity_legal_name = NEW.legal_name
      WHERE entity_id = NEW.entity_id;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Apply the top-down cascade trigger on the entities master table

CREATE OR REPLACE TRIGGER cascade_entity_name_to_all_children
  AFTER UPDATE OF legal_name ON public.entities
  FOR EACH ROW EXECUTE FUNCTION cascade_entity_legal_name_to_children();


-- ============================================================
-- PART 3: Backfill existing records
-- Run once to stamp entity_legal_name on all existing rows
-- that already have an entity_id but no legal_name stamped.
-- ============================================================

UPDATE public.ubo_register c
  SET entity_legal_name = e.legal_name
  FROM public.entities e
  WHERE c.entity_id = e.entity_id AND c.entity_legal_name IS NULL;

UPDATE public.bank_accounts c
  SET entity_legal_name = e.legal_name
  FROM public.entities e
  WHERE c.entity_id = e.entity_id AND c.entity_legal_name IS NULL;

UPDATE public.vat_matrix c
  SET entity_legal_name = e.legal_name
  FROM public.entities e
  WHERE c.entity_id = e.entity_id AND c.entity_legal_name IS NULL;

UPDATE public.ct_matrix c
  SET entity_legal_name = e.legal_name
  FROM public.entities e
  WHERE c.entity_id = e.entity_id AND c.entity_legal_name IS NULL;

UPDATE public.licenses c
  SET entity_legal_name = e.legal_name
  FROM public.entities e
  WHERE c.entity_id = e.entity_id AND c.entity_legal_name IS NULL;

UPDATE public.auditors c
  SET entity_legal_name = e.legal_name
  FROM public.entities e
  WHERE c.entity_id = e.entity_id AND c.entity_legal_name IS NULL;

UPDATE public.document_control c
  SET entity_legal_name = e.legal_name
  FROM public.entities e
  WHERE c.entity_id = e.entity_id AND c.entity_legal_name IS NULL;

UPDATE public.controls_log c
  SET entity_legal_name = e.legal_name
  FROM public.entities e
  WHERE c.entity_id = e.entity_id AND c.entity_legal_name IS NULL;

UPDATE public.renewal_calendar c
  SET entity_legal_name = e.legal_name
  FROM public.entities e
  WHERE c.entity_id = e.entity_id AND c.entity_legal_name IS NULL;

UPDATE public.directors_officers c
  SET entity_legal_name = e.legal_name
  FROM public.entities e
  WHERE c.entity_id = e.entity_id AND c.entity_legal_name IS NULL;

-- ============================================================
-- PART 4: Sync Entity Address to Addresses Table
-- Runs AFTER INSERT OR UPDATE on entities.
-- Automatically creates/updates an address record based on entity.
-- ============================================================

CREATE OR REPLACE FUNCTION sync_entity_address_to_addresses()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.addresses (
      entity_id,
      entity_legal_name,
      address_type,
      address_line_1,
      city,
      country,
      postal_code
    ) VALUES (
      NEW.entity_id,
      NEW.legal_name,
      NEW.address_type,
      NEW.full_address,
      NEW.city,
      NEW.country,
      NEW.postal_code
    );
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.addresses
    SET
      address_type = NEW.address_type,
      address_line_1 = NEW.full_address,
      city = NEW.city,
      country = NEW.country,
      postal_code = NEW.postal_code,
      entity_legal_name = NEW.legal_name,
      updated_at = NOW()
    WHERE entity_id = NEW.entity_id 
      AND address_type IS NOT DISTINCT FROM OLD.address_type
      AND is_deleted = false;
      
    IF NOT FOUND THEN
      INSERT INTO public.addresses (
        entity_id,
        entity_legal_name,
        address_type,
        address_line_1,
        city,
        country,
        postal_code
      ) VALUES (
        NEW.entity_id,
        NEW.legal_name,
        NEW.address_type,
        NEW.full_address,
        NEW.city,
        NEW.country,
        NEW.postal_code
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


DROP TRIGGER IF EXISTS trigger_sync_entity_address_to_addresses ON public.entities;
CREATE TRIGGER trigger_sync_entity_address_to_addresses
  AFTER INSERT OR UPDATE OF full_address, address_type, city, country, postal_code, legal_name
  ON public.entities
  FOR EACH ROW
  EXECUTE FUNCTION sync_entity_address_to_addresses();
