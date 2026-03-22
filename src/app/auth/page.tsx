"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import CuplusLoader from "@/components/CuplusLoader";

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: '',       color: 'transparent' },
    { label: 'Weak',   color: '#EF4444' },
    { label: 'Fair',   color: '#F59E0B' },
    { label: 'Good',   color: '#3B82F6' },
    { label: 'Strong', color: '#10B981' },
  ];
  return { score, ...levels[score] };
}

const AuthPage: React.FC = () => {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [isSignup, setIsSignup]         = useState(true);
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPw, setShowPw]             = useState(false);
  const [termsAgreed, setTermsAgreed]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) { router.push("/home"); return; }
      setAuthChecking(false);
    });
  }, [router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isSignup && !termsAgreed) {
      setError("Please agree to the Terms & Privacy Policy to continue.");
      return;
    }
    setLoading(true);
    try {
      if (isSignup) await createUserWithEmailAndPassword(auth, email, password);
      else          await signInWithEmailAndPassword(auth, email, password);
      router.push("/home");
    } catch (err: any) {
      const msg: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email':        'Please enter a valid email address.',
        'auth/weak-password':        'Password must be at least 6 characters.',
        'auth/user-not-found':       'No account found with this email.',
        'auth/wrong-password':       'Incorrect password. Please try again.',
        'auth/too-many-requests':    'Too many attempts. Please try again later.',
        'auth/invalid-credential':   'Invalid credentials. Please check and try again.',
      };
      setError(msg[err.code] ?? err.message);
    } finally { setLoading(false); }
  };

  const handleGoogleAuth = async () => {
    setError(null); setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/home");
    } catch (err: any) { setError(err.message); setLoading(false); }
  };

  const strength = getStrength(password);

  if (authChecking) return <CuplusLoader fullScreen />;
  if (loading)      return <CuplusLoader fullScreen label={isSignup ? "Creating account…" : "Signing in…"} />;

  // ── shared input focus/blur handlers ──────────────────────────────────────
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(46,91,255,0.5)';
    e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(46,91,255,0.1)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--border-strong)';
    e.currentTarget.style.boxShadow   = 'none';
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative"
      style={{ background: 'var(--bg)', color: 'var(--text-main)', fontFamily: "'DM Sans','Inter',sans-serif" }}>

      {/* Ambient glows — accent colours, intentionally theme-neutral */}
      <div className="fixed top-[-15%] left-[-5%] w-125 h-125 rounded-full blur-[140px] pointer-events-none"
        style={{ background: 'rgba(46,91,255,0.1)' }} />
      <div className="fixed bottom-[-15%] right-[-5%] w-100 h-100 rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'rgba(124,58,237,0.07)' }} />

      <main className="relative z-10 w-full max-w-110 px-5 py-8">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#2e5bff,#1a3acc)', boxShadow: '0 0 24px -4px rgba(46,91,255,0.6)' }}>
            <span className="material-icons text-white" style={{ fontSize: 20 }}>bolt</span>
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>Cuplus</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl overflow-hidden"
          style={{
            background:   'var(--surface)',
            border:       '1px solid var(--border-strong)',
            boxShadow:    'var(--shadow-card)',
          }}>

          {/* Tabs */}
          <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
            {(['Sign Up', 'Log In'] as const).map((tab, i) => {
              const active = i === 0 ? isSignup : !isSignup;
              return (
                <button key={tab}
                  onClick={() => { setIsSignup(i === 0); setError(null); }}
                  className="flex-1 py-4 text-sm font-semibold transition-all duration-200 relative"
                  style={{ color: active ? 'var(--text-main)' : 'var(--text-faint)' }}>
                  {tab}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: 'linear-gradient(90deg,#2e5bff,#7C3AED)' }} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-7 space-y-5">

            {/* Heading */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                {isSignup ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                {isSignup
                  ? 'Projects, Notes, Tasks & Habit trackers all in one place.'
                  : 'Sign in to access your workspace.'}
              </p>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-faint)' }}>
                  Email Address
                </label>
                <div className="relative group">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
                    style={{ fontSize: 18, color: 'var(--text-faint)' }}>mail</span>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      background:   'var(--bg)',
                      border:       '1px solid var(--border-strong)',
                      color:        'var(--text-main)',
                    }}
                    onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-faint)' }}>
                  Password
                </label>
                <div className="relative group">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
                    style={{ fontSize: 18, color: 'var(--text-faint)' }}>lock</span>
                  <input
                    type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} required
                    placeholder={isSignup ? 'Create a strong password' : 'Enter your password'}
                    className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      background: 'var(--bg)',
                      border:     '1px solid var(--border-strong)',
                      color:      'var(--text-main)',
                    }}
                    onFocus={onFocus} onBlur={onBlur}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text-faint)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-faint)'}>
                    <span className="material-icons" style={{ fontSize: 18 }}>
                      {showPw ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                {/* Strength meter */}
                {isSignup && password.length > 0 && (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength.score ? strength.color : 'var(--border-strong)' }} />
                      ))}
                    </div>
                    {strength.label && (
                      <p className="text-[10px] font-medium pl-0.5" style={{ color: strength.color }}>
                        {strength.label} password
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Terms */}
              {/* {isSignup && (
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <div className="relative mt-0.5 shrink-0" onClick={() => setTermsAgreed(v => !v)}>
                    <div className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-150"
                      style={{
                        background:  termsAgreed ? '#2e5bff' : 'transparent',
                        borderColor: termsAgreed ? '#2e5bff' : 'var(--border-strong)',
                        boxShadow:   termsAgreed ? '0 0 8px rgba(46,91,255,0.4)' : 'none',
                      }}>
                      {termsAgreed && <span className="material-icons text-white" style={{ fontSize: 11 }}>check</span>}
                    </div>
                  </div>
                  <span className="text-xs leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                    I agree to the{' '}
                    <a href="#" className="text-[#2e5bff] hover:underline">Terms</a>
                    {' '}and{' '}
                    <a href="#" className="text-[#2e5bff] hover:underline">Privacy Policy</a>
                  </span>
                </label>
              )} */}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm text-red-400"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span className="material-icons shrink-0" style={{ fontSize: 15, marginTop: 1 }}>error_outline</span>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button type="submit"
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#2e5bff,#1a3acc)', boxShadow: '0 0 24px -4px rgba(46,91,255,0.55)' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.12)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'}>
                {isSignup ? 'Create Account' : 'Log In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-[11px]"
                  style={{ background: 'var(--surface)', color: 'var(--text-faint)' }}>
                  or continue with
                </span>
              </div>
            </div>

            {/* Google */}
            <button onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]"
              style={{
                background: 'var(--border)',
                border:     '1px solid var(--border-strong)',
                color:      'var(--text-muted)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--border-strong)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)'; }}>
              <svg viewBox="0 0 24 24" width={18} height={18}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Toggle */}
            <p className="text-center text-xs" style={{ color: 'var(--text-faint)' }}>
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button onClick={() => { setIsSignup(v => !v); setError(null); }}
                className="font-semibold transition-colors"
                style={{ color: '#2e5bff' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#60A5FA'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#2e5bff'}>
                {isSignup ? 'Log in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] mt-5" style={{ color: 'var(--text-faint)' }}>
          Protected by Firebase Authentication · Your data stays yours
        </p>
      </main>
    </div>
  );
};

export default AuthPage;