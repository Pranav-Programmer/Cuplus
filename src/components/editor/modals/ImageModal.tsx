'use client';

import React, { useState, useRef } from 'react';
import { ImageIcon, Upload, Link2 } from 'lucide-react';
import BaseModal, {
  modalInputCls,
  modalLabelCls,
  primaryBtnCls,
  secondaryBtnCls,
} from './BaseModal';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, alt: string) => void;
}

type Tab = 'url' | 'upload';

export default function ImageModal({ isOpen, onClose, onInsert }: ImageModalProps) {
  const [tab, setTab] = useState<Tab>('url');
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleInsert = () => {
    const finalUrl = tab === 'upload' ? (preview ?? '') : url;
    if (!finalUrl) return;
    onInsert(finalUrl, alt || 'Image');
    setUrl(''); setAlt(''); setPreview(null);
    onClose();
  };

  const tabCls = (t: Tab) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
      tab === t
        ? 'bg-[#2e5bff]/20 text-[#60A5FA] border border-[#2e5bff]/30'
        : 'text-[#94A3B8] hover:text-[#E2E8F0]'
    }`;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Insert Image">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          <button className={tabCls('url')} onClick={() => setTab('url')}>
            <Link2 size={13} /> From URL
          </button>
          <button className={tabCls('upload')} onClick={() => setTab('upload')}>
            <Upload size={13} /> Upload File
          </button>
        </div>

        {tab === 'url' ? (
          <div>
            <label className={modalLabelCls}>Image URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setPreview(e.target.value || null); }}
              placeholder="https://example.com/image.jpg"
              className={modalInputCls}
            />
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-[#2e5bff] bg-[#2e5bff]/10'
                : 'border-white/10 hover:border-[#2e5bff]/50 hover:bg-white/5'
            }`}
          >
            <ImageIcon className="mx-auto mb-2 text-[#94A3B8]" size={28} />
            <p className="text-sm text-[#94A3B8]">Drop image here or <span className="text-[#60A5FA]">browse</span></p>
            <p className="text-xs text-[#94A3B8]/60 mt-1">PNG, JPG, GIF, WebP</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }}
            />
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="rounded-lg overflow-hidden border border-white/10 max-h-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
          </div>
        )}

        <div>
          <label className={modalLabelCls}>Alt text (accessibility)</label>
          <input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Describe the image…"
            className={modalInputCls}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className={secondaryBtnCls}>Cancel</button>
          <button onClick={handleInsert} disabled={tab === 'url' ? !url : !preview} className={primaryBtnCls + ' disabled:opacity-50 disabled:cursor-not-allowed'}>
            Insert Image
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
