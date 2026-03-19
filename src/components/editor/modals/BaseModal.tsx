'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}: BaseModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`w-full ${maxWidth} bg-[#151922] border border-white/10 rounded-xl shadow-2xl
          animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-[#E2E8F0] font-semibold text-base">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Shared modal input styles ────────────────────────────────────────────────
export const modalInputCls =
  'w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2.5 text-[#E2E8F0] text-sm outline-none ' +
  'focus:border-[#2e5bff] placeholder-[#94A3B8] transition-colors';

export const modalLabelCls = 'block text-xs text-[#94A3B8] mb-1.5 font-medium';

export const modalSelectCls =
  'w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2.5 text-[#E2E8F0] text-sm outline-none ' +
  'focus:border-[#2e5bff] transition-colors cursor-pointer';

export const primaryBtnCls =
  'px-4 py-2 bg-[#2e5bff] hover:bg-[#1a40cc] text-white text-sm font-semibold rounded-lg transition-colors';

export const secondaryBtnCls =
  'px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-[#94A3B8] text-sm rounded-lg transition-colors';
