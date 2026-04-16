// DEPRECATED: Audit logging is now handled 100% via PostgreSQL Database Triggers.
// These functions are left as empty stubs to prevent import errors in older code.

export interface AuditPayload {
  table_name: string;
  record_id: string;
  entity_id?: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
}

export async function logAudit(payload: AuditPayload) {
  // Deprecated: Handled by DB Trigger
}

export async function logEditChanges(
  tableName: string, 
  recordId: string, 
  oldRecord: Record<string, any>, 
  newRecord: Record<string, any>
) {
  // Deprecated: Handled by DB Trigger
}
