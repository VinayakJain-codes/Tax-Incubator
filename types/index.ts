export type Json =
| string
| number
| boolean
| null
| { [key: string]: Json | undefined }
| Json[]

export interface Database {
public: {
  Tables: {
    entities: {
      Row: {
        entity_id: string
        entity_code: string | null
        legal_name: string | null
        trading_name: string | null
        holding_company: string | null
        jurisdiction: string | null
        address: string | null
        city: string | null
        country: string | null
        postal_code: string | null
        legal_form: string | null
        registration_no: string | null
        incorporation_date: string | null
        entity_status: string | null
        risk_rating: string | null
        remarks: string | null
        created_at: string | null
        updated_at: string | null
        updated_by: string | null
        is_deleted: boolean | null
      }
      Insert: Partial<Database['public']['Tables']['entities']['Row']>
      Update: Partial<Database['public']['Tables']['entities']['Row']>
    }
    audit_log: {
      Row: {
        id: string
        table_name: string
        record_id: string
        entity_id: string | null
        field_name: string
        old_value: string | null
        new_value: string | null
        changed_by_id: string | null
        changed_by_email: string | null
        changed_at: string
        action: string
      }
      Insert: Partial<Database['public']['Tables']['audit_log']['Row']>
      Update: Partial<Database['public']['Tables']['audit_log']['Row']>
    }
    // Simplified stub to ensure TS compilation. 
    // Usually generated from `supabase gen types`. 
    // All dynamic tables expect Record<string, any> in GenericTable component anyway.
  }
}
}
