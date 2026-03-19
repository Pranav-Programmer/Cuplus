'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import CuplusLoader from '@/components/CuplusLoader';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import AccountSection from '@/components/profile/AccountSection';
import AppearanceSection from '@/components/profile/AppearanceSection';
import SanctumSection from '@/components/profile/SanctumSection';
import StorageSection from '@/components/profile/StorageSection';
import DataExportSection from '@/components/profile/DataExportSection';
import DeleteAccountSection from '@/components/profile/DeleteAccountSection';
import ContactSection from '@/components/profile/ContactSection';

const SectionDivider = () => (
  <div className="py-6"><div style={{ height: 1, background: 'var(--border)' }} /></div>
);

export default function ProfilePage() {
  const router = useRouter();
  const [user,          setUser]          = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [displayName,   setDisplayName]   = useState('');
  const [designation,   setDesignation]   = useState('');
  const [bio,           setBio]           = useState('');
  const [showMobileNav, setShowMobileNav] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async u => {
      if (!u) { router.push('/onboarding'); return; }
      setUser(u);
      setDisplayName(u.displayName ?? u.email?.split('@')[0] ?? 'User');
      const snap = await getDoc(doc(db, 'profiles', u.uid));
      if (snap.exists()) {
        setDesignation(snap.data()?.designation ?? '');
        setBio(snap.data()?.bio ?? '');
      }
      setLoading(false);
    });
  }, [router]);

  if (loading) return <CuplusLoader fullScreen label="Loading profile…" />;

  const handleLogout = async () => {
      await signOut(auth);
      router.push('/onboarding');
    };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex">
        <ProfileSidebar
          name={displayName}
          email={user?.email}
          photoURL={user?.photoURL}
          designation={designation}
        />
      </div>

      {/* ── Mobile sticky header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-3"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-xl"
          style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
          <span className="material-icons" style={{ fontSize: 18 }}>arrow_back</span>
        </button>
        <span className="font-bold text-sm flex-1" style={{ color: 'var(--text-main)' }}>
          Profile & Settings
        </span>
        {/* <button onClick={() => setShowMobileNav(v => !v)}
          className="w-8 h-8 flex items-center justify-center rounded-xl"
          style={{
            background: showMobileNav ? 'rgba(46,91,255,0.12)' : 'var(--border)',
            color: showMobileNav ? '#2e5bff' : 'var(--text-muted)',
          }}>
          <span className="material-icons" style={{ fontSize: 18 }}>menu</span>
        </button> */}
      </div>

      {/* ── Mobile nav drawer ── */}
      {showMobileNav && (
        <div className="md:hidden fixed inset-0 z-20 flex" onClick={() => setShowMobileNav(false)}>
          <div className="w-72 h-full" onClick={e => e.stopPropagation()}>
            <ProfileSidebar
              name={displayName}
              email={user?.email}
              photoURL={user?.photoURL}
              designation={designation}
            />
          </div>
          <div className="flex-1"
            style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(4px)' }} />
        </div>
      )}

      {/* ── Main scrollable content ── */}
      <main className="flex-1 overflow-y-auto no-scrollbar" style={{ background: 'var(--bg)' }}>

        {/* Desktop back button */}
        <div className="hidden md:flex items-center gap-2 px-8 pt-6 pb-2">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-main)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'}>
            <span className="material-icons" style={{ fontSize: 16 }}>arrow_back</span>
            Back to app
          </button>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
            Profile & Settings
          </span>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-20 md:pt-2 pb-6">

          <AccountSection
            name={displayName}
            email={user?.email}
            designation={designation}
            bio={bio}
            photoURL={user?.photoURL}
            onUpdate={(n, d, b) => { setDisplayName(n); setDesignation(d); setBio(b); }}
          />

          <SectionDivider />
          <AppearanceSection />

          <SectionDivider />
          <SanctumSection />

          <SectionDivider />
          <StorageSection />

          <SectionDivider />
          <DataExportSection />

          <SectionDivider />
          <DeleteAccountSection />

          <SectionDivider />
          <ContactSection
            prefillName={displayName}
            prefillEmail={user?.email ?? ''}
          />
        </div>

        {/* Sign out */}
        {/* the button should be center of the screen*/}

      <div className=" md:hidden max-w-max mx-auto px-4 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
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

      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
