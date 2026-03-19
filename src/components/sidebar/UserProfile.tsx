'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Props { userId: string; displayName: string | null; email: string | null; photoURL: string | null; }

export default function UserProfile({ userId, displayName, email, photoURL }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [designation, setDesignation] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const name = displayName ?? email?.split('@')[0] ?? 'User';
  const initials = name.charAt(0).toUpperCase();

  useEffect(() => {
    if (!userId) return;
    getDoc(doc(db, 'profiles', userId)).then(snap => {
      if (snap.exists()) setDesignation(snap.data()?.designation ?? '');
    });
  }, [userId]);

  // Close menu on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/onboarding');
  };

  return (
    <div className="p-4 relative" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3">
        {/* Avatar — clickable → profile */}
        <button onClick={() => router.push('/profile')}
          className="shrink-0 w-9 h-9 rounded-xl overflow-hidden transition-all hover:ring-2 hover:ring-[#2e5bff]"
          style={{ boxShadow: '0 0 12px -4px rgba(46,91,255,0.4)' }}>
          {photoURL
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={photoURL} alt={name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg,#2e5bff,#7C3AED)' }}>
                {initials}
              </div>
          }
        </button>

        {/* Name + designation */}
        <button onClick={() => router.push('/profile')} className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-main)' }}>{name}</p>
          <p className="text-[11px] truncate" style={{ color: 'var(--text-faint)' }}>
            {designation || email || 'Set your designation'}
          </p>
        </button>

        {/* Overflow menu trigger */}
        <div ref={menuRef} className="relative shrink-0">
          <button onClick={() => setMenuOpen(v => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-faint)', background: menuOpen ? 'var(--border)' : 'transparent' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)'}
            onMouseLeave={e => { if (!menuOpen) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
            <span className="material-icons" style={{ fontSize: 18 }}>more_vert</span>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute bottom-full right-0 mb-1 w-44 rounded-xl overflow-hidden shadow-2xl z-50"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-card)' }}>
              <button onClick={() => { setMenuOpen(false); router.push('/profile'); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors"
                style={{ color: 'var(--text-main)' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
                <span className="material-icons" style={{ fontSize: 16, color: '#2e5bff' }}>manage_accounts</span>
                Profile
              </button>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors text-red-400"
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.06)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
                <span className="material-icons" style={{ fontSize: 16 }}>logout</span>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
