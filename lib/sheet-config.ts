export type ColumnType = 'text' | 'date' | 'number' | 'status' | 'boolean' | 'jurisdiction';

export interface ColumnDef {
  key: string;
  label: string;
  type: ColumnType;
  editable: boolean;
  required?: boolean; // If true, field must not be empty
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

const JURISDICTION_OPTIONS = ['UAE', 'UK', 'EU', 'US', 'Germany', 'Italy', 'Ireland', 'Netherlands', 'Singapore', 'Other'];
const AUDIT_STATUS_OPTIONS = ['Not Required', 'Planned', 'In Progress', 'Completed', 'Qualified', 'Overdue'];
const REGULATORY_GROUP_OPTIONS = ['Corporate Tax', 'Corporation Tax', 'Federal & State Tax', 'VAT Regime', 'CT+VAT', 'Other'];
const ENTITY_STATUS_OPTIONS = ['Active', 'Dormant', 'In Corporation', 'Liquidation', 'Struck Off', 'Other'];
const YES_NO_OPTIONS = ['Yes', 'No'];
const CURRENCY_OPTIONS = ['AED', 'EUR', 'GBP', 'USD', 'CHF', 'SAR', 'Other'];
const FILING_FREQUENCY_OPTIONS = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'Ad-hoc'];
const SIGNING_AUTHORITY_OPTIONS = ['Single', 'Joint', 'Any Two', 'Board Resolution Required', 'Other'];
const CONTROL_STATUS_OPTIONS = ['Open', 'In Progress', 'Closed', 'On Hold'];
const RISK_RATING_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const DOCUMENT_STATUS_OPTIONS = ['Missing', 'Available', 'Expired', 'Renewal in Progress'];
const ADDRESS_TYPE_OPTIONS = ['Registered', 'Admin', 'Operational', 'Other'];

const CITY_OPTIONS = ['Dubai', 'Abu Dhabi', 'London', 'New York', 'Singapore', 'Other'];
const COUNTRY_OPTIONS = ['UAE', 'UK', 'USA', 'Singapore', 'Other'];

export const SHEET_CONFIG: Record<string, SheetDef> = {
  // ─── GROUP DATA ────────────────────────────────────────────
  'entities': {
    table: 'entities',
    label: 'Entity Master',
    sortDefault: 'entity_code',
    filters: ['entity_status', 'jurisdiction', 'risk_rating_any', 'regulatory_group_any'],
    editableFields: [
      'entity_id', 'entity_code', 'legal_name', 'entity_legal_name', 'trading_name', 'holding_company', 
      'jurisdiction', 'address_type', 'address', 'full_address', 'city', 'country', 'postal_code', 
      'legal_form', 'registration_no', 'registration__license_no', 'incorporation_date', 'registration_date', 
      'entity_status', 'risk_rating_any', 'regulatory_group_any', 'logo_asset_image', 
      'shareholder_1', 'shareholding_age_1', 'shareholder_2', 'shareholding_age_2', 
      'shareholder_3', 'shareholding_age_3', 'total_shareholding', 'remarks'
    ],
    columns: [
      { key: 'entity_code', label: 'Entity ID', type: 'text', editable: false },
      { key: 'legal_name', label: 'Entity Legal Name', type: 'text', editable: true, required: true },
      { key: 'trading_name', label: 'Trading Name', type: 'text', editable: true },
      { key: 'holding_company', label: 'Holding Company', type: 'text', editable: true },
      { key: 'shareholder_1', label: 'Shareholder 1', type: 'text', editable: true },
      { key: 'shareholding_age_1', label: 'Shareholding %age 1', type: 'number', editable: true },
      { key: 'shareholder_2', label: 'Shareholder 2', type: 'text', editable: true },
      { key: 'shareholding_age_2', label: 'Shareholding %age 2', type: 'number', editable: true },
      { key: 'shareholder_3', label: 'Shareholder 3', type: 'text', editable: true },
      { key: 'shareholding_age_3', label: 'Shareholding %age 3', type: 'number', editable: true },
      { key: 'total_shareholding', label: 'Total Shareholding', type: 'number', editable: true },
      { key: 'jurisdiction', label: 'Jurisdiction', type: 'jurisdiction', editable: true, options: JURISDICTION_OPTIONS },
      { key: 'address_type', label: 'Address Type (Registered/Admin/Operational)', type: 'status', editable: true, options: ADDRESS_TYPE_OPTIONS },
      { key: 'full_address', label: 'Full Address', type: 'text', editable: true },
      { key: 'city', label: 'City', type: 'status', editable: true, options: CITY_OPTIONS },
      { key: 'country', label: 'Country', type: 'status', editable: true, options: COUNTRY_OPTIONS },
      { key: 'postal_code', label: 'Postal Code', type: 'text', editable: true },
      { key: 'regulatory_group_any', label: 'Regulatory Group (auto)', type: 'status', editable: true, options: REGULATORY_GROUP_OPTIONS },
      { key: 'risk_rating_any', label: 'Risk rating (auto)', type: 'status', editable: true, options: RISK_RATING_OPTIONS },
      { key: 'legal_form', label: 'Legal Form', type: 'text', editable: true },
      { key: 'registration__license_no', label: 'Registration / License No', type: 'text', editable: true },
      { key: 'incorporation_date', label: 'Incorporation Date', type: 'date', editable: true },
      { key: 'entity_status', label: 'Entity Status', type: 'status', editable: true, options: ENTITY_STATUS_OPTIONS },
      { key: 'logo_asset_image', label: 'Logo (Insert Image)', type: 'text', editable: true },
      { key: 'remarks', label: 'Remarks', type: 'text', editable: true },
    ]
  },

  'addresses': {
    table: 'addresses',
    label: 'Addresses',
    sortDefault: 'city',
    filters: ['address_type', 'country'],
    editableFields: ['entity_id', 'address_type', 'address_line_1', 'address_line_2', 'city', 'state_province', 'country', 'postal_code'],
    columns: [
      { key: 'entity_id', label: 'Entity ID', type: 'text', editable: true },
      { key: 'address_type', label: 'Type', type: 'status', editable: true, options: ADDRESS_TYPE_OPTIONS },
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
    editableFields: ['person_id', 'entity_id', 'entity_legal_name', 'full_name', 'role', 'appointment_date', 'nationality', 'email', 'phone', 'passport_no', 'photo_asset_image', 'active'],
    columns: [
      { key: 'person_id', label: 'Person ID', type: 'text', editable: true },
      { key: 'entity_id', label: 'Entity ID', type: 'text', editable: true },
      { key: 'entity_legal_name', label: 'Entity Legal Name', type: 'text', editable: true },
      { key: 'full_name', label: 'Full Name', type: 'text', editable: true },
      { key: 'role', label: 'Role', type: 'text', editable: true },
      { key: 'appointment_date', label: 'Appointment Date', type: 'date', editable: true },
      { key: 'nationality', label: 'Nationality', type: 'text', editable: true },
      { key: 'email', label: 'Email', type: 'text', editable: true },
      { key: 'phone', label: 'Phone', type: 'text', editable: true },
      { key: 'passport_no', label: 'ID / Passport No', type: 'text', editable: true },
      { key: 'photo_asset_image', label: 'Photo (Insert Image)', type: 'text', editable: true },
      { key: 'active', label: 'Active (Y/N)', type: 'boolean', editable: true },
    ]
  },

  'ubo': {
    table: 'ubo_register',
    label: 'UBO Register',
    sortDefault: 'ownership_pct',
    filters: ['nationality'],
    editableFields: ['ubo_id', 'entity_id', 'full_name', 'ownership_pct', 'nationality', 'dob', 'residential_address', 'email', 'phone', 'passport_no', 'photo_asset_image'],
    columns: [
      { key: 'ubo_id', label: 'UBO ID', type: 'text', editable: true },
      { key: 'entity_id', label: 'Entity ID', type: 'text', editable: true },
      { key: 'full_name', label: 'Full Name', type: 'text', editable: true },
      { key: 'ownership_pct', label: 'Ownership %', type: 'number', editable: true },
      { key: 'nationality', label: 'Nationality', type: 'text', editable: true },
      { key: 'dob', label: 'Date of Birth', type: 'date', editable: true },
      { key: 'email', label: 'Email', type: 'text', editable: true },
      { key: 'photo_asset_image', label: 'Photo (Insert Image)', type: 'text', editable: true },
    ]
  },

  'banks': {
    table: 'bank_accounts',
    label: 'Bank Accounts',
    sortDefault: 'bank_name',
    filters: ['status', 'currency', 'account_type'],
    editableFields: ['bank_account_id', 'entity_id', 'bank_name', 'country', 'account_name', 'account_no', 'iban', 'swift_bic', 'currency', 'account_type', 'status'],
    columns: [
      { key: 'bank_account_id', label: 'Bank Account ID', type: 'text', editable: true },
      { key: 'entity_id', label: 'Entity ID', type: 'text', editable: true },
      { key: 'bank_name', label: 'Bank Name', type: 'text', editable: true },
      { key: 'account_name', label: 'Account Name', type: 'text', editable: true },
      { key: 'account_no', label: 'Account No', type: 'text', editable: true },
      { key: 'iban', label: 'IBAN', type: 'text', editable: true },
      { key: 'swift_bic', label: 'SWIFT/BIC', type: 'text', editable: true },
      { key: 'currency', label: 'Currency', type: 'status', editable: true, options: CURRENCY_OPTIONS },
      { key: 'account_type', label: 'Account Type', type: 'text', editable: true },
      { key: 'status', label: 'Status', type: 'status', editable: true, options: ENTITY_STATUS_OPTIONS },
    ]
  },

  'signatories': {
    table: 'signatories',
    label: 'Signatories',
    sortDefault: 'signing_authority',
    filters: ['active', 'signing_authority'],
    editableFields: ['signatory_id', 'bank_account_id', 'person_id', 'signing_authority', 'limit_amount', 'active'],
    columns: [
      { key: 'signatory_id', label: 'Signatory ID', type: 'text', editable: true },
      { key: 'bank_account_id', label: 'Bank Account ID', type: 'text', editable: true },
      { key: 'person_id', label: 'Person ID', type: 'text', editable: true },
      { key: 'signing_authority', label: 'Signing Authority', type: 'status', editable: true, options: SIGNING_AUTHORITY_OPTIONS },
      { key: 'limit_amount', label: 'Limit', type: 'number', editable: true },
      { key: 'active', label: 'Active', type: 'boolean', editable: true },
    ]
  },

  // ─── COMPLIANCE ────────────────────────────────────────────
  'vat': {
    table: 'vat_matrix',
    label: 'VAT Regulatory Matrix',
    sortDefault: 'last_filing_date',
    filters: ['filing_frequency', 'audit_status'],
    editableFields: ['entity_id', 'vat_number', 'tax_regime', 'filing_frequency', 'last_filing_date', 'audit_required', 'audit_status', 'notes'],
    columns: [
      { key: 'entity_id', label: 'Entity ID', type: 'text', editable: true },
      { key: 'vat_number', label: 'VAT Number', type: 'text', editable: true },
      { key: 'tax_regime', label: 'Regime', type: 'text', editable: true },
      { key: 'filing_frequency', label: 'Frequency', type: 'status', editable: true, options: FILING_FREQUENCY_OPTIONS },
      { key: 'last_filing_date', label: 'Last Filed', type: 'date', editable: true },
      { key: 'audit_status', label: 'Audit Status', type: 'status', editable: true, options: AUDIT_STATUS_OPTIONS },
    ]
  },

  'ct': {
    table: 'ct_matrix',
    label: 'Corporate Tax Matrix',
    sortDefault: 'return_due_date',
    filters: ['filing_frequency', 'ct_applicable'],
    editableFields: ['entity_id', 'jurisdiction', 'tin', 'ct_applicable', 'filing_frequency', 'return_due_date', 'last_filing_date', 'economic_substance', 'transfer_pricing', 'data_protection', 'data_protection_regime', 'notes'],
    columns: [
      { key: 'entity_id', label: 'Entity ID', type: 'text', editable: true },
      { key: 'jurisdiction', label: 'Jurisdiction', type: 'text', editable: true },
      { key: 'tin', label: 'TIN', type: 'text', editable: true },
      { key: 'ct_applicable', label: 'CT Applicable', type: 'boolean', editable: true },
      { key: 'filing_frequency', label: 'Frequency', type: 'status', editable: true, options: FILING_FREQUENCY_OPTIONS },
      { key: 'return_due_date', label: 'Return Due', type: 'date', editable: true },
      { key: 'last_filing_date', label: 'Last Filed', type: 'date', editable: true },
      { key: 'data_protection_regime', label: 'Data Protection Regime', type: 'text', editable: true },
    ]
  },

  'licenses': {
    table: 'licenses',
    label: 'Licenses & Regulatory',
    sortDefault: 'expiry_date',
    filters: ['status'],
    editableFields: ['entity_id', 'licensing_authority', 'expiry_date', 'license_link', 'owner', 'status'],
    columns: [
      { key: 'entity_id', label: 'Entity ID', type: 'text', editable: true },
      { key: 'licensing_authority', label: 'Authority', type: 'text', editable: true },
      { key: 'expiry_date', label: 'Expiry Date', type: 'date', editable: true },
      { key: 'owner', label: 'Owner', type: 'text', editable: true },
      { key: 'status', label: 'Status', type: 'status', editable: true, options: ENTITY_STATUS_OPTIONS },
    ]
  },

  'auditors': {
    table: 'auditors',
    label: 'Auditors',
    sortDefault: 'firm_name',
    filters: ['audit_status'],
    editableFields: ['entity_id', 'auditor_code', 'firm_name', 'lead_partner', 'email', 'phone', 'appointment_date', 'audit_period', 'audit_status', 'notes'],
    columns: [
      { key: 'entity_id', label: 'Entity ID', type: 'text', editable: true },
      { key: 'auditor_code', label: 'Code', type: 'text', editable: false },
      { key: 'firm_name', label: 'Firm Name', type: 'text', editable: true },
      { key: 'lead_partner', label: 'Lead Partner', type: 'text', editable: true },
      { key: 'email', label: 'Email', type: 'text', editable: true },
      { key: 'appointment_date', label: 'Appt Date', type: 'date', editable: true },
      { key: 'audit_status', label: 'Audit Status', type: 'status', editable: true, options: AUDIT_STATUS_OPTIONS },
    ]
  },

  // ─── CONTROLS & DOCUMENTS ─────────────────────────────────
  'documents': {
    table: 'document_control',
    label: 'Document Control',
    sortDefault: 'expiry_date',
    filters: ['review_status', 'doc_type'],
    editableFields: ['doc_id', 'entity_id', 'doc_type', 'description', 'issue_date', 'expiry_date', 'responsible_person', 'review_status', 'notes'],
    columns: [
      { key: 'doc_id', label: 'Doc ID', type: 'text', editable: true },
      { key: 'entity_id', label: 'Entity ID', type: 'text', editable: true },
      { key: 'doc_type', label: 'Doc Type', type: 'text', editable: true },
      { key: 'description', label: 'Description', type: 'text', editable: true },
      { key: 'issue_date', label: 'Issue Date', type: 'date', editable: true },
      { key: 'expiry_date', label: 'Expiry Date', type: 'date', editable: true },
      { key: 'review_status', label: 'Review Status', type: 'status', editable: true, options: DOCUMENT_STATUS_OPTIONS },
    ]
  },

  'controls': {
    table: 'controls_log',
    label: 'Controls Log',
    sortDefault: 'due_date',
    filters: ['risk_rating', 'status', 'control_type'],
    editableFields: ['control_id', 'date_logged', 'entity_id', 'control_type', 'description', 'owner', 'risk_rating', 'status', 'evidence_link', 'due_date', 'closure_date', 'comments'],
    columns: [
      { key: 'control_id', label: 'Control ID', type: 'text', editable: true },
      { key: 'date_logged', label: 'Date Logged', type: 'date', editable: true },
      { key: 'entity_id', label: 'Entity ID', type: 'text', editable: true },
      { key: 'control_type', label: 'Control Type', type: 'text', editable: true },
      { key: 'description', label: 'Description', type: 'text', editable: true },
      { key: 'owner', label: 'Owner', type: 'text', editable: true },
      { key: 'risk_rating', label: 'Risk', type: 'status', editable: true, options: RISK_RATING_OPTIONS },
      { key: 'status', label: 'Status', type: 'status', editable: true, options: CONTROL_STATUS_OPTIONS },
      { key: 'due_date', label: 'Due Date', type: 'date', editable: true },
    ]
  },

  'renewals': {
    table: 'renewal_calendar',
    label: 'Renewal Calendar',
    sortDefault: 'due_date',
    filters: ['status', 'item_type'],
    editableFields: ['item_id', 'item_type', 'entity_id', 'description', 'due_date', 'owner', 'status', 'notes'],
    columns: [
      { key: 'item_id', label: 'Item ID', type: 'text', editable: true },
      { key: 'item_type', label: 'Item Type', type: 'text', editable: true },
      { key: 'entity_id', label: 'Entity ID', type: 'text', editable: true },
      { key: 'description', label: 'Description', type: 'text', editable: true },
      { key: 'due_date', label: 'Due Date', type: 'date', editable: true },
      { key: 'owner', label: 'Owner', type: 'text', editable: true },
      { key: 'status', label: 'Status', type: 'status', editable: true, options: CONTROL_STATUS_OPTIONS },
    ]
  },
};

