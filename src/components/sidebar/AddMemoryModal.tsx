'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => Promise<void>;
}

export default function AddMemoryModal({ isOpen, onClose, onSave }: Props) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!isOpen) return null;
  if (!mounted) return null;

  // if (!isOpen) return null;

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try { await onSave(text.trim()); setText(''); onClose(); }
    finally { setSaving(false); }
  };

  return createPortal (
     <div className="fixed inset-0 z-9999 flex items-center justify-center p-4" >
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4"
      style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="material-icons" style={{ fontSize: 17, color: '#2e5bff' }}>bookmark_add</span>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>Remember This</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-faint)' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-main)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-faint)'}>
            <span className="material-icons" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
              style={{ color: 'var(--text-faint)' }}>
              What do you want to remember?
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, 100))}
              placeholder="e.g. Call dentist on Friday…"
              rows={3}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
              style={{
                background: 'var(--bg)', border: '1px solid var(--border-strong)',
                color: 'var(--text-main)', transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(46,91,255,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,91,255,0.08)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; }}
              autoFocus
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Max 100 characters</span>
              <span className="text-[10px] font-mono"
                style={{ color: text.length > 85 ? '#EF4444' : 'var(--text-faint)' }}>
                {text.length}/100
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: 'var(--border)', border: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !text.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#2e5bff,#1a3acc)', boxShadow: '0 0 14px -4px rgba(46,91,255,0.5)' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>,
  document.body
  );
}
