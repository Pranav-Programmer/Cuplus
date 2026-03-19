'use client';

import React, { useRef, useState } from 'react';
import { ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import { uploadToCloudinary, validateImageFile } from '@/lib/cloudinary';

interface ThumbnailUploadProps {
  value: string;                           // current URL
  onChange: (url: string) => void;
}

export default function ThumbnailUpload({ value, onChange }: ThumbnailUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const { valid, error: err } = validateImageFile(file, 5);
    if (!valid) { setError(err!); return; }
    setError('');
    setLoading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch (e: any) {
      setError(e.message ?? 'Upload failed. Check your Cloudinary config.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await handleFile(file);
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 h-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Thumbnail" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 backdrop-blur
                text-white px-3 py-1.5 rounded-lg border border-white/20 transition-colors"
            >
              <Upload size={12} /> Change
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center gap-1 text-xs bg-red-500/20 hover:bg-red-500/30
                text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors"
            >
              <X size={12} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !loading && inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed
            cursor-pointer transition-all
            ${isDragging
              ? 'border-[#2e5bff] bg-[#2e5bff]/10'
              : 'border-white/10 hover:border-[#2e5bff]/50 hover:bg-white/5'
            }
            ${loading ? 'pointer-events-none opacity-70' : ''}
          `}
        >
          {loading ? (
            <Loader2 className="animate-spin text-[#2e5bff]" size={24} />
          ) : (
            <>
              <ImageIcon className="text-[#94A3B8] mb-2" size={28} />
              <p className="text-sm text-[#94A3B8]">
                Drop image or <span className="text-[#60A5FA]">browse</span>
              </p>
              <p className="text-xs text-[#94A3B8]/50 mt-1">PNG, JPG, WebP · 1MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await handleFile(file);
          e.target.value = '';
        }}
      />

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <X size={12} /> {error}
        </p>
      )}
    </div>
  );
}
