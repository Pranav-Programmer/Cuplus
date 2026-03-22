'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const SECTIONS = [
  { id: 'account',       icon: 'manage_accounts', label: 'Account'        },
  { id: 'appearance',    icon: 'palette',          label: 'Appearance'     },
  { id: 'sanctum',       icon: 'shield',           label: 'Sanctum'        },
  { id: 'storage',       icon: 'storage',          label: 'Storage'        },
  { id: 'data-export',   icon: 'download',         label: 'Data & Export'  },
  { id: 'delete-account',icon: 'delete_forever',   label: 'Delete Account' },
  { id: 'contact',       icon: 'mail',             label: 'Contact Us'     },
];

interface Props {
  name: string;
  email: string | null;
  photoURL: string | null;
  designation: string;
}

export default function ProfileSidebar({ name }: Props) {
  const router = useRouter();
  const [active, setActive] = useState('account');

  // Highlight active section on scroll using IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: '-30% 0px -60% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/onboarding');
  };

  // const initials = name.charAt(0).toUpperCase();

  return (
    <aside
      className="w-64 shrink-0 flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
    >
      {/* User info */}
      {/* <div className="px-5 py-6 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
            style={{ boxShadow: '0 0 16px -4px rgba(46,91,255,0.4)' }}>
            {photoURL
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={photoURL} alt={name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-lg font-black text-white"
                  style={{ background: 'linear-gradient(135deg,#2e5bff,#7C3AED)' }}>
                  {initials}
                </div>
            }
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: 'var(--text-main)' }}>{name}</p>
            <p className="text-[11px] truncate" style={{ color: 'var(--text-faint)' }}>
              {designation || email || ''}
            </p>
          </div>
        </div>
      </div> */}

      {/* ── Logo ── */}
      <div className="h-16 flex items-center px-5 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#2e5bff,#1a3acc)', boxShadow: '0 0 16px -4px rgba(46,91,255,0.5)' }}>
          <span className="material-icons text-white" style={{ fontSize: 18 }}>bolt</span>
        </div>
        <span className="ml-2.5 font-bold text-xl tracking-tight" style={{ color: 'var(--text-main)' }}>
          Cuplus
        </span>
      </div>

      {/* Section nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 no-scrollbar">
        {SECTIONS.map(({ id, icon, label }) => {
          const isActive = active === id;
          const isDanger = id === 'delete-account';
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={{
                background: isActive
                  ? isDanger ? 'rgba(239,68,68,0.08)' : 'rgba(46,91,255,0.1)'
                  : 'transparent',
                color: isActive
                  ? isDanger ? '#EF4444' : '#2e5bff'
                  : isDanger ? '#EF4444' : 'var(--text-muted)',
                border: isActive
                  ? isDanger ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(46,91,255,0.2)'
                  : '1px solid transparent',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <span className="material-icons shrink-0" style={{ fontSize: 18 }}>{icon}</span>
              {label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full"
                style={{ background: isDanger ? '#EF4444' : '#2e5bff' }} />}
            </button>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 transition-all"
          style={{ background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
        >
          <span className="material-icons" style={{ fontSize: 18 }}>logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
