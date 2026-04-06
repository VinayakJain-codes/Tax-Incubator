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

export default function EditModal({ isOpen, onClose, config, initialData, onSave }: EditModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {});
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

  const hasChanges = Object.keys(formData).some(
    key => formData[key] !== initialData[key]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Check required fields
    const missingRequired = config.columns.find(
      col => col.required && config.editableFields.includes(col.key) && !formData[col.key]
    );
    if (missingRequired) {
      toast.error(`"${missingRequired.label}" is required.`);
      return;
    }

    // 2. Custom logical validations (Entities table)
    if (config.table === 'entities') {
      const sh1 = Number(formData.shareholding_age_1) || 0;
      const sh2 = Number(formData.shareholding_age_2) || 0;
      const sh3 = Number(formData.shareholding_age_3) || 0;
      const total = Number(formData.total_shareholding) || 0;

      // Only reject if there are actually any shareholding values entered, 
      // or if total is specified and doesn't match the sum
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
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const inputStyle = {
    background: '#FFFFFF',
    color: '#111827',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div
          className="px-6 py-4 flex justify-between items-center shrink-0 border-b border-gray-100 bg-white"
        >
          <h3 className="text-lg font-bold text-gray-900">Edit {config.label} Record</h3>
          <button
            onClick={onClose}
            className="transition-colors duration-200 text-gray-400 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form id="editForm" onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 h-full bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {config.columns
              .filter(col => config.editableFields.includes(col.key))
              .map(col => {
                const val = formData[col.key] || '';
                return (
                  <div key={col.key}>
                    <label
                      className="block text-[0.65rem] font-semibold uppercase mb-2 text-gray-500"
                      style={{ letterSpacing: '0.08em' }}
                    >
                      {col.label}
                    </label>
                    
                    {col.options ? (
                      <div className="space-y-2">
                        <select 
                          value={col.options.includes(val) ? val : (val ? 'Other' : '')}
                          onChange={e => {
                            const selected = e.target.value;
                            handleChange(col.key, selected);
                          }}
                          className="w-full px-3 py-2 text-sm focus:outline-none"
                          style={inputStyle}
                        >
                          <option value="">Select...</option>
                          {col.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        {(col.options.includes('Other') && (val === 'Other' || (val && !col.options.includes(val)))) && (
                          <input 
                            type="text"
                            placeholder={`Specify other ${col.label}...`}
                            value={val === 'Other' ? '' : val}
                            onChange={e => handleChange(col.key, e.target.value)}
                            className="w-full px-3 py-2 text-sm mt-1 focus:outline-none border-blue-400"
                            style={{...inputStyle, borderColor: '#60A5FA'}}
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
        <div
          className="px-6 py-4 flex justify-end space-x-3 shrink-0 bg-gray-50 border-t border-gray-200"
        >
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium transition-colors duration-200 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="editForm"
            disabled={!hasChanges || isSaving}
            className="px-4 py-2 text-sm font-bold disabled:opacity-30 transition-colors duration-200 bg-gray-900 text-white rounded-lg hover:bg-black"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
