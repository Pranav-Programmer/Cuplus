'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Plus, Lock } from 'lucide-react';
import { SanctumSpace } from '@/lib/sanctum';

interface SanctumHeroProps {
  space: SanctumSpace;
  onCreateNew: () => void;
  onLock: () => void;
  lockCountdown: number;
}

const THEMES = {
  personal: {
    darkGradient:  'linear-gradient(135deg, #130d2b 0%, #1e1050 50%, #0f0b20 100%)',
    lightGradient: 'linear-gradient(135deg, #f0ebff 0%, #e4d9ff 50%, #ede8ff 100%)',
    glow:          'rgba(139,92,246,0.18)',
    lightGlow:     'rgba(139,92,246,0.12)',
    primary:       '#7C3AED',
    primaryHov:    '#6D28D9',
    primaryGlow:   'rgba(124,58,237,0.6)',
    accent1:       '#A78BFA',
    accent2:       '#C4B5FD',
    accent3:       '#8B5CF6',
    label:         '🔮 Personal',
    headline:      'Your private Sanctum',
    sub:           'End-to-end encrypted. Decrypted only on your device.',
    cards: [
      { title: 'PRIVATE:', subtitle: 'JOURNAL', meta: ['Encrypted entries', 'Only you can read'], progress: 60, accent: '#A78BFA', glow: 'rgba(167,139,250,0.45)', rotate: '-8deg', right: 0, top: 10 },
      { title: 'PERSONAL:', subtitle: 'NOTES', meta: ['256-bit AES-GCM', 'PBKDF2 key derived'], progress: 80, accent: '#C4B5FD', glow: 'rgba(196,181,253,0.45)', rotate: '0deg', right: 70, top: 0 },
      { title: 'SECRETS:', subtitle: 'VAULT', meta: ['Zero plaintext stored', 'Memory-only session'], progress: 45, accent: '#8B5CF6', glow: 'rgba(139,92,246,0.45)', rotate: '8deg', right: 140, top: 10 },
    ],
  },
  official: {
    darkGradient:  'linear-gradient(135deg, #1a1005 0%, #2d1f00 50%, #150f00 100%)',
    lightGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fffaee 100%)',
    glow:          'rgba(217,119,6,0.18)',
    lightGlow:     'rgba(217,119,6,0.12)',
    primary:       '#D97706',
    primaryHov:    '#B45309',
    primaryGlow:   'rgba(217,119,6,0.6)',
    accent1:       '#FBBF24',
    accent2:       '#FCD34D',
    accent3:       '#F59E0B',
    label:         '💼 Official',
    headline:      'Your official Sanctum',
    sub:           'Classified workspace. Titles and content AES-256 encrypted.',
    cards: [
      { title: 'OFFICIAL:', subtitle: 'STRATEGY', meta: ['Confidential docs', 'Encrypted at rest'], progress: 70, accent: '#FBBF24', glow: 'rgba(251,191,36,0.45)', rotate: '-8deg', right: 0, top: 10 },
      { title: 'BUSINESS:', subtitle: 'PLANS', meta: ['Zero-knowledge store', 'PBKDF2 100k iters'], progress: 55, accent: '#FCD34D', glow: 'rgba(252,211,77,0.45)', rotate: '0deg', right: 70, top: 0 },
      { title: 'REPORT:', subtitle: 'Q4 REVIEW', meta: ['Signed in as you', 'Locked after 60s'], progress: 90, accent: '#F59E0B', glow: 'rgba(245,158,11,0.45)', rotate: '8deg', right: 140, top: 10 },
    ],
  },
};

export default function SanctumHero({ space, onCreateNew, onLock }: SanctumHeroProps) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isDark, setIsDark] = useState(true);
  const theme = THEMES[space];

  // ── Sync with data-theme ────────────────────────────────────────────────────
  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // ── Float animation ─────────────────────────────────────────────────────────
  useEffect(() => {
    const ids: number[] = [];
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      let t = i * 1.2;
      const speed = 0.45 + i * 0.07;
      const amp   = 5 + i * 1.5;
      const tick  = () => {
        t += 0.016 * speed;
        el.style.transform = `rotate(${theme.cards[i].rotate}) translateY(${Math.sin(t) * amp}px)`;
        ids[i] = requestAnimationFrame(tick);
      };
      ids[i] = requestAnimationFrame(tick);
    });
    return () => ids.forEach(cancelAnimationFrame);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space]);

  // ── Theme-aware tokens ──────────────────────────────────────────────────────
  const heroBg       = isDark ? theme.darkGradient  : theme.lightGradient;
  const heroGlow     = isDark ? theme.glow           : theme.lightGlow;
  const gridLine     = isDark ? 'rgba(255,255,255,0.025)' : `${theme.primary}08`;
  const headlineColor= isDark ? '#ffffff'            : '#0F172A';
  const subColor     = isDark ? '#94A3B8'            : '#475569';
  const switchColor  = isDark ? '#94A3B8'            : '#64748b';
  const switchBorder = isDark ? 'rgba(255,255,255,0.15)' : `${theme.primary}30`;
  const switchHoverBg= isDark ? 'rgba(255,255,255,0.1)'  : `${theme.primary}10`;

  // Floating card tokens
  const cardBg       = isDark
    ? 'linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)'
    : 'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.72) 100%)';
  const cardBorder   = isDark ? 'rgba(255,255,255,0.12)' : `${theme.primary}22`;
  const cardShadowBase= isDark ? '0 8px 32px rgba(0,0,0,0.4)' : `0 8px 32px ${theme.primary}18`;
  const cardTitleClr = isDark ? 'rgba(255,255,255,0.85)' : '#1e1b4b';
  const cardSubClr   = isDark ? '#ffffff'                : '#0F172A';
  const cardMetaClr  = isDark ? 'rgba(255,255,255,0.55)' : '#64748b';
  const cardTrackBg  = isDark ? 'rgba(255,255,255,0.12)' : `${theme.primary}15`;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden mb-8"
      style={{ background: heroBg, minHeight: '200px', transition: 'background 0.3s ease' }}
    >
      {/* Grid texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage:
          `linear-gradient(${gridLine} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Radial glow */}
      <div className="absolute pointer-events-none" style={{
        right: '-60px', bottom: '-60px',
        width: '400px', height: '400px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${heroGlow} 0%, transparent 70%)`,
      }} />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between px-6 sm:px-8 py-8 sm:py-10 gap-6">

        {/* Left */}
        <div className="flex-1 min-w-0 max-w-md">

          {/* Space badge + Switch */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
              style={{
                background:   `${theme.primary}20`,
                borderColor:  `${theme.primary}40`,
                color:        theme.accent1,
              }}>
              {theme.label}
            </div>
            <button
              onClick={onLock}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors"
              style={{ borderColor: switchBorder, color: switchColor }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = switchHoverBg;
                (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#E2E8F0' : '#0F172A';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = switchColor;
              }}
            >
              <Lock size={10} /> Switch
            </button>
          </div>

          <h1
            className="font-bold leading-tight mb-3"
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
              letterSpacing: '-0.02em',
              color: headlineColor,
              transition: 'color 0.2s',
            }}
          >
            {theme.headline}
          </h1>

          <p className="text-xs sm:text-sm mb-5 sm:mb-7"
            style={{ color: subColor, lineHeight: '1.6', transition: 'color 0.2s' }}>
            {theme.sub}
          </p>

          {/* CTA */}
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 active:scale-[0.97]"
            style={{ background: theme.primary, boxShadow: `0 0 24px -4px ${theme.primaryGlow}` }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background  = theme.primaryHov;
              (e.currentTarget as HTMLButtonElement).style.boxShadow   = `0 0 32px -2px ${theme.primaryGlow}`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background  = theme.primary;
              (e.currentTarget as HTMLButtonElement).style.boxShadow   = `0 0 24px -4px ${theme.primaryGlow}`;
            }}
          >
            <Plus size={16} strokeWidth={2.5} /> New Project
          </button>
        </div>

        {/* Right — floating cards */}
        <div className="hidden md:flex items-center justify-end shrink-0"
          style={{ width: '340px', height: '180px', position: 'relative' }}>
          {theme.cards.map((card, i) => (
            <div
              key={card.title}
              ref={el => { cardRefs.current[i] = el; }}
              style={{
                position: 'absolute',
                right: `${card.right}px`,
                top: `${card.top}px`,
                width: '152px',
                zIndex: i === 1 ? 10 : i,
                transform: `rotate(${card.rotate})`,
                borderRadius: '14px',
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: `${cardShadowBase}, 0 0 20px -4px ${card.glow}`,
                padding: '12px',
                willChange: 'transform',
                transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
              }}
            >
              <p className="font-bold leading-tight mb-0.5"
                style={{ fontSize: '0.58rem', color: cardTitleClr, letterSpacing: '0.04em' }}>
                {card.title}
              </p>
              <p className="font-black mb-2"
                style={{ fontSize: '0.65rem', color: cardSubClr, letterSpacing: '0.04em' }}>
                {card.subtitle}
              </p>
              {card.meta.map(m => (
                <p key={m} style={{ fontSize: '0.57rem', color: cardMetaClr, marginBottom: '2px' }}>
                  {m}
                </p>
              ))}
              {/* Progress bar */}
              <div style={{ marginTop: '8px', height: '3px', borderRadius: '99px', background: cardTrackBg, overflow: 'hidden' }}>
                <div style={{ width: `${card.progress}%`, height: '100%', borderRadius: '99px', background: card.accent, boxShadow: `0 0 8px ${card.accent}` }} />
              </div>
              {/* Neon squiggle */}
              <svg viewBox="0 0 120 30" style={{ width: '100%', marginTop: '6px', opacity: isDark ? 0.85 : 0.7 }} fill="none">
                <path d="M0 22 Q20 6 40 18 Q60 30 80 12 Q100 0 120 14"
                  stroke={card.accent} strokeWidth="2.2" strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 4px ${card.accent})` }} />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}