'use client';
import React, { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { hashPassword, verifyPassword } from '@/lib/sanctum';

export default function SanctumSection() {
  const [space,       setSpace]       = useState<'personal' | 'official'>('personal');
  const [oldPw,       setOldPw]       = useState('');
  const [newPw,       setNewPw]       = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [showOld,     setShowOld]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState('');
  const [error,       setError]       = useState('');

  const fieldKey = space === 'personal' ? 'personalPasswordHash' : 'officialPasswordHash';

  const inputStyle: React.CSSProperties = {
    flex: 1, background: 'var(--bg)', border: '1px solid var(--border-strong)',
    borderRadius: 10, padding: '10px 14px', fontSize: '0.875rem',
    color: 'var(--text-main)', outline: 'none',
  };

  const handleUpdate = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setError(''); setSuccess('');
    if (!oldPw) { setError('Enter your current password.'); return; }
    if (newPw.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setError('New passwords do not match.'); return; }

    setSaving(true);
    try {
      const snap = await getDoc(doc(db, 'sanctumSettings', user.uid));
      const existing = snap.data()?.[fieldKey];
      if (existing) {
        const valid = await verifyPassword(oldPw, existing);
        if (!valid) { setError('Current password is incorrect.'); setSaving(false); return; }
      }
      const hash = await hashPassword(newPw);
      await setDoc(doc(db, 'sanctumSettings', user.uid), { [fieldKey]: hash }, { merge: true });
      setSuccess(`${space === 'personal' ? 'Personal' : 'Official'} Sanctum password updated successfully.`);
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <section id="sanctum" className="scroll-mt-6">
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-main)' }}>Sanctum Security</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-faint)' }}>
        Update your Sanctum space passwords.
      </p>
      <div className="h-px mb-5" style={{ background: 'var(--border)' }} />

      {/* Warning banner */}
      <div className="rounded-2xl p-4 mb-6 flex items-start gap-3"
        style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <span className="material-icons text-red-400 shrink-0 mt-0.5" style={{ fontSize: 18 }}>warning</span>
        <div>
          <p className="text-sm font-semibold text-red-400">Important: Password cannot be recovered</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            If you forget your Sanctum password, your encrypted data cannot be recovered. There is no reset mechanism. Keep your password safe.
          </p>
        </div>
      </div>

      {/* Space selector */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {(['personal', 'official'] as const).map(s => (
          <button key={s} onClick={() => { setSpace(s); setError(''); setSuccess(''); }}
            className="py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={space === s
              ? { background: s === 'personal' ? 'rgba(124,58,237,0.15)' : 'rgba(217,119,6,0.15)',
                  color: s === 'personal' ? '#A78BFA' : '#FBBF24',
                  border: `1px solid ${s === 'personal' ? 'rgba(124,58,237,0.3)' : 'rgba(217,119,6,0.3)'}` }
              : { background: 'var(--border)', color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }
            }>
            {s === 'personal' ? '🔮 Personal' : '💼 Official'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Current password */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
            style={{ color: 'var(--text-faint)' }}>Current Password</label>
          <div className="flex items-center gap-2">
            <input type={showOld ? 'text' : 'password'} value={oldPw} onChange={e => setOldPw(e.target.value)}
              placeholder="Enter current password…" style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(46,91,255,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,91,255,0.08)'; }}
              onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; }} />
            <button onClick={() => setShowOld(v => !v)}
              className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
              style={{ background: 'var(--border)', color: 'var(--text-faint)' }}>
              <span className="material-icons" style={{ fontSize: 17 }}>
                {showOld ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* New password */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
            style={{ color: 'var(--text-faint)' }}>New Password</label>
          <div className="flex items-center gap-2">
            <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
              placeholder="Minimum 6 characters…" style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(46,91,255,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,91,255,0.08)'; }}
              onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; }} />
            <button onClick={() => setShowNew(v => !v)}
              className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
              style={{ background: 'var(--border)', color: 'var(--text-faint)' }}>
              <span className="material-icons" style={{ fontSize: 17 }}>
                {showNew ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* Confirm */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
            style={{ color: 'var(--text-faint)' }}>Confirm New Password</label>
          <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
            placeholder="Repeat new password…"
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', color: 'var(--text-main)' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(46,91,255,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,91,255,0.08)'; }}
            onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; }} />
        </div>

        {error   && <p className="text-sm text-red-400 flex items-center gap-1.5"><span className="material-icons" style={{fontSize:14}}>error_outline</span>{error}</p>}
        {success && <p className="text-sm text-emerald-400 flex items-center gap-1.5"><span className="material-icons" style={{fontSize:14}}>check_circle</span>{success}</p>}

        <button onClick={handleUpdate} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', boxShadow: '0 0 16px -4px rgba(124,58,237,0.5)' }}>
          {saving
            ? <><span className="material-icons" style={{fontSize:14, animation:'spin 1s linear infinite'}}>sync</span> Updating…</>
            : <><span className="material-icons" style={{fontSize:14}}>lock_reset</span> Update Password</>}
        </button>
      </div>
    </section>
  );
}
