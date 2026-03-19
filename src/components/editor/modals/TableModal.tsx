'use client';

import React, { useState } from 'react';
import BaseModal, {
  modalInputCls,
  modalLabelCls,
  primaryBtnCls,
  secondaryBtnCls,
} from './BaseModal';
import { TableConfig } from '../types';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (config: TableConfig) => void;
}

export default function TableModal({ isOpen, onClose, onInsert }: TableModalProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [hasHeader, setHasHeader] = useState(true);

  const handleInsert = () => {
    onInsert({ rows, cols, hasHeader });
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Insert Table">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={modalLabelCls}>Rows</label>
            <input
              type="number"
              min={1}
              max={20}
              value={rows}
              onChange={(e) => setRows(Math.max(1, Number(e.target.value)))}
              className={modalInputCls}
            />
          </div>
          <div>
            <label className={modalLabelCls}>Columns</label>
            <input
              type="number"
              min={1}
              max={10}
              value={cols}
              onChange={(e) => setCols(Math.max(1, Number(e.target.value)))}
              className={modalInputCls}
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={hasHeader}
            onChange={(e) => setHasHeader(e.target.checked)}
            className="w-4 h-4 accent-[#2e5bff] cursor-pointer"
          />
          <span className="text-sm text-[#94A3B8]">Include header row</span>
        </label>

        {/* Preview grid */}
        <div className="bg-[#0B0E14] rounded-lg p-3 overflow-auto">
          <table className="w-full text-xs border-collapse">
            {hasHeader && (
              <thead>
                <tr>
                  {Array.from({ length: cols }).map((_, c) => (
                    <th
                      key={c}
                      className="border border-white/20 bg-[#1e2330] text-[#94A3B8] px-2 py-1 text-left"
                    >
                      Col {c + 1}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {Array.from({ length: hasHeader ? rows - 1 : rows }).map((_, r) => (
                <tr key={r}>
                  {Array.from({ length: cols }).map((_, c) => (
                    <td
                      key={c}
                      className="border border-white/10 text-[#94A3B8] px-2 py-1"
                    >
                      &nbsp;
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className={secondaryBtnCls}>Cancel</button>
          <button onClick={handleInsert} className={primaryBtnCls}>Insert Table</button>
        </div>
      </div>
    </BaseModal>
  );
}
