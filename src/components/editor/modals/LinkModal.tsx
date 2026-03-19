'use client';

import React, { useState } from 'react';
import BaseModal, {
  modalInputCls,
  modalLabelCls,
  primaryBtnCls,
  secondaryBtnCls,
} from './BaseModal';
import { LinkConfig } from '../types';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (config: LinkConfig) => void;
}

export default function LinkModal({ isOpen, onClose, onInsert }: LinkModalProps) {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  const handleInsert = () => {
    if (!url) return;
    onInsert({ url, text });
    setUrl(''); setText('');
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Insert Link">
      <div className="space-y-4">
        <div>
          <label className={modalLabelCls}>URL *</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className={modalInputCls}
            autoFocus
          />
        </div>
        <div>
          <label className={modalLabelCls}>Display text (leave blank to use selection)</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Click here…"
            className={modalInputCls}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className={secondaryBtnCls}>Cancel</button>
          <button onClick={handleInsert} disabled={!url} className={primaryBtnCls + ' disabled:opacity-50 disabled:cursor-not-allowed'}>
            Insert Link
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
