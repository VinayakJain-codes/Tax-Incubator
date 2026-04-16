-- ============================================================
-- RBAC Schema Migration
-- Creates user_profiles, signup trigger, role helpers, and RLS
-- ============================================================

-- 1. Create user_role enum type
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  role public.user_role DEFAULT 'viewer' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Auto-create Viewer profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    'viewer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Role helper functions
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS public.user_role AS $$
  SELECT role FROM public.user_profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_or_super(uid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = uid AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin(uid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = uid AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 5. RLS for user_profiles
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY IF NOT EXISTS "Users can read own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Super admins can read all profiles
CREATE POLICY IF NOT EXISTS "Super admins read all profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Super admins can update all profiles (role changes)
CREATE POLICY IF NOT EXISTS "Super admins update all profiles"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- ============================================================
-- 6. Updated RLS for deletion_requests (role-aware)
-- ============================================================
-- Drop old blanket policies
DROP POLICY IF EXISTS "Anyone can request deletion" ON public.deletion_requests;
DROP POLICY IF EXISTS "Anyone can view deletion requests" ON public.deletion_requests;
DROP POLICY IF EXISTS "Anyone can update deletion requests" ON public.deletion_requests;

-- Admins and Super Admins can insert deletion requests
CREATE POLICY IF NOT EXISTS "Admins can request deletion"
  ON public.deletion_requests FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_super(auth.uid()));

-- Admins see own requests, Super Admins see all
CREATE POLICY IF NOT EXISTS "Role-aware view deletion requests"
  ON public.deletion_requests FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR requested_by_id = auth.uid()
  );

-- Only Super Admins can approve/reject (update)
CREATE POLICY IF NOT EXISTS "Super admins update deletion requests"
  ON public.deletion_requests FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- ============================================================
-- 7. RLS for core data tables
-- All authenticated users can SELECT. Only admin/super can INSERT/UPDATE/DELETE.
-- ============================================================

-- Helper macro: apply standard RBAC policies to a table
-- We apply individually since Postgres doesn't support DO for policies well across tables

-- entities
CREATE POLICY IF NOT EXISTS "rbac_select_entities" ON public.entities FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "rbac_insert_entities" ON public.entities FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_update_entities" ON public.entities FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_delete_entities" ON public.entities FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- addresses
CREATE POLICY IF NOT EXISTS "rbac_select_addresses" ON public.addresses FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "rbac_insert_addresses" ON public.addresses FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_update_addresses" ON public.addresses FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_delete_addresses" ON public.addresses FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- directors_officers
CREATE POLICY IF NOT EXISTS "rbac_select_directors" ON public.directors_officers FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "rbac_insert_directors" ON public.directors_officers FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_update_directors" ON public.directors_officers FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_delete_directors" ON public.directors_officers FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- ubo_register
CREATE POLICY IF NOT EXISTS "rbac_select_ubo" ON public.ubo_register FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "rbac_insert_ubo" ON public.ubo_register FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_update_ubo" ON public.ubo_register FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_delete_ubo" ON public.ubo_register FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- bank_accounts
CREATE POLICY IF NOT EXISTS "rbac_select_banks" ON public.bank_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "rbac_insert_banks" ON public.bank_accounts FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_update_banks" ON public.bank_accounts FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_delete_banks" ON public.bank_accounts FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- signatories
CREATE POLICY IF NOT EXISTS "rbac_select_signatories" ON public.signatories FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "rbac_insert_signatories" ON public.signatories FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_update_signatories" ON public.signatories FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_delete_signatories" ON public.signatories FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- vat_matrix
CREATE POLICY IF NOT EXISTS "rbac_select_vat" ON public.vat_matrix FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "rbac_insert_vat" ON public.vat_matrix FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_update_vat" ON public.vat_matrix FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_delete_vat" ON public.vat_matrix FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- ct_matrix
CREATE POLICY IF NOT EXISTS "rbac_select_ct" ON public.ct_matrix FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "rbac_insert_ct" ON public.ct_matrix FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_update_ct" ON public.ct_matrix FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_delete_ct" ON public.ct_matrix FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- licenses
CREATE POLICY IF NOT EXISTS "rbac_select_licenses" ON public.licenses FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "rbac_insert_licenses" ON public.licenses FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_update_licenses" ON public.licenses FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_delete_licenses" ON public.licenses FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- auditors
CREATE POLICY IF NOT EXISTS "rbac_select_auditors" ON public.auditors FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "rbac_insert_auditors" ON public.auditors FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_update_auditors" ON public.auditors FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_delete_auditors" ON public.auditors FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- document_control
CREATE POLICY IF NOT EXISTS "rbac_select_docs" ON public.document_control FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "rbac_insert_docs" ON public.document_control FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_update_docs" ON public.document_control FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_delete_docs" ON public.document_control FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- controls_log
CREATE POLICY IF NOT EXISTS "rbac_select_controls" ON public.controls_log FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "rbac_insert_controls" ON public.controls_log FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_update_controls" ON public.controls_log FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_delete_controls" ON public.controls_log FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- renewal_calendar
CREATE POLICY IF NOT EXISTS "rbac_select_renewals" ON public.renewal_calendar FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "rbac_insert_renewals" ON public.renewal_calendar FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_update_renewals" ON public.renewal_calendar FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY IF NOT EXISTS "rbac_delete_renewals" ON public.renewal_calendar FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- audit_log (read-only for admin+, no writes via RLS — trigger handles inserts)
CREATE POLICY IF NOT EXISTS "rbac_select_audit_log" ON public.audit_log FOR SELECT TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- ============================================================
-- END RBAC MIGRATION
-- ============================================================
