'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import CuplusLoader from '@/components/CuplusLoader';
import ThemeToggle from '@/components/ThemeToggle';

const SLIDES = [
  {
    badge: 'Projects', headline: ['Build ideas.', 'Document deeply.'],
    sub: 'A full rich-text editor with syntax highlighting, tables, images and more, all stored securely in the cloud.',
    accent: '#2e5bff', accentMuted: 'rgba(46,91,255,0.12)', icon: 'folder_open', stat: '19 editor features',
  },
  {
    badge: 'Notes', headline: ['Capture fast.', 'Find instantly.'],
    sub: 'Color-coded, categorized notes that sync in real time. Search across everything in milliseconds.',
    accent: '#10B981', accentMuted: 'rgba(16,185,129,0.12)', icon: 'sticky_note_2', stat: 'Real-time sync',
  },
  {
    badge: 'Tasks', headline: ['Stay on track.', 'Ship it.'],
    sub: 'Priority queues, deadlines, and tracking with notifications, so nothing falls through the cracks.',
    accent: '#F59E0B', accentMuted: 'rgba(245,158,11,0.12)', icon: 'check_circle', stat: 'Priority tracking',
  },
  {
    badge: 'Sanctum', headline: ['Your private', 'encrypted vault.'],
    sub: 'Encrypted projects only you can read. Two separate spaces — Personal and Official — each locked with its own password.',
    accent: '#8B5CF6', accentMuted: 'rgba(139,92,246,0.12)', icon: 'shield', stat: 'AES-256 encrypted',
  },
];

// ── Mockup components — all colours via CSS vars ──────────────────────────────
function ProjectMockup() {
  return (
    <div className="w-full max-w-[480px] rounded-2xl shadow-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
      <div className="flex items-center gap-1 px-4 py-3"
        style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
        {['B','I','U','H1','H2','≡'].map(t => (
          <div key={t} className="px-2 py-0.5 rounded text-[10px] font-bold"
            style={{ color: 'var(--text-muted)', background: 'var(--border)', border: '1px solid var(--border-strong)' }}>{t}</div>
        ))}
        <div className="ml-auto flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="h-5 w-3/5 rounded-full" style={{ background: 'var(--border-strong)' }} />
        <div className="space-y-2">
          {[1,0.8,1].map((w,i) => <div key={i} className="h-3 rounded-full" style={{ width: `${w*100}%`, background: 'var(--border)' }} />)}
        </div>
        <div className="rounded-xl p-3 mt-2" style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)' }}>
          <div className="flex gap-2 mb-2">
            <div className="w-12 h-2.5 bg-[#c678dd]/50 rounded-full" />
            <div className="w-16 h-2.5 bg-[#61afef]/50 rounded-full" />
            <div className="w-8 h-2.5 bg-[#98c379]/50 rounded-full" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2 w-5/6 rounded-full" style={{ background: 'var(--border)' }} />
            <div className="h-2 w-2/3 rounded-full" style={{ background: 'var(--border)' }} />
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-[#2e5bff]/10 to-[#7C3AED]/10 border border-[#2e5bff]/15 h-20 flex items-center justify-center">
          <span className="material-icons text-[#2e5bff]/40 text-3xl">image</span>
        </div>
      </div>
    </div>
  );
}

function NotesMockup() {
  const notes = [
    { color: '#2e5bff', cat: 'Work',     lines: [0.9, 0.6, 0.8] },
    { color: '#10B981', cat: 'Reading',  lines: [0.7, 1.0, 0.5] },
    { color: '#F59E0B', cat: 'Personal', lines: [0.8, 0.65, 0.9] },
    { color: '#8B5CF6', cat: 'Creative', lines: [0.6, 0.85, 0.7] },
  ];
  return (
    <div className="w-full max-w-[480px] grid grid-cols-2 gap-3">
      {notes.map(n => (
        <div key={n.cat} className="rounded-xl overflow-hidden shadow-lg"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderTop: `3px solid ${n.color}` }}>
          <div className="p-3.5 space-y-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block"
              style={{ background: `${n.color}20`, color: n.color }}>{n.cat}</span>
            <div className="h-3 rounded-full" style={{ width: '70%', background: `${n.color}30` }} />
            {n.lines.map((w, i) => (
              <div key={i} className="h-2 rounded-full" style={{ width: `${w * 100}%`, background: 'var(--border)' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TasksMockup() {
  const tasks = [
    { label: 'Review Q3 report',       priority: 'High',   color: '#EF4444', done: false, time: '10:00 AM' },
    { label: 'Design system update',   priority: 'Medium', color: '#F59E0B', done: false, time: '2:30 PM' },
    { label: 'Morning standup',        priority: '',       color: '',        done: true,  time: '9:00 AM' },
    { label: 'Push new feature build', priority: 'Low',    color: '#10B981', done: false, time: '5:00 PM' },
  ];
  return (
    <div className="w-full max-w-[480px] rounded-2xl shadow-2xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
      <div className="px-4 pt-4 pb-3 flex justify-between items-center"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-main)' }}>
          Priority Tasks
        </span>
        <div className="flex gap-1">
          {['All','Today','Week'].map((f,i) => (
            <span key={f} className="text-[10px] px-2 py-0.5 rounded-full cursor-pointer"
              style={i===1 ? {background:'#2e5bff',color:'#fff'} : {background:'var(--border)',color:'var(--text-muted)'}}>
              {f}
            </span>
          ))}
        </div>
      </div>
      <div className="p-3 space-y-2">
        {tasks.map(t => (
          <div key={t.label} className="flex items-center gap-3 p-3 rounded-xl"
            style={t.done
              ? { background: 'var(--border)', border: '1px solid var(--border)', opacity: 0.5 }
              : { background: 'var(--surface-2)', border: '1px solid var(--border-strong)' }}>
            <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
              style={t.done ? {background:'#2e5bff',borderColor:'#2e5bff'} : {borderColor:'var(--border-strong)'}}>
              {t.done && <span className="material-icons text-white" style={{fontSize:9}}>check</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium"
                style={{ color: t.done ? 'var(--text-faint)' : 'var(--text-main)', textDecoration: t.done ? 'line-through' : 'none' }}>
                {t.label}
              </p>
              {t.priority && <span className="text-[9px] font-semibold" style={{color:t.color}}>{t.priority}</span>}
            </div>
            <span className="text-[9px] shrink-0" style={{color:'var(--text-faint)'}}>{t.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SanctumMockup() {
  return (
    <div className="w-full max-w-[480px] space-y-3">
      <div className="rounded-2xl border border-violet-500/20 shadow-2xl overflow-hidden"
        style={{ background: 'var(--surface)' }}>
        <div className="px-5 py-4 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(124,58,237,0.1) 100%)', borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <span className="material-icons text-violet-400" style={{fontSize:16}}>shield</span>
          </div>
          <div>
            <p className="text-xs font-bold" style={{color:'var(--text-main)'}}>Sanctum</p>
            <p className="text-[9px] text-violet-400/80">End-to-end encrypted</p>
          </div>
          <div className="ml-auto flex gap-1.5">
            {['🔮 Personal','💼 Official'].map((sp,i) => (
              <span key={sp} className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                style={i===0
                  ? {background:'rgba(139,92,246,0.25)',color:'#C4B5FD',border:'1px solid rgba(139,92,246,0.3)'}
                  : {background:'var(--border)',color:'var(--text-muted)'}}>
                {sp}
              </span>
            ))}
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)' }}>
            <span className="material-icons" style={{fontSize:14,color:'var(--text-muted)'}}>lock</span>
            <div className="flex gap-1 flex-1">
              {Array.from({length:8}).map((_,i) => (
                <div key={i} className="w-2 h-2 rounded-full" style={{background:'rgba(196,181,253,0.6)'}} />
              ))}
            </div>
            <span className="material-icons" style={{fontSize:14,color:'var(--text-muted)'}}>visibility_off</span>
          </div>
          <div className="h-8 rounded-xl flex items-center justify-center" style={{background:'#7C3AED'}}>
            <span className="text-[10px] font-bold text-white tracking-wider">🔓 UNLOCK SANCTUM</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {['Private Journal','Confidential Plan'].map(t => (
          <div key={t} className="rounded-xl p-3 space-y-2"
            style={{ background: 'var(--surface)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div className="w-full h-16 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), var(--bg))' }}>
              <span className="material-icons" style={{fontSize:22,color:'rgba(139,92,246,0.35)'}}>lock</span>
            </div>
            <div className="h-2.5 rounded-full w-3/4" style={{background:'rgba(139,92,246,0.2)'}} />
            <div className="h-1.5 rounded-full" style={{background:'var(--border)'}} />
          </div>
        ))}
      </div>
    </div>
  );
}

const MOCKUPS = [
  <ProjectMockup key="proj" />,
  <NotesMockup   key="notes" />,
  <TasksMockup   key="tasks" />,
  <SanctumMockup key="sanctum" />,
];

// ── Page ──────────────────────────────────────────────────────────────────────
const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [slide, setSlide]   = useState(0);
  const [animating, setAni] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      if (user) { router.push('/home'); return; }
      setAuthChecking(false);
    });
  }, [router]);

  const goTo = (idx: number) => {
    if (idx === slide || animating) return;
    setAni(true);
    setTimeout(() => { setSlide(idx); setAni(false); }, 220);
  };

  if (authChecking) return <CuplusLoader fullScreen />;

  const s = SLIDES[slide];

  return (
    // Outer shell — uses CSS var so theme switch applies here too
    <div className="h-screen overflow-hidden flex items-center justify-center p-2"
      style={{ background: 'var(--bg)', fontFamily: "'DM Sans','Inter',sans-serif", color: 'var(--text-main)' }}>

      {/* Ambient glows — decorative, intentionally keep accent colours */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none transition-all duration-700"
        style={{ background: `${s.accent}18` }} />
      <div className="fixed bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-all duration-700"
        style={{ background: `${s.accent}0d` }} />

      {/* Main container */}
      <div className="relative w-full max-w-[1440px] h-full max-h-[900px] flex flex-col lg:flex-row overflow-hidden rounded-2xl shadow-2xl m-auto"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

        {/* ── Left column ── */}
        <div className="w-full lg:w-5/12 p-6 sm:p-10 lg:p-14 flex flex-col justify-between z-10 relative">

          {/* Logo + theme toggle row */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#2e5bff,#1a3acc)', boxShadow: '0 0 20px -4px rgba(46,91,255,0.55)' }}>
              <span className="material-icons text-white" style={{fontSize:18}}>bolt</span>
            </div>
            <span className="text-xl font-bold tracking-tight" style={{color:'var(--text-main)'}}>Cuplus</span>
            <ThemeToggle className="ml-auto" />
          </div>

          {/* Slide text */}
          <div className="flex flex-col gap-5 mt-8 flex-1 justify-center"
            style={{ opacity: animating?0:1, transform: animating?'translateY(14px)':'translateY(0)', transition:'opacity 0.22s ease,transform 0.22s ease' }}>

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full w-fit border text-xs font-semibold uppercase tracking-wider"
              style={{ background: s.accentMuted, borderColor: `${s.accent}35`, color: s.accent }}>
              <span className="material-icons" style={{fontSize:12}}>{s.icon}</span>
              {s.badge}
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold leading-tight"
              style={{color:'var(--text-main)'}}>
              {s.headline[0]}<br />
              <span style={{ backgroundImage:`linear-gradient(120deg,${s.accent} 0%,var(--text-main) 120%)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                {s.headline[1]}
              </span>
            </h1>

            <p className="leading-relaxed text-base max-w-sm" style={{color:'var(--text-muted)'}}>{s.sub}</p>

            {/* Feature chips */}
            <div className="flex flex-wrap gap-2 mt-1">
              {SLIDES.map((f, i) => (
                <button key={f.badge} onClick={() => goTo(i)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200"
                  style={i===slide
                    ? {background:f.accentMuted, borderColor:`${f.accent}40`, color:f.accent}
                    : {background:'var(--border)', borderColor:'var(--border-strong)', color:'var(--text-faint)'}}>
                  <span className="material-icons" style={{fontSize:11}}>{f.icon}</span>
                  {f.badge}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom controls */}
          <div className="flex flex-col gap-5 mt-8 lg:mt-0">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} className="rounded-full transition-all duration-300"
                  style={{ height:6, width:i===slide?28:6,
                    background: i===slide ? s.accent : 'var(--border-strong)',
                    boxShadow: i===slide ? `0 0 10px ${s.accent}80` : 'none' }} />
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/auth')}
                className="flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 active:scale-[0.97]"
                style={{ background: s.accent, boxShadow:`0 0 24px -4px ${s.accent}80` }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.filter='brightness(1.15)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.filter='brightness(1)'}>
                Get Started
                <span className="material-icons" style={{fontSize:16}}>arrow_forward</span>
              </button>

              <div className="flex gap-2">
                {[
                  { fn: () => goTo((slide-1+SLIDES.length)%SLIDES.length), icon: 'chevron_left' },
                  { fn: () => goTo((slide+1)%SLIDES.length),               icon: 'chevron_right' },
                ].map(btn => (
                  <button key={btn.icon} onClick={btn.fn}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                    style={{ background:'var(--border)', border:'1px solid var(--border-strong)', color:'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background='var(--border-strong)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background='var(--border)'}>
                    <span className="material-icons" style={{fontSize:16}}>{btn.icon}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: mockup panel ── */}
        <div className="w-full lg:w-7/12 relative flex items-center justify-center overflow-hidden p-6 lg:p-12"
          style={{ background:'var(--surface-2)', borderLeft:'1px solid var(--border)' }}>

          {/* Dot grid — uses CSS var colour */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ backgroundImage:'radial-gradient(var(--text-faint) 1px,transparent 1px)', backgroundSize:'24px 24px' }} />

          {/* Accent radial behind mockup */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-96 h-96 rounded-full blur-[100px] transition-colors duration-700"
              style={{ background: `${s.accent}10` }} />
          </div>

          {/* Mockup */}
          <div className="relative z-10 w-full flex items-center justify-center"
            style={{ opacity:animating?0:1, transform:animating?'scale(0.97) translateY(8px)':'scale(1) translateY(0)', transition:'opacity 0.22s ease,transform 0.22s ease' }}>
            {MOCKUPS[slide]}
          </div>

          {/* Top-right badge */}
          <div className="absolute top-8 right-8 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl shadow-xl"
            style={{ background:'var(--surface)', border:'1px solid var(--border-strong)' }}>
            <div className="w-2 h-2 rounded-full" style={{background:s.accent}} />
            <span className="text-[10px] font-semibold" style={{color:'var(--text-muted)'}}>{s.stat}</span>
          </div>

          {/* Bottom-left badge */}
          <div className="absolute bottom-8 left-8 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl shadow-xl"
            style={{ background:'var(--surface)', border:'1px solid var(--border-strong)' }}>
            <span className="material-icons text-[#10B981]" style={{fontSize:14}}>verified_user</span>
            <span className="text-[10px] font-semibold" style={{color:'var(--text-muted)'}}>Firebase secured</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;