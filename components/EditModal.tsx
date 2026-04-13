'use client';

import { useState, useEffect } from 'react';
import type { SheetDef } from '../lib/sheet-config';
import toast from 'react-hot-toast';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SheetDef;
  initialData: Record<string, any>;
  onSave: (newData: Record<string, any>) => Promise<void>;
}

// Tables where "is_resigned" triggers a lifecycle prompt
const LIFECYCLE_TABLES = ['directors_officers', 'ubo_register', 'signatories', 'shareholders'];
// Tables where "is_closed" triggers a lifecycle prompt
const CLOSURE_TABLES = ['bank_accounts'];

export default function EditModal({ isOpen, onClose, config, initialData, onSave }: EditModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [entities, setEntities] = useState<{ 
    entity_id: string; 
    legal_name: string;
    full_address?: string;
    city?: string;
    country?: string;
    postal_code?: string;
  }[]>([]);
  // Track pending lifecycle date prompts
  const [pendingLifecycle, setPendingLifecycle] = useState<{
    field: 'resignation_date' | 'closure_date';
    label: string;
  } | null>(null);

  // Fetch real entities from database for the dropdown
  useEffect(() => {
    if (!isOpen) return;
    import('../lib/supabase').then(({ supabase }) => {
      supabase
        .from('entities')
        .select('entity_id, legal_name, full_address, city, country, postal_code')
        .eq('is_deleted', false)
        .order('entity_id', { ascending: true })
        .then(({ data }) => {
          if (data) setEntities(data);
        });
    });
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {});
      setPendingLifecycle(null);
    }
  }, [isOpen, initialData]);

  // Auto-calculate Total Shareholding for Entities
  useEffect(() => {
    if (config.table === 'entities') {
      const sh1 = Number(formData.shareholding_age_1) || 0;
      const sh2 = Number(formData.shareholding_age_2) || 0;
      const sh3 = Number(formData.shareholding_age_3) || 0;
      const sum = sh1 + sh2 + sh3;
      if (formData.total_shareholding !== sum) {
        setFormData(prev => ({ ...prev, total_shareholding: sum }));
      }
    }
  }, [formData.shareholding_age_1, formData.shareholding_age_2, formData.shareholding_age_3, config.table]);

  if (!isOpen) return null;

  const isCompleted = config.hasCompleted && !!formData.is_completed && !!initialData.is_completed;
  const hasChanges = Object.keys(formData).some(key => formData[key] !== initialData[key]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missingRequired = config.columns.find(
      col => col.required && config.editableFields.includes(col.key) && !formData[col.key]
    );
    if (missingRequired) {
      toast.error(`"${missingRequired.label}" is required.`);
      return;
    }

    if (config.table === 'entities') {
      const sh1 = Number(formData.shareholding_age_1) || 0;
      const sh2 = Number(formData.shareholding_age_2) || 0;
      const sh3 = Number(formData.shareholding_age_3) || 0;
      const total = Number(formData.total_shareholding) || 0;
      if ((sh1 > 0 || sh2 > 0 || sh3 > 0 || total > 0) && (sh1 + sh2 + sh3 !== total)) {
        toast.error('Total Shareholding must exactly equal the sum of the individual shareholding percentages.');
        return;
      }
    }

    if (!hasChanges) return onClose();
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
    onClose();
  };

  const handleChange = (key: string, value: any) => {
    // Handle lifecycle toggles — trigger date prompt when turning on
    if (key === 'is_resigned' && value === true && !initialData.is_resigned) {
      setPendingLifecycle({ field: 'resignation_date', label: 'Resignation Date' });
    }
    if (key === 'is_closed' && value === true && !initialData.is_closed) {
      setPendingLifecycle({ field: 'closure_date', label: 'Account Closure Date' });
    }
    // When completing a Compliance record — auto-advance due date
    if (key === 'is_completed' && value === true && config.hasCompleted) {
      const freq = formData.filing_frequency;
      if (freq && formData.last_filing_date) {
        const base = new Date(formData.last_filing_date);
        let newDate: Date | null = null;
        if (freq === 'Monthly')     { newDate = new Date(base); newDate.setMonth(newDate.getMonth() + 1); }
        if (freq === 'Quarterly')   { newDate = new Date(base); newDate.setMonth(newDate.getMonth() + 3); }
        if (freq === 'Semi-Annual') { newDate = new Date(base); newDate.setMonth(newDate.getMonth() + 6); }
        if (freq === 'Annual')      { newDate = new Date(base); newDate.setFullYear(newDate.getFullYear() + 1); }
        if (newDate) {
          const nextStr = newDate.toISOString().split('T')[0];
          setFormData(prev => ({ ...prev, [key]: value, last_filing_date: nextStr }));
          toast.success(`Filing date advanced to ${nextStr} based on ${freq} frequency.`);
          return;
        }
      }
    }
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // When entity_id is picked, auto-fill entity_legal_name too
  const handleEntitySelect = (entityId: string) => {
    const found = entities.find(e => e.entity_id === entityId);
    
    const updates: Record<string, any> = { entity_id: entityId };
    
    if (found) {
      updates.entity_legal_name = found.legal_name;
      
      // Auto-populate address fields when on the addresses sheet
      if (config.table === 'addresses') {
        updates.address_line_1 = found.full_address || '';
        updates.city = found.city || '';
        updates.country = found.country || '';
        updates.postal_code = found.postal_code || '';
      }
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const inputStyle = {
    background: '#FFFFFF',
    color: '#111827',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
  };

  const frozenStyle = {
    background: '#F9FAFB',
    color: '#9CA3AF',
    border: '1px solid #F3F4F6',
    borderRadius: '6px',
  };

  const isChildTable = config.table !== 'entities';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center shrink-0 border-b border-gray-100 bg-white">
          <h3 className="text-lg font-bold text-gray-900">
            Edit {config.label} Record
            {isCompleted && (
              <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                Completed — Read Only
              </span>
            )}
          </h3>
          <button onClick={onClose} className="transition-colors duration-200 text-gray-400 hover:text-gray-900">
            ✕
          </button>
        </div>

        {/* Lifecycle Date Prompt Overlay */}
        {pendingLifecycle && (
          <div className="px-6 py-4 bg-amber-50 border-b border-amber-200 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="text-amber-500 text-xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-800">Please record the {pendingLifecycle.label}</p>
                <p className="text-xs text-amber-600 mt-0.5">This date will be saved with the record.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                onChange={e => setFormData(prev => ({ ...prev, [pendingLifecycle.field]: e.target.value }))}
                className="flex-1 px-3 py-2 text-sm focus:outline-none border border-amber-300 rounded-lg bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (!formData[pendingLifecycle.field]) {
                    setFormData(prev => ({ ...prev, [pendingLifecycle.field]: new Date().toISOString().split('T')[0] }));
                  }
                  setPendingLifecycle(null);
                }}
                className="px-4 py-2 text-sm font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Confirm Date
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form id="editForm" onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 h-full bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {config.columns
              .filter(col => config.editableFields.includes(col.key))
              .map(col => {
                const val = formData[col.key] ?? '';
                // Freeze the form if the record is already marked as completed
                const fieldFrozen = isCompleted && col.key !== 'is_completed';

                // ── Entity ID: Live dropdown from database ──
                if (col.key === 'entity_id' && isChildTable) {
                  return (
                    <div key={col.key}>
                      <label className="block text-[0.65rem] font-semibold uppercase mb-2 text-gray-500" style={{ letterSpacing: '0.08em' }}>
                        {col.label}
                      </label>
                      {fieldFrozen ? (
                        <input type="text" value={val} readOnly className="w-full px-3 py-2 text-sm focus:outline-none cursor-not-allowed" style={frozenStyle} />
                      ) : (
                        <select
                          value={val}
                          onChange={e => handleEntitySelect(e.target.value)}
                          className="w-full px-3 py-2 text-sm focus:outline-none"
                          style={inputStyle}
                        >
                          <option value="">— Select Company —</option>
                          {entities.map(e => (
                            <option key={e.entity_id} value={e.entity_id}>
                              {e.entity_id} · {e.legal_name}
                            </option>
                          ))}
                        </select>
                      )}
                      {val && (
                        <p className="mt-1 text-xs text-green-600 font-medium">
                          ✓ {entities.find(e => e.entity_id === val)?.legal_name || val}
                        </p>
                      )}
                    </div>
                  );
                }

                // ── Entity Legal Name: Read-only, auto-filled ──
                if (col.key === 'entity_legal_name') {
                  return (
                    <div key={col.key}>
                      <label className="block text-[0.65rem] font-semibold uppercase mb-2 text-gray-500" style={{ letterSpacing: '0.08em' }}>
                        {col.label}
                      </label>
                      <input
                        type="text"
                        value={val}
                        readOnly
                        placeholder="Auto-filled when Entity ID is selected"
                        className="w-full px-3 py-2 text-sm focus:outline-none cursor-not-allowed text-gray-500"
                        style={{ ...inputStyle, background: '#F3F4F6' }}
                      />
                    </div>
                  );
                }

                return (
                  <div key={col.key}>
                    <label className="block text-[0.65rem] font-semibold uppercase mb-2 text-gray-500" style={{ letterSpacing: '0.08em' }}>
                      {col.label}
                      {col.key === 'is_completed' && (
                        <span className="ml-1 text-gray-400 normal-case font-normal">(freezes record)</span>
                      )}
                    </label>

                    {fieldFrozen ? (
                      <input type="text" value={String(val)} readOnly className="w-full px-3 py-2 text-sm focus:outline-none cursor-not-allowed" style={frozenStyle} />
                    ) : col.options ? (
                      <div className="space-y-2">
                        <select
                          value={col.options.includes(val) ? val : (val ? 'Other' : '')}
                          onChange={e => handleChange(col.key, e.target.value)}
                          className="w-full px-3 py-2 text-sm focus:outline-none"
                          style={inputStyle}
                        >
                          <option value="">Select...</option>
                          {col.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        {col.options.includes('Other') && (val === 'Other' || (val && !col.options.includes(val))) && (
                          <input
                            type="text"
                            placeholder={`Specify other ${col.label}...`}
                            value={val === 'Other' ? '' : val}
                            onChange={e => handleChange(col.key, e.target.value)}
                            className="w-full px-3 py-2 text-sm mt-1 focus:outline-none"
                            style={{ ...inputStyle, borderColor: '#60A5FA' }}
                            autoFocus
                          />
                        )}
                      </div>
                    ) : col.type === 'boolean' ? (
                      <select
                        value={formData[col.key] === true ? 'true' : formData[col.key] === false ? 'false' : ''}
                        onChange={e => handleChange(col.key, e.target.value === 'true')}
                        className="w-full px-3 py-2 text-sm focus:outline-none"
                        style={inputStyle}
                      >
                        <option value="">Unknown</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : col.type === 'date' ? (
                      <input
                        type="date"
                        value={val ? String(val).split('T')[0] : ''}
                        onChange={e => handleChange(col.key, e.target.value)}
                        className="w-full px-3 py-2 text-sm focus:outline-none"
                        style={inputStyle}
                      />
                    ) : col.type === 'number' ? (
                      <input
                        type="number"
                        value={val}
                        readOnly={config.table === 'entities' && col.key === 'total_shareholding'}
                        onChange={e => handleChange(col.key, Number(e.target.value))}
                        className={`w-full px-3 py-2 text-sm focus:outline-none ${config.table === 'entities' && col.key === 'total_shareholding' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        style={inputStyle}
                      />
                    ) : (
                      <input
                        type="text"
                        value={val}
                        onChange={e => handleChange(col.key, e.target.value)}
                        className="w-full px-3 py-2 text-sm focus:outline-none"
                        style={inputStyle}
                      />
                    )}
                  </div>
                );
              })}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end space-x-3 shrink-0 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium transition-colors duration-200 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          {!isCompleted && (
            <button
              type="submit"
              form="editForm"
              disabled={!hasChanges || isSaving}
              className="px-4 py-2 text-sm font-bold disabled:opacity-30 transition-colors duration-200 bg-gray-900 text-white rounded-lg hover:bg-black"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
