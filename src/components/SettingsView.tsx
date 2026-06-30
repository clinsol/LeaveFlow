import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, X, Settings as SettingsIcon, Save } from 'lucide-react';
import { LeaveCategory } from '../types';

interface SettingsViewProps {
  categories: LeaveCategory[];
  onAddCategory: (category: Omit<LeaveCategory, 'id'>) => void;
  onUpdateCategory: (id: string, category: Omit<LeaveCategory, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
  onResetAllData: () => void;
}

export default function SettingsView({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onResetAllData
}: SettingsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editColor, setEditColor] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTotal, setNewTotal] = useState('');
  const [newColor, setNewColor] = useState('text-primary');

  const colorOptions = [
    { value: 'text-primary', label: 'Primary (Purple)', bg: 'bg-primary' },
    { value: 'text-rose-500', label: 'Rose (Red)', bg: 'bg-rose-500' },
    { value: 'text-emerald-500', label: 'Emerald (Green)', bg: 'bg-emerald-500' },
    { value: 'text-amber-500', label: 'Amber (Yellow)', bg: 'bg-amber-500' },
    { value: 'text-blue-500', label: 'Blue', bg: 'bg-blue-500' },
  ];

  const handleStartEdit = (cat: LeaveCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditTotal(cat.total.toString());
    setEditColor(cat.color);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const parsedTotal = parseFloat(editTotal) || 0;
    onUpdateCategory(editingId, { name: editName, total: parsedTotal, color: editColor });
    setEditingId(null);
  };

  const handleSaveAdd = () => {
    const parsedTotal = parseFloat(newTotal) || 0;
    onAddCategory({ name: newName, total: parsedTotal, color: newColor });
    setIsAdding(false);
    setNewName('');
    setNewTotal('');
    setNewColor('text-primary');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-on-surface flex items-center gap-2">
            <SettingsIcon className="text-primary" size={28} />
            Settings
          </h2>
          <p className="text-base text-on-surface-variant font-medium mt-1">Manage your leave types and their balances.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={18} />
          Add Leave Type
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant/30 bg-surface-container-low/50">
          <h3 className="font-bold text-on-surface">Leave Categories</h3>
        </div>
        <div className="divide-y divide-outline-variant/20">
          <AnimatePresence initial={false}>
            {isAdding && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-6 bg-primary/5"
              >
                <div className="flex flex-col md:flex-row items-end gap-4">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2">Category Name</label>
                    <input 
                      type="text" 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm"
                      placeholder="e.g. Parental Leave"
                    />
                  </div>
                  <div className="w-full md:w-32">
                    <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2">Total Days</label>
                    <input 
                      type="number" 
                      value={newTotal} 
                      onChange={(e) => setNewTotal(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm"
                      placeholder="e.g. 15"
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2">Color Accent</label>
                    <select 
                      value={newColor} 
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm"
                    >
                      {colorOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => setIsAdding(false)}
                      className="p-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low"
                    >
                      <X size={20} />
                    </button>
                    <button 
                      onClick={handleSaveAdd}
                      disabled={!newName}
                      className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {categories.map(cat => (
              <div key={cat.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                {editingId === cat.id ? (
                  <div className="flex flex-col md:flex-row items-end gap-4 w-full">
                    <div className="flex-1 w-full">
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm"
                      />
                    </div>
                    <div className="w-full md:w-32">
                      <input 
                        type="number" 
                        value={editTotal} 
                        onChange={(e) => setEditTotal(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm"
                      />
                    </div>
                    <div className="w-full md:w-48">
                      <select 
                        value={editColor} 
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm"
                      >
                        {colorOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setEditingId(null)} className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low">
                        <X size={18} />
                      </button>
                      <button onClick={handleSaveEdit} className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50">
                        <Save size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-3 h-3 rounded-full bg-current ${cat.color}`}></div>
                      <div>
                        <h4 className="font-bold text-on-surface">{cat.name}</h4>
                        <p className="text-xs text-on-surface-variant font-medium">Default Total: {cat.total} days</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => handleStartEdit(cat)}
                        className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteCategory(cat.id)}
                        className="p-2 rounded-lg text-on-surface-variant hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-rose-50 border border-rose-200 rounded-2xl overflow-hidden shadow-sm mt-8">
        <div className="px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-rose-800">Danger Zone</h3>
            <p className="text-sm text-rose-700 mt-1">This will permanently delete all leaves, categories, and custom holidays. It cannot be undone.</p>
          </div>
          <div className="relative">
            {!confirmReset ? (
              <button 
                onClick={() => setConfirmReset(true)}
                className="px-5 py-2.5 bg-rose-600 text-white font-bold rounded-xl text-sm hover:bg-rose-700 transition-colors whitespace-nowrap"
              >
                Reset All Data
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-rose-100 px-3 py-2 rounded-xl border border-rose-300 shadow-sm animate-in fade-in slide-in-from-right-2 whitespace-nowrap">
                <span className="text-sm font-bold text-rose-700 mr-2">Are you sure?</span>
                <button 
                  onClick={() => {
                    onResetAllData();
                    setConfirmReset(false);
                  }}
                  className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg text-xs hover:bg-rose-700 transition-colors"
                >
                  Yes, Reset
                </button>
                <button 
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1.5 bg-white text-rose-700 border border-rose-200 font-bold rounded-lg text-xs hover:bg-rose-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
