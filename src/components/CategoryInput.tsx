'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Tag, Plus, X, ChevronDown } from 'lucide-react';

interface CategoryInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
}

export default function CategoryInput({
  value,
  onChange,
  suggestions,
  placeholder = 'e.g. Research, Design, Marketing...',
}: CategoryInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setInputValue(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) &&
      s.toLowerCase() !== inputValue.toLowerCase()
  );

  const isNew =
    inputValue.trim().length > 0 &&
    !suggestions.some((s) => s.toLowerCase() === inputValue.trim().toLowerCase());

  const selectCategory = (cat: string) => {
    setInputValue(cat);
    onChange(cat);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    onChange(v);
    setOpen(true);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
    if (e.key === 'Enter' && inputValue.trim()) { e.preventDefault(); selectCategory(inputValue.trim()); }
    if (e.key === 'ArrowDown' && filtered.length > 0) {
      e.preventDefault();
      wrapRef.current?.querySelector<HTMLButtonElement>('[data-suggestion]')?.focus();
    }
  };

  const handleSuggestionKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, cat: string, idx: number) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCategory(cat); }
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.focus(); }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      wrapRef.current?.querySelectorAll<HTMLButtonElement>('[data-suggestion]')[idx + 1]?.focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx === 0) { inputRef.current?.focus(); return; }
      wrapRef.current?.querySelectorAll<HTMLButtonElement>('[data-suggestion]')[idx - 1]?.focus();
    }
  };

  const showDropdown = open && (filtered.length > 0 || isNew || suggestions.length > 0);

  return (
    <div ref={wrapRef} className="relative">
      <div className={`flex items-center gap-2 bg-[#0B0E14] border rounded-lg px-3 py-2.5 transition-colors ${open ? 'border-primary' : 'border-white/10 hover:border-white/20'}`}>
        <Tag size={13} className="text-[#94A3B8] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[#E2E8F0] text-sm outline-none placeholder-[#94A3B8]/50 min-w-0"
        />
        {inputValue && (
          <button type="button" onClick={handleClear} className="text-[#94A3B8] hover:text-[#E2E8F0] transition-colors shrink-0">
            <X size={13} />
          </button>
        )}
        <button type="button" onClick={() => { setOpen((o) => !o); inputRef.current?.focus(); }} className="text-[#94A3B8] hover:text-[#E2E8F0] transition-colors shrink-0">
          <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute left-0 top-full mt-1.5 w-full z-50 bg-[#151922] border border-white/10 rounded-xl shadow-2xl overflow-hidden" style={{ maxHeight: 220 }}>
          <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
            {suggestions.length === 0 && !inputValue.trim() && (
              <div className="px-4 py-3 text-xs text-[#94A3B8]/60 text-center">
                Type a category name and press Enter to create one
              </div>
            )}
            {(inputValue.trim() ? filtered : suggestions).map((cat, idx) => (
              <button
                key={cat}
                data-suggestion
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectCategory(cat)}
                onKeyDown={(e) => handleSuggestionKeyDown(e, cat, idx)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left text-[#94A3B8] hover:bg-white/5 hover:text-[#E2E8F0] focus:bg-white/5 focus:text-[#E2E8F0] focus:outline-none transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                {cat}
              </button>
            ))}
            {isNew && (
              <button
                data-suggestion
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectCategory(inputValue.trim())}
                onKeyDown={(e) => handleSuggestionKeyDown(e, inputValue.trim(), filtered.length)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left text-[#60A5FA] hover:bg-primary/10 focus:bg-primary/10 focus:outline-none transition-colors border-t border-white/5"
              >
                <Plus size={13} className="shrink-0" />
                Create &ldquo;{inputValue.trim()}&rdquo;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
