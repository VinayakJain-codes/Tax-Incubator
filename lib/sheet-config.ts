export type ColumnType = 'text' | 'date' | 'number' | 'status' | 'boolean' | 'jurisdiction' | 'auto' | 'checkbox';

export interface ColumnDef {
  key: string;
  label: string;
  type: ColumnType;
  editable: boolean;
  required?: boolean;
  options?: string[];
  auto?: boolean; // Marks fields computed by the frontend — not stored in DB
  isLifecycle?: boolean; // Marks fields that trigger special prompts (resignation, closure)
}

export interface SheetDef {
  table: string;
  label: string;
  columns: ColumnDef[];
  filters: string[];
  editableFields: string[];
  sortDefault: string;
  hasYearFilter?: boolean;  // Enable a Year filter at the top
  hasCompleted?: boolean;   // Enable the "Completed" freeze/grey mechanic
}

const JURISDICTION_OPTIONS = ['UAE', 'UK', 'EU', 'US', 'Germany', 'Italy', 'Ireland', 'Netherlands', 'Singapore', 'Other'];
const AUDIT_STATUS_OPTIONS = ['Not Required', 'Planned', 'In Progress', 'Completed', 'Qualified', 'Overdue'];
const REGULATORY_GROUP_OPTIONS = ['Corporate Tax', 'Corporation Tax', 'Federal & State Tax', 'VAT Regime', 'CT+VAT', 'Other'];
const ENTITY_STATUS_OPTIONS = ['Active', 'Dormant', 'In Corporation', 'Liquidation', 'Struck Off', 'Other'];
const CURRENCY_OPTIONS = ['AED', 'EUR', 'GBP', 'USD', 'CHF', 'SAR', 'Other'];
const FILING_FREQUENCY_OPTIONS = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'Ad-hoc'];
const SIGNING_AUTHORITY_OPTIONS = ['Single', 'Joint', 'Any Two', 'Board Resolution Required', 'Other'];
const CONTROL_STATUS_OPTIONS = ['Open', 'In Progress', 'Closed', 'On Hold'];
const RISK_RATING_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const DOCUMENT_STATUS_OPTIONS = ['Missing', 'Available', 'Expired', 'Renewal in Progress'];
const ADDRESS_TYPE_OPTIONS = ['Registered', 'Admin', 'Operational', 'Other'];
const ACCOUNT_TYPE_OPTIONS = ['Current', 'Savings', 'Escrow', 'Other'];
const BANK_STATUS_OPTIONS = ['Active', 'Dormant', 'Closed', 'Other'];
const RENEWAL_STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'Overdue'];
const CITY_OPTIONS = ['Dubai', 'Abu Dhabi', 'London', 'New York', 'Singapore', 'Other'];
const COUNTRY_OPTIONS = ['UAE', 'UK', 'USA', 'Singapore', 'Germany', 'Other'];
const NATIONALITY_OPTIONS = ['UAE', 'UK', 'USA', 'Indian', 'German', 'Italian', 'Irish', 'Dutch', 'Singaporean', 'Other'];

export const SHEET_CONFIG: Record<string, SheetDef> = {

  // ─── GROUP DATA ───────────────────────────────────────────────────────────
  'entities': {
    table: 'entities',
    label: 'Entity Master',
    sortDefault: 'entity_id',
    filters: ['entity_status', 'jurisdiction', 'risk_rating', 'regulatory_group_any'],
    editableFields: [
      'entity_id', 'legal_name', 'trading_name', 'holding_company',
      'jurisdiction', 'address_type', 'full_address', 'city', 'country', 'postal_code',
      'regulatory_group_any', 'risk_rating', 'legal_form', 'registration__license_no',
      'incorporation_date', 'entity_status', 'remarks',
    ],
    columns: [
      { key: 'entity_id',             label: 'Entity ID',                              type: 'text',         editable: true,  required: true },
      { key: 'legal_name',            label: 'Entity Legal Name',                      type: 'text',         editable: true,  required: true },
      { key: 'trading_name',          label: 'Trading Name',                           type: 'text',         editable: true },
      { key: 'holding_company',       label: 'Holding Company',                        type: 'text',         editable: true },
      { key: 'jurisdiction',          label: 'Jurisdiction',                           type: 'jurisdiction', editable: true, options: JURISDICTION_OPTIONS },
      { key: 'address_type',          label: 'Address Type',                           type: 'status',       editable: true, options: ADDRESS_TYPE_OPTIONS },
      { key: 'full_address',          label: 'Full Address',                           type: 'text',         editable: true },
      { key: 'city',                  label: 'City',                                   type: 'status',       editable: true, options: CITY_OPTIONS },
      { key: 'country',               label: 'Country',                                type: 'status',       editable: true, options: COUNTRY_OPTIONS },
      { key: 'postal_code',           label: 'Postal Code',                            type: 'text',         editable: true },
      { key: 'regulatory_group_any',  label: 'Regulatory Group',                       type: 'status',       editable: true, options: REGULATORY_GROUP_OPTIONS },
      { key: 'risk_rating',           label: 'Risk Rating',                            type: 'status',       editable: true, options: RISK_RATING_OPTIONS },
      { key: 'legal_form',            label: 'Legal Form',                             type: 'text',         editable: true },
      { key: 'registration__license_no', label: 'Registration / License No',           type: 'text',         editable: true },
      { key: 'incorporation_date',    label: 'Incorporation Date',                     type: 'date',         editable: true },
      { key: 'entity_status',         label: 'Entity Status',                          type: 'status',       editable: true, options: ENTITY_STATUS_OPTIONS },
      { key: 'remarks',               label: 'Remarks',                                type: 'text',         editable: true },
    ],
  },

  'addresses': {
    table: 'addresses',
    label: 'Addresses',
    sortDefault: 'entity_id',
    filters: ['address_type', 'country'],
    editableFields: ['entity_id', 'address_type', 'address_line_1', 'address_line_2', 'city', 'state_province', 'country', 'postal_code'],
    columns: [
      { key: 'entity_id',          label: 'Entity ID',          type: 'text',   editable: true },
      { key: 'entity_legal_name',  label: 'Entity Legal Name',  type: 'text',   editable: false },
      { key: 'address_type',       label: 'Type',               type: 'status', editable: true, options: ADDRESS_TYPE_OPTIONS },
      { key: 'address_line_1',     label: 'Address Line 1',     type: 'text',   editable: true },
      { key: 'city',               label: 'City',               type: 'text',   editable: true },
      { key: 'country',            label: 'Country',            type: 'text',   editable: true },
      { key: 'postal_code',        label: 'Post Code',          type: 'text',   editable: true },
    ],
  },

  'directors': {
    table: 'directors_officers',
    label: 'Directors & Officers',
    sortDefault: 'full_name',
    filters: ['role', 'is_resigned'],
    editableFields: ['person_id', 'entity_id', 'entity_legal_name', 'full_name', 'role', 'appointment_date', 'nationality', 'email', 'phone', 'passport_no', 'active', 'is_resigned', 'resignation_date'],
    columns: [
      { key: 'person_id',         label: 'Person ID',          type: 'text',     editable: true },
      { key: 'entity_id',         label: 'Entity ID',          type: 'text',     editable: true },
      { key: 'entity_legal_name', label: 'Entity Legal Name',  type: 'text',     editable: false },
      { key: 'full_name',         label: 'Full Name',          type: 'text',     editable: true },
      { key: 'role',              label: 'Role',               type: 'text',     editable: true },
      { key: 'appointment_date',  label: 'Appointment Date',   type: 'date',     editable: true },
      { key: 'nationality',       label: 'Nationality',        type: 'status',   editable: true, options: NATIONALITY_OPTIONS },
      { key: 'email',             label: 'Email',              type: 'text',     editable: true },
      { key: 'phone',             label: 'Phone',              type: 'text',     editable: true },
      { key: 'passport_no',       label: 'ID / Passport No',   type: 'text',     editable: true },
      { key: 'active',            label: 'Active (Y/N)',        type: 'boolean',  editable: true },
      { key: 'is_resigned',       label: 'Resigned',           type: 'boolean',  editable: true, isLifecycle: true },
      { key: 'resignation_date',  label: 'Resignation Date',   type: 'date',     editable: true },
    ],
  },

  // ─── UBO REGISTER ─────────────────────────────────────────────────────────
  'ubo': {
    table: 'ubo_register',
    label: 'UBO Register',
    sortDefault: 'ubo_id',
    filters: ['nationality', 'is_resigned'],
    editableFields: ['ubo_id', 'entity_id', 'entity_legal_name', 'full_name', 'ownership_pct', 'nationality', 'dob', 'residential_address', 'email', 'phone', 'passport_no', 'is_resigned', 'resignation_date'],
    columns: [
      { key: 'ubo_id',              label: 'UBO ID',              type: 'text',    editable: true },
      { key: 'entity_id',          label: 'Entity ID',            type: 'text',    editable: true },
      { key: 'entity_legal_name',  label: 'Entity Legal Name',    type: 'text',    editable: false },
      { key: 'full_name',          label: 'Full Name',            type: 'text',    editable: true },
      { key: 'ownership_pct',      label: 'Ownership %',          type: 'number',  editable: true },
      { key: 'nationality',        label: 'Nationality',          type: 'status',  editable: true, options: NATIONALITY_OPTIONS },
      { key: 'dob',                label: 'Date of Birth',        type: 'date',    editable: true },
      { key: 'residential_address',label: 'Residential Address',  type: 'text',    editable: true },
      { key: 'email',              label: 'Email',                type: 'text',    editable: true },
      { key: 'phone',              label: 'Phone',                type: 'text',    editable: true },
      { key: 'passport_no',        label: 'ID / Passport No',     type: 'text',    editable: true },
      { key: 'is_resigned',        label: 'Resigned',             type: 'boolean', editable: true, isLifecycle: true },
      { key: 'resignation_date',   label: 'Resignation Date',     type: 'date',    editable: true },
    ],
  },

  // ─── SHAREHOLDERS ───────────────────────────────────────────────────────
  'shareholders': {
    table: 'shareholders',
    label: 'Shareholders',
    sortDefault: 'shareholder_id',
    filters: ['nationality', 'is_resigned'],
    editableFields: ['shareholder_id', 'entity_id', 'entity_legal_name', 'full_name', 'shareholding_pct', 'nationality', 'address', 'email', 'phone', 'passport_no', 'is_resigned', 'resignation_date'],
    columns: [
      { key: 'shareholder_id',    label: 'Shareholder ID',      type: 'text',    editable: true,  required: true },
      { key: 'entity_id',         label: 'Entity ID',           type: 'text',    editable: true },
      { key: 'entity_legal_name', label: 'Entity Legal Name',   type: 'text',    editable: false },
      { key: 'full_name',         label: 'Full Name',           type: 'text',    editable: true },
      { key: 'shareholding_pct',  label: 'Shareholding %',      type: 'number',  editable: true },
      { key: 'nationality',       label: 'Nationality',         type: 'status',  editable: true, options: NATIONALITY_OPTIONS },
      { key: 'address',           label: 'Address',             type: 'text',    editable: true },
      { key: 'email',             label: 'Email',               type: 'text',    editable: true },
      { key: 'phone',             label: 'Phone',               type: 'text',    editable: true },
      { key: 'passport_no',       label: 'ID / Passport No',    type: 'text',    editable: true },
      { key: 'is_resigned',       label: 'Resigned',            type: 'boolean', editable: true, isLifecycle: true },
      { key: 'resignation_date',  label: 'Resignation Date',    type: 'date',    editable: true },
    ],
  },

  // ─── BANK ACCOUNTS ────────────────────────────────────────────────────────
  'banks': {
    table: 'bank_accounts',
    label: 'Bank Accounts',
    sortDefault: 'bank_account_id',
    filters: ['status', 'currency', 'account_type', 'is_closed'],
    editableFields: ['bank_account_id', 'entity_id', 'entity_legal_name', 'bank_name', 'country', 'account_name', 'account_no', 'iban', 'swift_bic', 'currency', 'account_type', 'status', 'is_closed', 'closure_date'],
    columns: [
      { key: 'bank_account_id',   label: 'Bank Account ID',    type: 'text',    editable: true },
      { key: 'entity_id',         label: 'Entity ID',          type: 'text',    editable: true },
      { key: 'entity_legal_name', label: 'Entity Legal Name',  type: 'text',    editable: false },
      { key: 'bank_name',         label: 'Bank Name',          type: 'text',    editable: true },
      { key: 'country',           label: 'Country',            type: 'status',  editable: true, options: COUNTRY_OPTIONS },
      { key: 'account_name',      label: 'Account Name',       type: 'text',    editable: true },
      { key: 'account_no',        label: 'Account No',         type: 'text',    editable: true },
      { key: 'iban',              label: 'IBAN',               type: 'text',    editable: true },
      { key: 'swift_bic',         label: 'SWIFT/BIC',          type: 'text',    editable: true },
      { key: 'currency',          label: 'Currency',           type: 'status',  editable: true, options: CURRENCY_OPTIONS },
      { key: 'account_type',      label: 'Account Type',       type: 'status',  editable: true, options: ACCOUNT_TYPE_OPTIONS },
      { key: 'status',            label: 'Status',             type: 'status',  editable: true, options: BANK_STATUS_OPTIONS },
      { key: 'is_closed',         label: 'Closed',             type: 'boolean', editable: true, isLifecycle: true },
      { key: 'closure_date',      label: 'Closure Date',       type: 'date',    editable: true },
    ],
  },

  'signatories': {
    table: 'signatories',
    label: 'Signatories',
    sortDefault: 'signing_authority',
    filters: ['active', 'signing_authority', 'is_resigned'],
    editableFields: ['signatory_id', 'entity_id', 'entity_legal_name', 'bank_account_id', 'bank_account_name', 'person_id', 'signing_authority', 'limit_amount', 'active', 'is_resigned', 'resignation_date'],
    columns: [
      { key: 'signatory_id',      label: 'Signatory ID',      type: 'text',    editable: true },
      { key: 'entity_id',         label: 'Entity ID',          type: 'text',    editable: true },
      { key: 'entity_legal_name', label: 'Entity Legal Name',  type: 'text',    editable: false },
      { key: 'bank_account_id',   label: 'Bank Account ID',   type: 'text',    editable: true },
      { key: 'bank_account_name', label: 'Bank Account Name', type: 'text',    editable: false },
      { key: 'person_id',         label: 'Person ID',         type: 'text',    editable: true },
      { key: 'signing_authority', label: 'Signing Authority', type: 'status',  editable: true, options: SIGNING_AUTHORITY_OPTIONS },
      { key: 'limit_amount',      label: 'Limit',             type: 'number',  editable: true },
      { key: 'active',            label: 'Active',            type: 'boolean', editable: true },
      { key: 'is_resigned',       label: 'Resigned',          type: 'boolean', editable: true, isLifecycle: true },
      { key: 'resignation_date',  label: 'Resignation Date',  type: 'date',    editable: true },
    ],
  },

  // ─── COMPLIANCE ───────────────────────────────────────────────────────────
  'vat': {
    table: 'vat_matrix',
    label: 'VAT Regulatory Matrix',
    sortDefault: 'entity_id',
    hasYearFilter: true,
    hasCompleted: true,
    filters: ['filing_frequency', 'audit_status'],
    editableFields: ['entity_id', 'entity_legal_name', 'vat_number', 'tax_regime', 'filing_frequency', 'last_filing_date', 'audit_required', 'audit_status', 'notes', 'is_completed'],
    columns: [
      { key: 'entity_id',          label: 'Entity ID',             type: 'text',    editable: true },
      { key: 'entity_legal_name',  label: 'Entity Legal Name',     type: 'text',    editable: false },
      { key: 'vat_number',         label: 'VAT Number',            type: 'text',    editable: true },
      { key: 'tax_regime',         label: 'Tax Regime',            type: 'text',    editable: true },
      { key: 'filing_frequency',   label: 'Filing Frequency',      type: 'status',  editable: true, options: FILING_FREQUENCY_OPTIONS },
      { key: 'last_filing_date',   label: 'Last Filing Date',      type: 'date',    editable: true },
      { key: '_next_due_date',     label: 'Next Due Date (Auto)',   type: 'auto',    editable: false, auto: true },
      { key: '_days_to_due',       label: 'Days to Due (Auto)',     type: 'auto',    editable: false, auto: true },
      { key: '_filing_status',     label: 'Filing Status (Auto)',   type: 'auto',    editable: false, auto: true },
      { key: '_reminder_flag',     label: 'Reminder Auto',         type: 'auto',    editable: false, auto: true },
      { key: 'audit_required',     label: 'Audit Required (Y/N)',  type: 'boolean', editable: true },
      { key: 'audit_status',       label: 'Audit Status',          type: 'status',  editable: true, options: AUDIT_STATUS_OPTIONS },
      { key: 'is_completed',       label: 'Completed ✓',           type: 'boolean', editable: true },
      { key: 'notes',              label: 'Notes',                 type: 'text',    editable: true },
    ],
  },

  'ct': {
    table: 'ct_matrix',
    label: 'Corporate Tax Matrix',
    sortDefault: 'entity_id',
    hasYearFilter: true,
    hasCompleted: true,
    filters: ['filing_frequency', 'ct_applicable'],
    editableFields: ['entity_id', 'entity_legal_name', 'jurisdiction', 'tin', 'ct_applicable', 'filing_frequency', 'return_due_date', 'last_filing_date', 'economic_substance', 'transfer_pricing', 'notes', 'is_completed'],
    columns: [
      { key: 'entity_id',           label: 'Entity ID',                    type: 'text',    editable: true },
      { key: 'entity_legal_name',   label: 'Entity Legal Name',            type: 'text',    editable: false },
      { key: 'jurisdiction',        label: 'Jurisdiction',                 type: 'status',  editable: true, options: JURISDICTION_OPTIONS },
      { key: 'tin',                 label: 'Tax Identification Number',    type: 'text',    editable: true },
      { key: 'ct_applicable',       label: 'Corporate Tax Applicable (Y/N)', type: 'boolean', editable: true },
      { key: 'filing_frequency',    label: 'Return Filing Frequency',      type: 'status',  editable: true, options: FILING_FREQUENCY_OPTIONS },
      { key: 'return_due_date',     label: 'Return Filing Due Date',       type: 'date',    editable: true },
      { key: 'last_filing_date',    label: 'Last Filing Date',             type: 'date',    editable: true },
      { key: '_next_due_date',      label: 'Next Due Date (Auto)',          type: 'auto',    editable: false, auto: true },
      { key: '_days_to_due',        label: 'Days to Due (Auto)',            type: 'auto',    editable: false, auto: true },
      { key: '_filing_status',      label: 'Filing Status (Auto)',          type: 'auto',    editable: false, auto: true },
      { key: '_reminder_flag',      label: 'Reminder Auto',                type: 'auto',    editable: false, auto: true },
      { key: 'economic_substance',  label: 'Economic Substance (Y/N)',      type: 'boolean', editable: true },
      { key: 'transfer_pricing',    label: 'Transfer Pricing (Y/N)',        type: 'boolean', editable: true },
      { key: 'is_completed',        label: 'Completed ✓',                  type: 'boolean', editable: true },
      { key: 'notes',               label: 'Notes',                        type: 'text',    editable: true },
    ],
  },

  'licenses': {
    table: 'licenses',
    label: 'Licenses & Regulatory',
    sortDefault: 'expiry_date',
    hasYearFilter: true,
    hasCompleted: true,
    filters: ['status'],
    editableFields: ['entity_id', 'entity_legal_name', 'licensing_authority', 'expiry_date', 'license_link', 'status', 'owner', 'is_completed'],
    columns: [
      { key: 'entity_id',          label: 'Entity ID',              type: 'text',   editable: true },
      { key: 'entity_legal_name',  label: 'Entity Legal Name',      type: 'text',   editable: false },
      { key: 'licensing_authority',label: 'Licensing Authority',     type: 'text',   editable: true },
      { key: 'expiry_date',        label: 'Expiry Date',            type: 'date',   editable: true },
      { key: 'license_link',       label: 'License Link',           type: 'text',   editable: true },
      { key: '_days_to_expiry',    label: 'Days to Expiry (Auto)',   type: 'auto',   editable: false, auto: true },
      { key: '_filing_status',     label: 'Filing Status (Auto)',    type: 'auto',   editable: false, auto: true },
      { key: '_reminder_flag',     label: 'Reminder Auto',          type: 'auto',   editable: false, auto: true },
      { key: 'status',             label: 'Status',                 type: 'status', editable: true, options: RENEWAL_STATUS_OPTIONS },
      { key: 'owner',              label: 'Owner (Role/Person)',     type: 'text',   editable: true },
      { key: 'is_completed',       label: 'Completed ✓',            type: 'boolean', editable: true },
    ],
  },

  'auditors': {
    table: 'auditors',
    label: 'Auditors',
    sortDefault: 'entity_id',
    hasYearFilter: true,
    filters: ['audit_status'],
    editableFields: ['entity_id', 'entity_legal_name', 'auditor_code', 'firm_name', 'lead_partner', 'email', 'phone', 'appointment_date', 'audit_year', 'audit_status', 'notes'],
    columns: [
      { key: 'entity_id',          label: 'Entity ID',         type: 'text',   editable: true },
      { key: 'entity_legal_name',  label: 'Entity Legal Name', type: 'text',   editable: false },
      { key: 'auditor_code',       label: 'Auditor ID',        type: 'text',   editable: true },
      { key: 'firm_name',          label: 'Audit Firm Name',   type: 'text',   editable: true },
      { key: 'lead_partner',       label: 'Lead Partner',      type: 'text',   editable: true },
      { key: 'email',              label: 'Email',             type: 'text',   editable: true },
      { key: 'phone',              label: 'Phone',             type: 'text',   editable: true },
      { key: 'appointment_date',   label: 'Appointment Date',  type: 'date',   editable: true },
      { key: 'audit_year',         label: 'Audit Year',        type: 'number', editable: true },
      { key: 'audit_status',       label: 'Audit Status',      type: 'status', editable: true, options: AUDIT_STATUS_OPTIONS },
      { key: 'notes',              label: 'Notes',             type: 'text',   editable: true },
    ],
  },

  // ─── CONTROLS & DOCUMENTS ────────────────────────────────────────────────
  'documents': {
    table: 'document_control',
    label: 'Document Control',
    sortDefault: 'expiry_date',
    filters: ['review_status', 'doc_type'],
    editableFields: ['doc_id', 'entity_id', 'doc_type', 'description', 'issue_date', 'expiry_date', 'responsible_person', 'review_status', 'uploaded_by', 'upload_date', 'notes'],
    columns: [
      { key: 'doc_id',             label: 'Doc ID',               type: 'text',   editable: true },
      { key: 'entity_id',          label: 'Entity ID',            type: 'text',   editable: true },
      { key: 'doc_type',           label: 'Document Type',        type: 'text',   editable: true },
      { key: 'description',        label: 'Document Description', type: 'text',   editable: true },
      { key: 'issue_date',         label: 'Issue Date',           type: 'date',   editable: true },
      { key: 'expiry_date',        label: 'Expiry Date',          type: 'date',   editable: true },
      { key: 'responsible_person', label: 'Responsible Person',   type: 'text',   editable: true },
      { key: 'review_status',      label: 'Review Status',        type: 'status', editable: true, options: DOCUMENT_STATUS_OPTIONS },
      { key: 'uploaded_by',        label: 'Uploaded By',          type: 'text',   editable: true },
      { key: 'upload_date',        label: 'Upload Date',          type: 'date',   editable: true },
      { key: 'notes',              label: 'Notes',                type: 'text',   editable: true },
    ],
  },

  'controls': {
    table: 'controls_log',
    label: 'Controls Log',
    sortDefault: 'due_date',
    filters: ['risk_rating', 'status', 'control_type'],
    editableFields: ['control_id', 'date_logged', 'entity_id', 'control_type', 'description', 'owner', 'risk_rating', 'status', 'evidence_link', 'due_date', 'closure_date', 'comments'],
    columns: [
      { key: 'control_id',    label: 'Control ID',   type: 'text',   editable: true },
      { key: 'date_logged',   label: 'Date Logged',  type: 'date',   editable: true },
      { key: 'entity_id',     label: 'Entity ID',    type: 'text',   editable: true },
      { key: 'control_type',  label: 'Control Type', type: 'text',   editable: true },
      { key: 'description',   label: 'Description',  type: 'text',   editable: true },
      { key: 'owner',         label: 'Owner',        type: 'text',   editable: true },
      { key: 'risk_rating',   label: 'Risk Rating',  type: 'status', editable: true, options: RISK_RATING_OPTIONS },
      { key: 'status',        label: 'Status',       type: 'status', editable: true, options: CONTROL_STATUS_OPTIONS },
      { key: 'evidence_link', label: 'Evidence Link',type: 'text',   editable: true },
      { key: 'due_date',      label: 'Due Date',     type: 'date',   editable: true },
      { key: 'closure_date',  label: 'Closure Date', type: 'date',   editable: true },
      { key: 'comments',      label: 'Comments',     type: 'text',   editable: true },
    ],
  },

  'renewals': {
    table: 'renewal_calendar',
    label: 'Renewal Calendar',
    sortDefault: 'due_date',
    filters: ['status'],
    editableFields: ['entity_id', 'entity_legal_name', 'description', 'due_date', 'owner', 'status', 'notes'],
    columns: [
      { key: 'entity_id',         label: 'Entity ID',                  type: 'text',   editable: true },
      { key: 'entity_legal_name', label: 'Entity Legal Name (Lookup)', type: 'text',   editable: false },
      { key: 'description',       label: 'Description',                type: 'text',   editable: true },
      { key: 'due_date',          label: 'Due Date',                   type: 'date',   editable: true },
      { key: 'owner',             label: 'Owner (Role/Person)',         type: 'text',   editable: true },
      { key: 'status',            label: 'Status',                     type: 'status', editable: true, options: RENEWAL_STATUS_OPTIONS },
      { key: '_days_to_due',      label: 'Days to Due (Auto)',          type: 'auto',   editable: false, auto: true },
      { key: '_rag',              label: 'RAG (Auto)',                  type: 'auto',   editable: false, auto: true },
      { key: '_reminder_flag',    label: 'Reminder Flag (Auto)',        type: 'auto',   editable: false, auto: true },
      { key: 'notes',             label: 'Notes',                      type: 'text',   editable: true },
    ],
  },
};
