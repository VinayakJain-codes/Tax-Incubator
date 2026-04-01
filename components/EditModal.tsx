'use client';

import { useState, useEffect } from 'react';
import type { SheetDef } from '../lib/sheet-config';

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

  if (!isOpen) return null;

  const hasChanges = Object.keys(formData).some(
    key => formData[key] !== initialData[key]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
                      <select 
                        value={val}
                        onChange={e => handleChange(col.key, e.target.value)}
                        className="w-full px-3 py-2 text-sm focus:outline-none"
                        style={inputStyle}
                      >
                        <option value="">Select...</option>
                        {col.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
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
                        onChange={e => handleChange(col.key, Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm focus:outline-none"
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
