export type ColumnType = 'text' | 'date' | 'number' | 'status' | 'boolean' | 'jurisdiction';

export interface ColumnDef {
  key: string;
  label: string;
  type: ColumnType;
  editable: boolean;
  options?: string[]; // For dropdowns like status, jurisdiction
}

export interface SheetDef {
  table: string;
  label: string;
  columns: ColumnDef[];
  filters: string[]; // Keys of columns that should have filter dropdowns
  editableFields: string[]; // Keys of columns that can be edited in modal
  sortDefault: string; // Key to sort by default
}

const COMMON_STATUS_OPTIONS = ['Active', 'Inactive', 'Pending', 'Closed'];
const JURISDICTION_OPTIONS = ['UAE', 'UK', 'EU', 'BVI', 'Cayman', 'Other'];
const RAG_STATUS_OPTIONS = ['On Track', 'Due Soon', 'Overdue', 'Warning', 'Missing'];

export const SHEET_CONFIG: Record<string, SheetDef> = {
  // ─── GROUP DATA ────────────────────────────────────────────
  'entities': {
    table: 'entities',
    label: 'Entity Master',
    sortDefault: 'entity_code',
    filters: ['entity_status', 'jurisdiction', 'risk_rating'],
    editableFields: ['legal_name', 'trading_name', 'holding_company', 'jurisdiction', 'address', 'city', 'country', 'postal_code', 'legal_form', 'registration_no', 'incorporation_date', 'entity_status', 'risk_rating', 'remarks'],
    columns: [
      { key: 'entity_code', label: 'Code', type: 'text', editable: false },
      { key: 'legal_name', label: 'Legal Name', type: 'text', editable: true },
      { key: 'trading_name', label: 'Trading Name', type: 'text', editable: true },
      { key: 'jurisdiction', label: 'Jurisdiction', type: 'jurisdiction', editable: true, options: JURISDICTION_OPTIONS },
      { key: 'incorporation_date', label: 'Inc. Date', type: 'date', editable: true },
      { key: 'entity_status', label: 'Status', type: 'status', editable: true, options: COMMON_STATUS_OPTIONS },
      { key: 'risk_rating', label: 'Risk', type: 'status', editable: true, options: ['Low', 'Medium', 'High'] },
    ]
  },

  'addresses': {
    table: 'addresses',
    label: 'Addresses',
    sortDefault: 'city',
    filters: ['address_type', 'country'],
    editableFields: ['address_type', 'address_line_1', 'address_line_2', 'city', 'state_province', 'country', 'postal_code'],
    columns: [
      { key: 'address_type', label: 'Type', type: 'status', editable: true, options: ['Registered', 'Operating', 'Mailing', 'Branch'] },
      { key: 'address_line_1', label: 'Address Line 1', type: 'text', editable: true },
      { key: 'city', label: 'City', type: 'text', editable: true },
      { key: 'country', label: 'Country', type: 'text', editable: true },
      { key: 'postal_code', label: 'Post Code', type: 'text', editable: true },
    ]
  },

  'directors': {
    table: 'directors_officers',
    label: 'Directors & Officers',
    sortDefault: 'full_name',
    filters: ['role', 'active'],
    editableFields: ['full_name', 'role', 'appointment_date', 'nationality', 'email', 'phone', 'passport_no', 'active'],
    columns: [
      { key: 'full_name', label: 'Full Name', type: 'text', editable: true },
      { key: 'role', label: 'Role', type: 'text', editable: true },
      { key: 'appointment_date', label: 'Appt Date', type: 'date', editable: true },
      { key: 'nationality', label: 'Nationality', type: 'text', editable: true },
      { key: 'email', label: 'Email', type: 'text', editable: true },
      { key: 'active', label: 'Active', type: 'boolean', editable: true },
    ]
  },

  'ubo': {
    table: 'ubo_register',
    label: 'UBO Register',
    sortDefault: 'ownership_pct',
    filters: ['nationality'],
    editableFields: ['full_name', 'ownership_pct', 'nationality', 'dob', 'residential_address', 'email', 'phone', 'passport_no'],
    columns: [
      { key: 'full_name', label: 'Full Name', type: 'text', editable: true },
      { key: 'ownership_pct', label: 'Ownership %', type: 'number', editable: true },
      { key: 'nationality', label: 'Nationality', type: 'text', editable: true },
      { key: 'dob', label: 'Date of Birth', type: 'date', editable: true },
      { key: 'email', label: 'Email', type: 'text', editable: true },
    ]
  },

  'banks': {
    table: 'bank_accounts',
    label: 'Bank Accounts',
    sortDefault: 'bank_name',
    filters: ['status', 'currency', 'account_type'],
    editableFields: ['bank_name', 'country', 'account_name', 'account_no', 'iban', 'swift_bic', 'currency', 'account_type', 'status'],
    columns: [
      { key: 'bank_name', label: 'Bank Name', type: 'text', editable: true },
      { key: 'account_name', label: 'Account Name', type: 'text', editable: true },
      { key: 'account_no', label: 'Account No', type: 'text', editable: true },
      { key: 'currency', label: 'Currency', type: 'status', editable: true, options: ['USD', 'EUR', 'GBP', 'AED', 'INR'] },
      { key: 'status', label: 'Status', type: 'status', editable: true, options: COMMON_STATUS_OPTIONS },
    ]
  },

  'signatories': {
    table: 'signatories',
    label: 'Signatories',
    sortDefault: 'signing_authority',
    filters: ['active', 'signing_authority'],
    editableFields: ['signing_authority', 'limit_amount', 'active'],
    columns: [
      { key: 'signing_authority', label: 'Signing Authority', type: 'text', editable: true },
      { key: 'limit_amount', label: 'Limit Amount', type: 'number', editable: true },
      { key: 'active', label: 'Active', type: 'boolean', editable: true },
    ]
  },

  // ─── COMPLIANCE ────────────────────────────────────────────
  'vat': {
    table: 'vat_matrix',
    label: 'VAT Regulatory Matrix',
    sortDefault: 'last_filing_date',
    filters: ['filing_frequency', 'audit_status'],
    editableFields: ['vat_number', 'tax_regime', 'filing_frequency', 'last_filing_date', 'audit_required', 'audit_status', 'notes'],
    columns: [
      { key: 'vat_number', label: 'VAT Number', type: 'text', editable: true },
      { key: 'tax_regime', label: 'Regime', type: 'text', editable: true },
      { key: 'filing_frequency', label: 'Frequency', type: 'status', editable: true, options: ['Monthly', 'Quarterly', 'Annual'] },
      { key: 'last_filing_date', label: 'Last Filed', type: 'date', editable: true },
      { key: 'audit_status', label: 'Audit Status', type: 'status', editable: true, options: RAG_STATUS_OPTIONS },
    ]
  },

  'ct': {
    table: 'ct_matrix',
    label: 'Corporate Tax Matrix',
    sortDefault: 'return_due_date',
    filters: ['filing_frequency', 'ct_applicable'],
    editableFields: ['jurisdiction', 'tin', 'ct_applicable', 'filing_frequency', 'return_due_date', 'last_filing_date', 'economic_substance', 'transfer_pricing', 'data_protection', 'notes'],
    columns: [
      { key: 'jurisdiction', label: 'Jurisdiction', type: 'text', editable: true },
      { key: 'tin', label: 'TIN', type: 'text', editable: true },
      { key: 'ct_applicable', label: 'CT Applicable', type: 'boolean', editable: true },
      { key: 'filing_frequency', label: 'Frequency', type: 'status', editable: true, options: ['Monthly', 'Quarterly', 'Annual'] },
      { key: 'return_due_date', label: 'Return Due', type: 'date', editable: true },
      { key: 'last_filing_date', label: 'Last Filed', type: 'date', editable: true },
    ]
  },

  'licenses': {
    table: 'licenses',
    label: 'Licenses & Regulatory',
    sortDefault: 'expiry_date',
    filters: ['status'],
    editableFields: ['licensing_authority', 'expiry_date', 'license_link', 'owner', 'status'],
    columns: [
      { key: 'licensing_authority', label: 'Authority', type: 'text', editable: true },
      { key: 'expiry_date', label: 'Expiry Date', type: 'date', editable: true },
      { key: 'owner', label: 'Owner', type: 'text', editable: true },
      { key: 'status', label: 'Status', type: 'status', editable: true, options: COMMON_STATUS_OPTIONS },
    ]
  },

  'auditors': {
    table: 'auditors',
    label: 'Auditors',
    sortDefault: 'firm_name',
    filters: ['audit_status'],
    editableFields: ['auditor_code', 'firm_name', 'lead_partner', 'email', 'phone', 'appointment_date', 'audit_period', 'audit_status', 'notes'],
    columns: [
      { key: 'auditor_code', label: 'Code', type: 'text', editable: false },
      { key: 'firm_name', label: 'Firm Name', type: 'text', editable: true },
      { key: 'lead_partner', label: 'Lead Partner', type: 'text', editable: true },
      { key: 'email', label: 'Email', type: 'text', editable: true },
      { key: 'appointment_date', label: 'Appt Date', type: 'date', editable: true },
      { key: 'audit_status', label: 'Audit Status', type: 'status', editable: true, options: RAG_STATUS_OPTIONS },
    ]
  },

  // ─── CONTROLS & DOCUMENTS ─────────────────────────────────
  'documents': {
    table: 'document_control',
    label: 'Document Control',
    sortDefault: 'expiry_date',
    filters: ['review_status', 'doc_type'],
    editableFields: ['doc_type', 'description', 'issue_date', 'expiry_date', 'responsible_person', 'review_status', 'notes'],
    columns: [
      { key: 'doc_type', label: 'Doc Type', type: 'text', editable: true },
      { key: 'description', label: 'Description', type: 'text', editable: true },
      { key: 'issue_date', label: 'Issue Date', type: 'date', editable: true },
      { key: 'expiry_date', label: 'Expiry Date', type: 'date', editable: true },
      { key: 'review_status', label: 'Review Status', type: 'status', editable: true, options: RAG_STATUS_OPTIONS },
    ]
  },

  'controls': {
    table: 'controls_log',
    label: 'Controls Log',
    sortDefault: 'due_date',
    filters: ['risk_rating', 'status', 'control_type'],
    editableFields: ['control_type', 'description', 'owner', 'risk_rating', 'status', 'evidence_link', 'due_date', 'closure_date', 'comments'],
    columns: [
      { key: 'control_type', label: 'Control Type', type: 'text', editable: true },
      { key: 'description', label: 'Description', type: 'text', editable: true },
      { key: 'owner', label: 'Owner', type: 'text', editable: true },
      { key: 'risk_rating', label: 'Risk', type: 'status', editable: true, options: ['Low', 'Medium', 'High', 'Critical'] },
      { key: 'status', label: 'Status', type: 'status', editable: true, options: COMMON_STATUS_OPTIONS },
      { key: 'due_date', label: 'Due Date', type: 'date', editable: true },
    ]
  },
};
