'use client';

import React, { useState } from 'react';
import BaseModal, {
  modalLabelCls,
  modalSelectCls,
  primaryBtnCls,
  secondaryBtnCls,
} from './BaseModal';
import { CodeBlockConfig, SUPPORTED_LANGUAGES } from '../types';

interface CodeBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (config: CodeBlockConfig) => void;
}

export default function CodeBlockModal({ isOpen, onClose, onInsert }: CodeBlockModalProps) {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');

  const handleInsert = () => {
    onInsert({ language, code });
    setCode('');
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Insert Code Block" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className={modalLabelCls}>Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={modalSelectCls}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={modalLabelCls}>Code</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={10}
            placeholder="Paste your code here…"
            className={
              'w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2.5 text-[#E2E8F0] ' +
              'text-sm outline-none focus:border-primary placeholder-[#94A3B8] transition-colors ' +
              'resize-y font-mono text-xs leading-relaxed'
            }
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className={secondaryBtnCls}>Cancel</button>
          <button onClick={handleInsert} className={primaryBtnCls}>Insert Block</button>
        </div>
      </div>
    </BaseModal>
  );
}
