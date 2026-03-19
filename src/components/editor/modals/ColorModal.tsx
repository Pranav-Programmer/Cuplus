'use client';

import React, { useState } from 'react';
import BaseModal, { primaryBtnCls, secondaryBtnCls } from './BaseModal';
import { TEXT_COLORS, HIGHLIGHT_COLORS } from '../types';

interface ColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'text' | 'highlight';
  onApply: (color: string) => void;
}

export default function ColorModal({ isOpen, onClose, mode, onApply }: ColorModalProps) {
  const colors = mode === 'text' ? TEXT_COLORS : HIGHLIGHT_COLORS;
  const [selected, setSelected] = useState(colors[0]);
  const [customColor, setCustomColor] = useState('#60A5FA');

  const handleApply = () => {
    onApply(mode === 'text' ? (selected || customColor) : selected);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'text' ? 'Text Color' : 'Highlight Color'}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-[#94A3B8] mb-3 font-medium">Select a color</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setSelected(c)}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  selected === c ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {mode === 'text' && (
          <div>
            <p className="text-xs text-[#94A3B8] mb-2 font-medium">Custom color</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customColor}
                onChange={(e) => { setCustomColor(e.target.value); setSelected(e.target.value); }}
                className="w-10 h-10 rounded-lg cursor-pointer border border-white/10 bg-transparent"
              />
              <span className="text-sm text-[#94A3B8] font-mono">{customColor}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className={secondaryBtnCls}>Cancel</button>
          <button onClick={handleApply} className={primaryBtnCls}>Apply</button>
        </div>
      </div>
    </BaseModal>
  );
}
