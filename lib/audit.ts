import { supabase } from './supabase';

export interface AuditPayload {
  table_name: string;
  record_id: string;
  entity_id?: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
}

/**
 * App-level logAudit that captures the user ID and Email from the active session.
 * This runs BEFORE or ALONGSIDE the table update, ensuring that user context
 * (which the DB trigger might lack if not using RLS tightly) is properly recorded.
 */
export async function logAudit(payload: AuditPayload) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.warn('No active session found for auditing; continuing without user context.');
    }

    const completeLog = {
      ...payload,
      changed_by_id: session?.user.id || null,
      changed_by_email: session?.user.email || 'system@unknown.local',
      changed_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('audit_log').insert(completeLog as any);
    
    if (error) {
      console.error('Failed to write audit log:', error);
      // Depending on strictness, we might want to throw here. 
      // For now, silently failing the audit log avoids blocking operations if the DB fails to log.
    }
  } catch (err) {
    console.error('Audit exception:', err);
  }
}

/**
 * Convenience method to compare two objects and log all changed fields automatically.
 * Useful for UPDATE operations.
 */
export async function logEditChanges(
  tableName: string, 
  recordId: string, 
  oldRecord: Record<string, any>, 
  newRecord: Record<string, any>
) {
  const keys = Object.keys(newRecord);
  
  for (const key of keys) {
    if (['id', 'created_at', 'updated_at', 'updated_by'].includes(key)) continue;
    
    const oldVal = oldRecord[key];
    const newVal = newRecord[key];
    
    if (oldVal !== newVal) {
      await logAudit({
        table_name: tableName,
        record_id: recordId,
        field_name: key,
        old_value: oldVal ? String(oldVal) : null,
        new_value: newVal ? String(newVal) : null,
        action: 'UPDATE'
      });
    }
  }
}
