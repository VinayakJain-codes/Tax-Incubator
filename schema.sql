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
 -- ================================================================
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
