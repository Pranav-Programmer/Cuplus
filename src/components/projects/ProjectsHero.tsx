'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

interface ProjectsHeroProps {
  onCreateNew: () => void;
}

const CARDS = [
  {
    title: 'PROJECT ALPHA:',
    subtitle: 'RESEARCH',
    meta: ['Client: Zenith Corp.', 'Progress: 70%'],
    progress: 70,
    accent: '#FF8C42',
    glowColor: 'rgba(255,140,66,0.45)',
    rotate: '-8deg',
    z: 0,
    offsetY: '10px',
  },
  {
    title: 'PROJECT BETA:',
    subtitle: 'REDESIGN',
    meta: ['Goal: App Redesign', 'Status: Final Review'],
    progress: 85,
    accent: '#A78BFA',
    glowColor: 'rgba(167,139,250,0.45)',
    rotate: '0deg',
    z: 10,
    offsetY: '0px',
  },
  {
    title: 'PROJECT GAMMA:',
    subtitle: 'NEW API',
    meta: ['Deadline: Dec 31st', 'Status: Drafting'],
    progress: 40,
    accent: '#38BDF8',
    glowColor: 'rgba(56,189,248,0.45)',
    rotate: '8deg',
    z: 0,
    offsetY: '10px',
  },
];

export default function ProjectsHero({ onCreateNew }: ProjectsHeroProps) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isDark, setIsDark] = useState(true);

  // Sync with current theme
  useEffect(() => {
    const update = () => {
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');
    };
    update();
    // Watch for theme changes via MutationObserver
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // Float animation
  useEffect(() => {
    const ids: number[] = [];
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      let t = i * 1.2;
      const speed = 0.45 + i * 0.07;
      const amp   = 6 + i * 2;
      const tick  = () => {
        t += 0.016 * speed;
        el.style.transform = `rotate(${CARDS[i].rotate}) translateY(${Math.sin(t) * amp}px)`;
        ids[i] = requestAnimationFrame(tick);
      };
      ids[i] = requestAnimationFrame(tick);
    });
    return () => ids.forEach(cancelAnimationFrame);
  }, []);

  // Theme-aware values
  const heroBg = isDark
    ? 'linear-gradient(135deg, #0f1629 0%, #1a2456 50%, #0e1535 100%)'
    : 'linear-gradient(135deg, #e8eeff 0%, #dce6ff 50%, #eaf0ff 100%)';

  const headlineColor  = isDark ? '#ffffff'  : '#0F172A';
  const subColor       = isDark ? '#94A3B8'  : '#475569';
  const gridLine       = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(46,91,255,0.06)';
  const cardBg         = isDark
    ? 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
    : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)';
  const cardBorder     = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(46,91,255,0.18)';
  const cardShadow     = isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(46,91,255,0.12)';
  const cardTitleColor = isDark ? 'rgba(255,255,255,0.85)' : '#1e3a8a';
  const cardSubColor   = isDark ? '#ffffff' : '#0F172A';
  const cardMetaColor  = isDark ? 'rgba(255,255,255,0.55)' : '#64748b';
  const cardTrackBg    = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(46,91,255,0.1)';

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden mb-8 mt-10 md:mt-0"
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
        background: isDark
          ? 'radial-gradient(circle, rgba(46,91,255,0.18) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(46,91,255,0.12) 0%, transparent 70%)',
      }} />

      {/* Content */}
      <div className="relative z-10 flex items-center flex-col sm:flex-row justify-between px-8 py-2 sm:py-10 gap-6">

        {/* Left */}
        <div className="flex-1 min-w-0 max-w-md">
          <h1
            className="font-bold leading-tight mb-3"
            style={{
              fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              letterSpacing: '-0.02em',
              color: headlineColor,
              transition: 'color 0.2s',
            }}
          >
            Manage your projects
          </h1>
          <p className="text-sm mb-7" style={{ color: subColor, lineHeight: '1.6', transition: 'color 0.2s' }}>
            One workspace for every project, from first note to final delivery.
          </p>

          <button
            onClick={onCreateNew}
            className="group flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 active:scale-[0.98]"
            style={{ background: '#2e5bff', boxShadow: '0 0 24px -4px rgba(46,91,255,0.6)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background  = '#1a40cc';
              (e.currentTarget as HTMLButtonElement).style.boxShadow   = '0 0 32px -2px rgba(46,91,255,0.8)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background  = '#2e5bff';
              (e.currentTarget as HTMLButtonElement).style.boxShadow   = '0 0 24px -4px rgba(46,91,255,0.6)';
            }}
          >
            <Plus size={17} strokeWidth={2.5} />
            Create New Project
          </button>
        </div>

        {/* Right — floating cards */}
        <div className="md:flex items-center justify-end shrink-0"
          style={{ width: '340px', height: '180px', position: 'relative' }}>
          {CARDS.map((card, i) => (
            <div
              key={card.title}
              ref={el => { cardRefs.current[i] = el; }}
              style={{
                position: 'absolute',
                right: `${(CARDS.length - 1 - i) * 70}px`,
                top: card.offsetY,
                width: '150px',
                zIndex: card.z + i,
                transform: `rotate(${card.rotate})`,
                borderRadius: '14px',
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: `${cardShadow}, 0 0 20px -4px ${card.glowColor}`,
                padding: '12px',
                willChange: 'transform',
                transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
              }}
            >
              <p className="font-bold leading-tight mb-0.5"
                style={{ fontSize: '0.6rem', color: cardTitleColor, letterSpacing: '0.04em' }}>
                {card.title}
              </p>
              <p className="font-black mb-2"
                style={{ fontSize: '0.65rem', color: cardSubColor, letterSpacing: '0.04em' }}>
                {card.subtitle}
              </p>
              {card.meta.map(m => (
                <p key={m} style={{ fontSize: '0.58rem', color: cardMetaColor, marginBottom: '2px' }}>
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