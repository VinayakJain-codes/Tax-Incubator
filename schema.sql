-- 1. Create Core Tables

create table public.entities (
  entity_id text primary key,
  entity_code text,
  legal_name text NOT NULL,
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
  shareholder_1 text,
  shareholding_age_1 numeric,
  shareholder_2 text,
  shareholding_age_2 numeric,
  shareholder_3 text,
  shareholding_age_3 numeric,
  total_shareholding numeric,
  address_type text,
  full_address text,
  regulatory_group_any text,
  risk_rating_any text,
  logo_asset_image text,
  entity_legal_name text,
  registration__license_no text,
  registration_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

-- Validation constraints and indexes for entities
CREATE UNIQUE INDEX IF NOT EXISTS unique_entity_code_active ON public.entities (entity_code) WHERE is_deleted = false;

ALTER TABLE public.entities ADD CONSTRAINT check_shareholding_sum 
CHECK (
  total_shareholding IS NULL OR total_shareholding = (
    COALESCE(shareholding_age_1, 0) + 
    COALESCE(shareholding_age_2, 0) + 
    COALESCE(shareholding_age_3, 0)
  )
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  entity_id text references public.entities(entity_id),
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
  entity_id text references public.entities(entity_id),
  full_name text,
  role text,
  appointment_date date,
  nationality text,
  email text,
  phone text,
  passport_no text,
  person_id text,
  entity_legal_name text,
  photo_asset_image text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

create table public.ubo_register (
  id uuid primary key default gen_random_uuid(),
  ubo_id text, -- Human-readable ID e.g. U-001
  entity_id text references public.entities(entity_id),
  entity_legal_name text, -- auto-synced from entities.legal_name
  full_name text,
  ownership_pct numeric,
  nationality text,
  dob date,
  residential_address text,
  email text,
  phone text,
  passport_no text,
  photo_asset_image text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_account_id text, -- Human-readable ID e.g. B-001
  entity_id text references public.entities(entity_id),
  entity_legal_name text, -- auto-synced from entities.legal_name
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
  signatory_id text, -- Human-readable ID e.g. SIG-001
  bank_account_id text, -- References bank_accounts.bank_account_id (human-readable)
  person_id text, -- Reference to directors_officers or ubo_register person_id / ubo_id
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
  entity_id text references public.entities(entity_id),
  entity_legal_name text, -- auto-synced from entities.legal_name
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
  entity_id text references public.entities(entity_id),
  entity_legal_name text, -- auto-synced from entities.legal_name
  jurisdiction text,
  tin text,
  ct_applicable boolean,
  filing_frequency text,
  return_due_date date,
  last_filing_date date,
  economic_substance boolean,
  transfer_pricing boolean,
  data_protection boolean,
  data_protection_regime text, -- e.g. GDPR, UAE PDPL
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  is_deleted boolean default false
);

create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  entity_id text references public.entities(entity_id),
  entity_legal_name text, -- auto-synced from entities.legal_name
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
  entity_id text references public.entities(entity_id),
  entity_legal_name text, -- auto-synced from entities.legal_name
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
  doc_id text, -- Human-readable ID e.g. DOC-001
  entity_id text references public.entities(entity_id),
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
  control_id text, -- Human-readable ID e.g. CTRL-001
  date_logged date default current_date,
  entity_id text references public.entities(entity_id),
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
  item_id text, -- Human-readable ID e.g. CAL-0001
  entity_id text references public.entities(entity_id),
  entity_legal_name text, -- auto-synced from entities.legal_name
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
  record_id text not null,
  entity_id text, -- Extracted dynamically from record if available, else null
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
declare 
  col text; 
  old_val text; 
  new_val text;
  rec_id text;
  v_user_id uuid;
  v_user_email text;
begin
  -- Get current user context from Supabase Auth
  v_user_id := auth.uid();
  v_user_email := auth.jwt() ->> 'email';

  -- Get record ID: support both 'id' (uuid) and 'entity_id' (text) as primary key
  if TG_OP = 'DELETE' then
    rec_id := COALESCE(
      (row_to_json(OLD) ->> 'entity_id'),
      (row_to_json(OLD) ->> 'id')
    );
  else
    rec_id := COALESCE(
      (row_to_json(NEW) ->> 'entity_id'),
      (row_to_json(NEW) ->> 'id')
    );
  end if;

  for col in
    select column_name::text 
    from information_schema.columns 
    where table_name = TG_TABLE_NAME
    and table_schema = 'public'
  loop
    old_val := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE (row_to_json(OLD) ->> col) END;
    new_val := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE (row_to_json(NEW) ->> col) END;
    
    if old_val is distinct from new_val then
      insert into audit_log(
        table_name, record_id, field_name,
        old_value, new_value, action, changed_at,
        changed_by_id, changed_by_email
      ) values (
        TG_TABLE_NAME, rec_id, col,
        old_val, new_val, TG_OP, now(),
        v_user_id, v_user_email
      );
    end if;
  end loop;
  return case when TG_OP = 'DELETE' then OLD else NEW end;
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
- -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   P h a s e   2   S c h e m a   M i g r a t i o n  
 - -   R u n   t h i s   i n   y o u r   S u p a b a s e   S Q L   E d i t o r   t o   a p p l y   a l l   P h a s e   2   c h a n g e s  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 - -   1 .   E n t i t y   M a s t e r :   R e m o v e   l o g o _ a s s e t _ i m a g e   c o l u m n  
 A L T E R   T A B L E   p u b l i c . e n t i t i e s   D R O P   C O L U M N   I F   E X I S T S   l o g o _ a s s e t _ i m a g e ;  
  
 - -   2 .   A d d r e s s e s :   A d d   e n t i t y _ l e g a l _ n a m e   c o l u m n   ( a u t o - s y n c e d   b y   t r i g g e r )  
 A L T E R   T A B L E   p u b l i c . a d d r e s s e s   A D D   C O L U M N   I F   N O T   E X I S T S   e n t i t y _ l e g a l _ n a m e   t e x t ;  
  
 - -   3 .   S i g n a t o r i e s :   A d d   e n t i t y _ i d   +   e n t i t y _ l e g a l _ n a m e   c o l u m n s  
 A L T E R   T A B L E   p u b l i c . s i g n a t o r i e s   A D D   C O L U M N   I F   N O T   E X I S T S   e n t i t y _ i d   t e x t   R E F E R E N C E S   p u b l i c . e n t i t i e s ( e n t i t y _ i d ) ;  
 A L T E R   T A B L E   p u b l i c . s i g n a t o r i e s   A D D   C O L U M N   I F   N O T   E X I S T S   e n t i t y _ l e g a l _ n a m e   t e x t ;  
  
 - -   4 .   C T   M a t r i x :   R e m o v e   d a t a _ p r o t e c t i o n _ r e g i m e   c o l u m n  
 A L T E R   T A B L E   p u b l i c . c t _ m a t r i x   D R O P   C O L U M N   I F   E X I S T S   d a t a _ p r o t e c t i o n _ r e g i m e ;  
 A L T E R   T A B L E   p u b l i c . c t _ m a t r i x   D R O P   C O L U M N   I F   E X I S T S   d a t a _ p r o t e c t i o n ;   - -   b o o l e a n   t o g g l e ,   a l s o   r e m o v i n g   i f   p r e s e n t  
  
 - -   5 .   C o m p l i a n c e   t a b l e s :   A d d   i s _ c o m p l e t e d   b o o l e a n  
 A L T E R   T A B L E   p u b l i c . v a t _ m a t r i x         A D D   C O L U M N   I F   N O T   E X I S T S   i s _ c o m p l e t e d   b o o l e a n   D E F A U L T   f a l s e ;  
 A L T E R   T A B L E   p u b l i c . c t _ m a t r i x           A D D   C O L U M N   I F   N O T   E X I S T S   i s _ c o m p l e t e d   b o o l e a n   D E F A U L T   f a l s e ;  
 A L T E R   T A B L E   p u b l i c . l i c e n s e s             A D D   C O L U M N   I F   N O T   E X I S T S   i s _ c o m p l e t e d   b o o l e a n   D E F A U L T   f a l s e ;  
 A L T E R   T A B L E   p u b l i c . a u d i t o r s             A D D   C O L U M N   I F   N O T   E X I S T S   i s _ c o m p l e t e d   b o o l e a n   D E F A U L T   f a l s e ;  
  
 - -   6 .   P e o p l e   t a b l e s :   A d d   i s _ r e s i g n e d   +   r e s i g n a t i o n _ d a t e  
 A L T E R   T A B L E   p u b l i c . d i r e c t o r s _ o f f i c e r s   A D D   C O L U M N   I F   N O T   E X I S T S   i s _ r e s i g n e d     b o o l e a n   D E F A U L T   f a l s e ;  
 A L T E R   T A B L E   p u b l i c . d i r e c t o r s _ o f f i c e r s   A D D   C O L U M N   I F   N O T   E X I S T S   r e s i g n a t i o n _ d a t e   d a t e ;  
  
 A L T E R   T A B L E   p u b l i c . u b o _ r e g i s t e r   A D D   C O L U M N   I F   N O T   E X I S T S   i s _ r e s i g n e d     b o o l e a n   D E F A U L T   f a l s e ;  
 A L T E R   T A B L E   p u b l i c . u b o _ r e g i s t e r   A D D   C O L U M N   I F   N O T   E X I S T S   r e s i g n a t i o n _ d a t e   d a t e ;  
  
 A L T E R   T A B L E   p u b l i c . s i g n a t o r i e s   A D D   C O L U M N   I F   N O T   E X I S T S   i s _ r e s i g n e d     b o o l e a n   D E F A U L T   f a l s e ;  
 A L T E R   T A B L E   p u b l i c . s i g n a t o r i e s   A D D   C O L U M N   I F   N O T   E X I S T S   r e s i g n a t i o n _ d a t e   d a t e ;  
  
 - -   7 .   B a n k   A c c o u n t s :   A d d   i s _ c l o s e d   +   c l o s u r e _ d a t e  
 A L T E R   T A B L E   p u b l i c . b a n k _ a c c o u n t s   A D D   C O L U M N   I F   N O T   E X I S T S   i s _ c l o s e d       b o o l e a n   D E F A U L T   f a l s e ;  
 A L T E R   T A B L E   p u b l i c . b a n k _ a c c o u n t s   A D D   C O L U M N   I F   N O T   E X I S T S   c l o s u r e _ d a t e   d a t e ;  
  
 - -   8 .   D e l e t i o n   R e q u e s t s :   N e w   t a b l e   f o r   m a n a g e r   a p p r o v a l  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . d e l e t i o n _ r e q u e s t s   (  
     i d   u u i d   p r i m a r y   k e y   d e f a u l t   g e n _ r a n d o m _ u u i d ( ) ,  
     t a b l e _ n a m e   t e x t   n o t   n u l l ,  
     r e c o r d _ i d   t e x t   n o t   n u l l ,  
     e n t i t y _ i d   t e x t ,  
     r e c o r d _ s n a p s h o t   j s o n b ,             - -   J S O N   s n a p s h o t   o f   t h e   r e c o r d   a t   t i m e   o f   d e l e t i o n   r e q u e s t  
     r e a s o n   t e x t   n o t   n u l l ,  
     r e q u e s t e d _ b y _ i d   u u i d ,  
     r e q u e s t e d _ b y _ e m a i l   t e x t ,  
     r e q u e s t e d _ a t   t i m e s t a m p t z   d e f a u l t   n o w ( ) ,  
     s t a t u s   t e x t   d e f a u l t   ' P e n d i n g ' ,   - -   P e n d i n g   |   A p p r o v e d   |   R e j e c t e d  
     r e v i e w e d _ b y _ e m a i l   t e x t ,  
     r e v i e w e d _ a t   t i m e s t a m p t z ,  
     r e v i e w _ n o t e s   t e x t  
 ) ;  
  
 - -   E n a b l e   R L S  
 A L T E R   T A B L E   p u b l i c . d e l e t i o n _ r e q u e s t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
  
 - -   P o l i c y :   A n y o n e   a u t h e n t i c a t e d   c a n   i n s e r t   ( r e q u e s t   d e l e t i o n )  
 C R E A T E   P O L I C Y   I F   N O T   E X I S T S   " A n y o n e   c a n   r e q u e s t   d e l e t i o n "  
     O N   p u b l i c . d e l e t i o n _ r e q u e s t s   F O R   I N S E R T   T O   a u t h e n t i c a t e d   W I T H   C H E C K   ( t r u e ) ;  
  
 - -   P o l i c y :   A n y o n e   a u t h e n t i c a t e d   c a n   v i e w   r e q u e s t s  
 C R E A T E   P O L I C Y   I F   N O T   E X I S T S   " A n y o n e   c a n   v i e w   d e l e t i o n   r e q u e s t s "  
     O N   p u b l i c . d e l e t i o n _ r e q u e s t s   F O R   S E L E C T   T O   a u t h e n t i c a t e d   U S I N G   ( t r u e ) ;  
  
 - -   P o l i c y :   A n y o n e   a u t h e n t i c a t e d   c a n   u p d a t e   ( f o r   m a n a g e r   a p p r o v a l )  
 C R E A T E   P O L I C Y   I F   N O T   E X I S T S   " A n y o n e   c a n   u p d a t e   d e l e t i o n   r e q u e s t s "  
     O N   p u b l i c . d e l e t i o n _ r e q u e s t s   F O R   U P D A T E   T O   a u t h e n t i c a t e d   U S I N G   ( t r u e ) ;  
  
 - -   9 .   S y n c   t r i g g e r   f o r   a d d r e s s e s . e n t i t y _ l e g a l _ n a m e  
 - -   ( a d d r e s s e s   d i d n ' t   h a v e   e n t i t y _ l e g a l _ n a m e   b e f o r e ,   s o   w e   a d d   i t s   t r i g g e r )  
  
 - -   B o t t o m - u p   t r i g g e r   a l r e a d y   e x i s t s   f o r   a d d r e s s e s   b u t   m a y   n e e d   t o   b e   r e f r e s h e d  
 - -   s i n c e   a d d r e s s e s . e n t i t y _ l e g a l _ n a m e   c o l u m n   i s   n e w .  
 - -   R e - r u n   b o t t o m - u p   t r i g g e r   ( t h e   f u n c t i o n   a l r e a d y   h a n d l e s   i t ) :  
 D R O P   T R I G G E R   I F   E X I S T S   s y n c _ a d d r e s s e s _ e n t i t y _ n a m e   O N   p u b l i c . a d d r e s s e s ;  
 C R E A T E   O R   R E P L A C E   T R I G G E R   s y n c _ a d d r e s s e s _ e n t i t y _ n a m e  
     B E F O R E   I N S E R T   O R   U P D A T E   O F   e n t i t y _ i d   O N   p u b l i c . a d d r e s s e s  
     F O R   E A C H   R O W   E X E C U T E   F U N C T I O N   s y n c _ e n t i t y _ l e g a l _ n a m e _ o n _ c h i l d ( ) ;  
  
 - -   S y n c   t r i g g e r   f o r   s i g n a t o r i e s . e n t i t y _ l e g a l _ n a m e  
 D R O P   T R I G G E R   I F   E X I S T S   s y n c _ s i g n a t o r i e s _ e n t i t y _ n a m e   O N   p u b l i c . s i g n a t o r i e s ;  
 C R E A T E   O R   R E P L A C E   T R I G G E R   s y n c _ s i g n a t o r i e s _ e n t i t y _ n a m e  
     B E F O R E   I N S E R T   O R   U P D A T E   O F   e n t i t y _ i d   O N   p u b l i c . s i g n a t o r i e s  
     F O R   E A C H   R O W   E X E C U T E   F U N C T I O N   s y n c _ e n t i t y _ l e g a l _ n a m e _ o n _ c h i l d ( ) ;  
  
 - -   1 0 .   B a c k f i l l   e n t i t y _ l e g a l _ n a m e   f o r   e x i s t i n g   a d d r e s s e s   a n d   s i g n a t o r i e s  
 U P D A T E   p u b l i c . a d d r e s s e s   a  
     S E T   e n t i t y _ l e g a l _ n a m e   =   e . l e g a l _ n a m e  
     F R O M   p u b l i c . e n t i t i e s   e  
     W H E R E   a . e n t i t y _ i d   =   e . e n t i t y _ i d   A N D   a . e n t i t y _ l e g a l _ n a m e   I S   N U L L ;  
  
 - -   1 1 .   A d d   y e a r   c o l u m n   t o   a u d i t o r s   f o r   a n n u a l   f i l t e r i n g  
 A L T E R   T A B L E   p u b l i c . a u d i t o r s   A D D   C O L U M N   I F   N O T   E X I S T S   a u d i t _ y e a r   i n t ;  
  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   E N D   O F   M I G R A T I O N  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 