'use client';

import React, { useEffect, useState } from 'react';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [isDark,   setIsDark]   = useState(true);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => {
    // The blocking script in layout.tsx has already applied the correct
    // data-theme to <html> before first paint — just read it here to keep
    // the button in sync without causing a flash.
    const current = document.documentElement.getAttribute('data-theme');
    setIsDark(current !== 'light');
    setMounted(true);
  }, []);

  const toggle = () => {
    const next  = !isDark;
    const theme = next ? 'dark' : 'light';
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('cuplus-theme', theme); } catch (_) {}
  };

  // Don't render until the effect has run — avoids a brief mismatch where
  // the button shows "Dark" while the page is already in light mode.
  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium
        transition-all duration-200 active:scale-95 ${className}`}
      style={{
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        border:     isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
        color:      isDark ? '#94A3B8' : '#475569',
      }}
    >
      {/* Toggle track */}
      <div
        className="relative w-8 h-4 rounded-full transition-colors duration-300 shrink-0"
        style={{ background: isDark ? '#2e5bff' : '#CBD5E1' }}
      >
        {/* Thumb */}
        <div
          className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300"
          style={{ left: isDark ? '17px' : '2px' }}
        />
      </div>

      {/* Icon */}
      <span className="material-icons" style={{ fontSize: 14 }}>
        {isDark ? 'dark_mode' : 'light_mode'}
      </span>

      {/* Label — hidden on small screens */}
      <span className="hidden sm:inline">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}