'use client';
import React, { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface Props {
  name: string;
  email: string | null;
  designation: string;
  bio: string;
  photoURL: string | null;
  onUpdate: (name: string, designation: string, bio: string) => void;
}

export default function AccountSection({ name, email, designation, bio, photoURL, onUpdate }: Props) {
  const [displayName, setDisplayName]   = useState(name);
  const [desig,        setDesig]        = useState(designation);
  const [bioText,      setBioText]      = useState(bio);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState('');

  const initials = name.charAt(0).toUpperCase();

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg)',
    border: '1px solid var(--border-strong)', borderRadius: 10,
    padding: '10px 14px', fontSize: '0.875rem', color: 'var(--text-main)', outline: 'none',
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'rgba(46,91,255,0.5)';
    e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(46,91,255,0.08)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--border-strong)';
    e.currentTarget.style.boxShadow   = 'none';
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true); setError('');
    try {
      await updateProfile(user, { displayName: displayName.trim() || email?.split('@')[0] });
      await setDoc(doc(db, 'profiles', user.uid), {
        designation: desig.trim(),
        bio: bioText.trim(),
        updatedAt: new Date(),
      }, { merge: true });
      onUpdate(displayName.trim(), desig.trim(), bioText.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const hasChanges = displayName !== name || desig !== designation || bioText !== bio;

  return (
    <section id="account" className="scroll-mt-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>Account</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-faint)' }}>
            Manage your public profile and contact details.
          </p>
        </div>
        {hasChanges && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
            Unsaved changes
          </span>
        )}
      </div>

      <div className="h-px my-5" style={{ background: 'var(--border)' }} />

      {/* Avatar row */}
      <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0"
          style={{ boxShadow: '0 0 20px -4px rgba(46,91,255,0.35)' }}>
          {photoURL
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={photoURL} alt={name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white"
                style={{ background: 'linear-gradient(135deg,#2e5bff,#7C3AED)' }}>
                {initials}
              </div>
          }
        </div>
        <div>
          <p className="font-bold text-base" style={{ color: 'var(--text-main)' }}>{displayName || email?.split('@')[0]}</p>
          <p className="text-sm" style={{ color: 'var(--text-faint)' }}>{desig || 'No designation set'}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
            Profile photo is managed by your Google account
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
              style={{ color: 'var(--text-faint)' }}>Full Name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name…" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
              style={{ color: 'var(--text-faint)' }}>Email Address</label>
            <input type="email" value={email ?? ''} disabled
              style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>Email cannot be changed here</p>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
            style={{ color: 'var(--text-faint)' }}>Designation</label>
          <input type="text" value={desig} onChange={e => setDesig(e.target.value)}
            placeholder="e.g. Product Designer, Developer…" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
            style={{ color: 'var(--text-faint)' }}>Bio</label>
          <textarea
            value={bioText}
            onChange={e => setBioText(e.target.value)}
            placeholder="Tell us a little about yourself…"
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', color: 'var(--text-main)' }}
            onFocus={onFocus as any} onBlur={onBlur as any}
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 flex items-center gap-1.5">
            <span className="material-icons" style={{ fontSize: 14 }}>error_outline</span>{error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#2e5bff,#1a3acc)', boxShadow: '0 0 16px -4px rgba(46,91,255,0.5)' }}>
            {saving
              ? <><span className="material-icons" style={{ fontSize: 14, animation: 'spin 1s linear infinite' }}>sync</span> Saving…</>
              : <><span className="material-icons" style={{ fontSize: 14 }}>save</span> Save Changes</>}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
              <span className="material-icons" style={{ fontSize: 13 }}>check_circle</span> Saved!
            </span>
          )}
          {hasChanges && !saving && (
            <button onClick={() => { setDisplayName(name); setDesig(designation); setBioText(bio); }}
              className="text-sm font-medium transition-colors" style={{ color: 'var(--text-faint)' }}>
              Discard
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
