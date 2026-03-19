'use client';
import React, { useEffect, useState } from 'react';

export default function AppearanceSection() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const toggle = () => {
    const next = !isDark;
    const theme = next ? 'dark' : 'light';
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('cuplus-theme', theme); } catch (_) {}
  };

  return (
    <section id="appearance" className="scroll-mt-6">
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-main)' }}>Appearance</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-faint)' }}>
        Customize your visual experience.
      </p>
      <div className="h-px mb-5" style={{ background: 'var(--border)' }} />

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {/* Dark Mode row */}
        <div className="flex items-center gap-4 p-5"
          style={{ background: 'var(--surface-2)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: isDark ? 'rgba(46,91,255,0.15)' : 'rgba(245,158,11,0.12)', border: `1px solid ${isDark ? 'rgba(46,91,255,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
            <span className="material-icons" style={{ fontSize: 20, color: isDark ? '#60A5FA' : '#F59E0B' }}>
              {isDark ? 'dark_mode' : 'light_mode'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
              {isDark ? 'Reduces eye strain in low-light conditions' : 'Better visibility in bright environments'}
            </p>
          </div>

          {/* Toggle */}
          <button onClick={toggle}
            className="relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0"
            style={{ background: isDark ? '#2e5bff' : '#CBD5E1' }}>
            <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300"
              style={{ left: isDark ? '26px' : '2px' }} />
          </button>
        </div>

        {/* Info note */}
        <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-faint)' }}>
            <span className="material-icons" style={{ fontSize: 13 }}>info</span>
            Your theme preference is saved in your browser and persists across sessions.
          </p>
        </div>
      </div>
    </section>
  );
}
