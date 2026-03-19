'use client';

import React from 'react';

interface CuplusLoaderProps {
  /** Fills the entire viewport — use for page-level loading */
  fullScreen?: boolean;
  /** Optional label shown below the logo */
  label?: string;
}

/**
 * CuplusLoader
 *
 * Mimics the LinkedIn splash-screen loader:
 * A concentric ring expands outward from the logo, fades, then a new ring
 * pulses back in — giving the illusion of rings being "absorbed" into the logo.
 *
 * Three staggered rings run simultaneously so the animation feels continuous.
 */
export default function CuplusLoader({ fullScreen = false, label }: CuplusLoaderProps) {
  const wrapper = fullScreen
    ? 'fixed inset-0 z-[9999] flex items-center justify-center'
    : 'flex items-center justify-center w-full h-full min-h-[200px]';

  return (
    <div className={wrapper}>
      <div className="flex flex-col items-center gap-6">
        {/* ── Animated ring stack ── */}
        <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>

          {/* Ring 1 — leading pulse */}
          <span style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid transparent',
            backgroundImage: 'linear-gradient(var(--bg), var(--bg)), conic-gradient(from 0deg, #2e5bff 0%, #7C3AED 40%, transparent 70%)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            animation: 'cuplus-ring-pulse 1.8s ease-in-out infinite',
            animationDelay: '0s',
          }} />

          {/* Ring 2 — mid pulse */}
          <span style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid transparent',
            backgroundImage: 'linear-gradient(var(--bg), var(--bg)), conic-gradient(from 120deg, #2e5bff 0%, #7C3AED 40%, transparent 70%)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            animation: 'cuplus-ring-pulse 1.8s ease-in-out infinite',
            animationDelay: '0.6s',
          }} />

          {/* Ring 3 — trailing pulse */}
          <span style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid transparent',
            backgroundImage: 'linear-gradient(var(--bg), var(--bg)), conic-gradient(from 240deg, #2e5bff 0%, #7C3AED 40%, transparent 70%)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            animation: 'cuplus-ring-pulse 1.8s ease-in-out infinite',
            animationDelay: '1.2s',
          }} />

          {/* Outer glow that breathes */}
          <span style={{
            position: 'absolute',
            inset: '-4px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(46,91,255,0.15) 0%, transparent 70%)',
            animation: 'cuplus-glow-breathe 1.8s ease-in-out infinite',
          }} />

          {/* ── Logo ── */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #2e5bff 0%, #1a3acc 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px -4px rgba(46,91,255,0.55), 0 4px 16px rgba(0,0,0,0.4)',
          }}>
            {/* Bolt icon — matches the Layout sidebar logo exactly */}
            <svg
              viewBox="0 0 24 24"
              width={28}
              height={28}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13 2L4.09 12.96a.5.5 0 0 0 .38.81H11l-1 8.23a.5.5 0 0 0 .91.34L19.91 11.04a.5.5 0 0 0-.38-.81H13l1-8.23A.5.5 0 0 0 13 2z"
                fill="white"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* ── Optional label ── */}
        {label && (
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            animation: 'cuplus-label-fade 1.8s ease-in-out infinite',
          }}>
            {label}
          </p>
        )}
      </div>

      {/* ── Keyframes injected as a style tag ── */}
      <style>{`
        @keyframes cuplus-ring-pulse {
          0% {
            transform: scale(0.55);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 0.7;
          }
          100% {
            transform: scale(1.55);
            opacity: 0;
          }
        }

        @keyframes cuplus-glow-breathe {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50%       { opacity: 1;   transform: scale(1.1); }
        }

        @keyframes cuplus-label-fade {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
