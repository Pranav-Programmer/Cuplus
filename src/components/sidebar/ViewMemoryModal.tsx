'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

export interface Memory { id: string; text: string; createdAt: any; }

interface Props {
  isOpen: boolean;
  memory: Memory | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export default function ViewMemoryModal({ isOpen, memory, onClose, onDelete }: Props) {

  const [mounted, setMounted] = useState(false);
  
  useEffect(() => { setMounted(true); }, []);

  if (!isOpen || !memory) return null;
  if (!mounted) return null;

  const handleDelete = async () => {
    await onDelete(memory.id);
    onClose();
  };

  const formatDate = (ts: any) => {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return createPortal(
     <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)' }}>

        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="material-icons" style={{ fontSize: 17, color: '#2e5bff' }}>bookmark</span>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>Remember This</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-faint)' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-main)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-faint)'}>
            <span className="material-icons" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Content */}
          <div className="rounded-xl p-4"
            style={{ background: 'rgba(46,91,255,0.06)', border: '1px solid rgba(46,91,255,0.15)' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-main)' }}>
              {memory.text}
            </p>
          </div>

          <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
            <span className="material-icons" style={{ fontSize: 12 }}>calendar_today</span>
            Saved on {formatDate(memory.createdAt)}
          </p>

          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--border)', border: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}>
              Close
            </button>
            <button onClick={handleDelete}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: '#EF4444' }}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>,
  document.body
  );
}
