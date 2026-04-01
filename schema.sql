-- 1. Create Core Tables

create table public.entities (
  id uuid primary key default gen_random_uuid(),
  entity_code text,
  legal_name text,
  trading_name text,
  holding_company text,
  jurisdiction text,
  address text,
  city text,
  country text,
  postal_code text,
  legal_form text,
  registration_no text,
  incorporation_date date,
  entity_status text,
  risk_rating text,
  remarks text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities(id),
  address_type text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state_province text,
  country text,
  postal_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

create table public.directors_officers (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities(id),
  full_name text,
  role text,
  appointment_date date,
  nationality text,
  email text,
  phone text,
  passport_no text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

create table public.ubo_register (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities(id),
  full_name text,
  ownership_pct numeric,
  nationality text,
  dob date,
  residential_address text,
  email text,
  phone text,
  passport_no text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities(id),
  bank_name text,
  country text,
  account_name text,
  account_no text,
  iban text,
  swift_bic text,
  currency text,
  account_type text,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

create table public.signatories (
  id uuid primary key default gen_random_uuid(),
  bank_account_id uuid references public.bank_accounts(id),
  person_id uuid, -- Reference to either directors_officers or ubo_register depending on logic, keeping unstructured for flexibility
  signing_authority text,
  limit_amount numeric,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

create table public.vat_matrix (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities(id),
  vat_number text,
  tax_regime text,
  filing_frequency text,
  last_filing_date date,
  audit_required boolean,
  audit_status text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

create table public.ct_matrix (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities(id),
  jurisdiction text,
  tin text,
  ct_applicable boolean,
  filing_frequency text,
  return_due_date date,
  last_filing_date date,
  economic_substance boolean,
  transfer_pricing boolean,
  data_protection boolean,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities(id),
  licensing_authority text,
  expiry_date date,
  license_link text,
  owner text,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

create table public.auditors (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities(id),
  auditor_code text,
  firm_name text,
  lead_partner text,
  email text,
  phone text,
  appointment_date date,
  audit_period text,
  audit_status text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

create table public.document_control (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities(id),
  doc_type text,
  description text,
  issue_date date,
  expiry_date date,
  responsible_person text,
  review_status text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

create table public.controls_log (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities(id),
  control_type text,
  description text,
  owner text,
  risk_rating text,
  status text,
  evidence_link text,
  due_date date,
  closure_date date,
  comments text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

create table public.renewal_calendar (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities(id),
  item_type text,
  description text,
  due_date date,
  owner text,
  status text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

-- 2. Audit Trail System

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  entity_id uuid, -- Extracted dynamically from record if available, else null
  field_name text not null,
  old_value text,
  new_value text,
  changed_by_id uuid,
  changed_by_email text,
  changed_at timestamptz not null default now(),
  action text not null
);

-- Note: The `changed_by_id` and `changed_by_email` will be populated by the app-level `logAudit()`
-- but the native trigger ensures all changes are logged at the pg level as a safety net.

create or replace function log_audit()
returns trigger as $$
declare col text; old_val text; new_val text;
begin
  foreach col in array(
    select column_name::text 
    from information_schema.columns 
    where table_name = TG_TABLE_NAME
    and table_schema = 'public'
  )
  loop
    old_val := CASE WHEN TG_OP = 'INSERT' 
               THEN NULL 
               ELSE (row_to_json(OLD) ->> col) END;
    new_val := (row_to_json(NEW) ->> col);
    if old_val is distinct from new_val then
      insert into audit_log(
        table_name, record_id, field_name,
        old_value, new_value, action, changed_at
      ) values (
        TG_TABLE_NAME, NEW.id, col,
        old_val, new_val, TG_OP, now()
      );
    end if;
  end loop;
  return NEW;
end;
$$ language plpgsql security definer;

-- Apply trigger to all data tables
CREATE TRIGGER entities_audit AFTER INSERT OR UPDATE OR DELETE ON public.entities FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER addresses_audit AFTER INSERT OR UPDATE OR DELETE ON public.addresses FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER directors_officers_audit AFTER INSERT OR UPDATE OR DELETE ON public.directors_officers FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER ubo_register_audit AFTER INSERT OR UPDATE OR DELETE ON public.ubo_register FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER bank_accounts_audit AFTER INSERT OR UPDATE OR DELETE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER signatories_audit AFTER INSERT OR UPDATE OR DELETE ON public.signatories FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER vat_matrix_audit AFTER INSERT OR UPDATE OR DELETE ON public.vat_matrix FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER ct_matrix_audit AFTER INSERT OR UPDATE OR DELETE ON public.ct_matrix FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER licenses_audit AFTER INSERT OR UPDATE OR DELETE ON public.licenses FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER auditors_audit AFTER INSERT OR UPDATE OR DELETE ON public.auditors FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER document_control_audit AFTER INSERT OR UPDATE OR DELETE ON public.document_control FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER controls_log_audit AFTER INSERT OR UPDATE OR DELETE ON public.controls_log FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER renewal_calendar_audit AFTER INSERT OR UPDATE OR DELETE ON public.renewal_calendar FOR EACH ROW EXECUTE FUNCTION log_audit();
