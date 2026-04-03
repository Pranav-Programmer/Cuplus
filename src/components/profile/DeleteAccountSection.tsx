'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteUser, reauthenticateWithPopup, GoogleAuthProvider, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

const COLLECTIONS = ['notes','tasks','projects','sanctumProjects','memories','habitLogs','habits','scratchpads'];

export default function DeleteAccountSection() {
  const router = useRouter();
  const [step,     setStep]     = useState<'idle'|'confirm'|'reauth'|'deleting'>('idle');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  const deleteAllUserData = async (uid: string) => {
  const COLLECTIONS = ['notes','tasks','projects','sanctumProjects','memories','habitLogs','habits','scratchpads'];

  for (const col of COLLECTIONS) {
    const q = query(collection(db, col), where('userId','==',uid));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  }
};

  const handleDelete = async () => {
  const user = auth.currentUser;
  if (!user) return;

  setStep('deleting');
  setError('');

  try {
    // ── Re-authenticate first (required by Firebase for deleteUser) ──
    const providers = user.providerData.map((p) => p.providerId);

    if (providers.includes('google.com')) {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
    } 
    else if (providers.includes('password') && password) {
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);
    } 
    else {
      throw new Error("Please enter your password to confirm account deletion.");
    }

    // Small delay to ensure the ID token is refreshed (fixes "insufficient permissions")
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Delete all user data from Firestore
    await deleteAllUserData(user.uid);

    // Finally delete the Firebase Auth user
    await deleteUser(user);

    // Success → redirect
    router.push('/onboarding');
  } catch (e: any) {
    console.error("Delete account error:", e);

    let errorMsg = e.message || 'Something went wrong.';

    if (e.code === 'auth/requires-recent-login') {
      errorMsg = 'Please sign in again before deleting your account.';
    } else if (e.code === 'auth/wrong-password') {
      errorMsg = 'Incorrect password. Please try again.';
    } else if (e.code === 'permission-denied') {
      errorMsg = 'Permission denied. Please try again after re-authenticating.';
    }

    setError(errorMsg);
    setStep('confirm');
  }
};

  return (
    <section id="delete-account" className="scroll-mt-6">
      <h2 className="text-xl font-bold mb-1 text-red-400">Delete Account</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-faint)' }}>
        Permanently remove your Cuplus account and all associated data.
      </p>
      <div className="h-px mb-5" style={{ background: 'var(--border)' }} />

      {/* Warning card */}
      <div className="rounded-2xl p-5 mb-6"
        style={{ background: 'rgba(239,68,68,0.06)', border: '2px solid rgba(239,68,68,0.2)' }}>
        <div className="flex items-start gap-3 mb-4">
          <span className="material-icons text-red-400 shrink-0 mt-0.5" style={{ fontSize: 22 }}>warning</span>
          <div>
            <p className="font-bold text-red-400 mb-1">This action is permanent and irreversible</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Once you delete your account, all of the following will be permanently removed and cannot be recovered:
            </p>
          </div>
        </div>
        <ul className="space-y-1.5 ml-8">
          {['All your Notes','All your Tasks','All your Projects','All your Habits & Logs','All Sanctum encrypted data','Your profile and settings','Your saved memories'].map(item => (
            <li key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="material-icons text-red-400" style={{ fontSize: 14 }}>close</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {step === 'idle' && (
        <button onClick={() => setStep('confirm')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
          <span className="material-icons" style={{ fontSize: 16 }}>delete_forever</span>
          Delete My Account
        </button>
      )}

      {step === 'confirm' && (
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: 'var(--surface-2)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <p className="font-bold text-sm text-red-400">Are you absolutely sure?</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Type your confirmation below. This will immediately delete your account and all data.
          </p>
          {/* For email users, ask for password */}
          {auth.currentUser?.providerData.some(p => p.providerId === 'password') && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
                style={{ color: 'var(--text-faint)' }}>Enter your password to confirm</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Your current password…"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ background: 'var(--bg)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--text-main)' }} />
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => { setStep('idle'); setError(''); setPassword(''); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--border)', border: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}>
              Cancel
            </button>
            <button onClick={handleDelete}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: '#EF4444' }}>
              Yes, Delete Everything
            </button>
          </div>
        </div>
      )}

      {step === 'deleting' && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-faint)' }}>
          <span className="material-icons" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>sync</span>
          Deleting your account and all data…
        </div>
      )}
    </section>
  );
}
