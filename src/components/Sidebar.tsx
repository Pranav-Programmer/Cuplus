'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import RememberThis from './sidebar/RememberThis';
import UserProfile from './sidebar/UserProfile';

const NAV = [
  { href: '/home',        icon: 'dashboard',    label: 'Dashboard' },
  { href: '/notes',       icon: 'sticky_note_2',label: 'Notes'     },
  { href: '/tasks',       icon: 'check_circle', label: 'Tasks'     },
  { href: '/habits',      icon: 'timelapse',    label: 'Habits'    },
  { href: '/projects',    icon: 'folder_open',  label: 'Projects'  },
  { href: '/sanctum',     icon: 'shield',       label: 'Sanctum'   },
  { href: '/archive',     icon: 'inventory_2',  label: 'Archive'   },
  { href: '/recycle-bin', icon: 'delete',       label: 'Recycle Bin'},
];

interface AuthUser { uid: string; displayName: string | null; email: string | null; photoURL: string | null; }

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u ? { uid: u.uid, displayName: u.displayName, email: u.email, photoURL: u.photoURL } : null);
    });
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href === '/home' && pathname === '/');

  return (
    <aside
      className="w-64 h-full flex flex-col shrink-0 overflow-hidden mt-[35px] sm:mt-0"
      style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
    >
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

      {/* ── Nav ── */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 no-scrollbar overflow-y-auto">
        {NAV.map(({ href, icon, label }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group"
              style={{
                background: active ? 'rgba(46,91,255,0.1)' : 'transparent',
                color:      active ? '#2e5bff' : 'var(--text-muted)',
                border:     active ? '1px solid rgba(46,91,255,0.2)' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--border)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-main)'; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)'; } }}
            >
              <span className="material-icons text-xl shrink-0"
                style={{ color: active ? '#2e5bff' : 'inherit', fontSize: 20 }}>
                {icon}
              </span>
              <span className="font-medium text-sm">{label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#2e5bff' }} />
              )}
            </Link>
          );
        })}

        {/* ── Divider ── */}
        <div className="my-2" style={{ height: 1, background: 'var(--border)' }} />

        {/* ── Remember This ── */}
        {user && <RememberThis userId={user.uid} />}
      </nav>

      {/* ── User profile ── */}
      {user && (
        <UserProfile
          userId={user.uid}
          displayName={user.displayName}
          email={user.email}
          photoURL={user.photoURL}
        />
      )}
    </aside>
  );
}
