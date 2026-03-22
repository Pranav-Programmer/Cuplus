'use client';

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import ThemeToggle from "@/components/ThemeToggle";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────
interface HabitProgress {
  hydration: number;
  reading:   number;
  deepWork:  number;
  exercise:  number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getGreeting(hour: number) {
  if (hour < 6)  return { text: 'Take a rest',      emoji: '🌙', period: 'night' };
  if (hour < 12) return { text: 'Good morning',     emoji: '☀️', period: 'morning' };
  if (hour < 18) return { text: 'Good afternoon',   emoji: '🌤️', period: 'afternoon' };
  return           { text: 'Good evening',           emoji: '🌆', period: 'evening' };
}

function getSubMessage(hour: number, habits: HabitProgress): string {
  const { hydration, reading, deepWork, exercise } = habits;
  if (hour < 6)  return "It's late, recharge for tomorrow.";
  if (hour < 12) return "Here's your daily pulse. Let's make it count.";
  if (hour < 18) return "Keep pushing, you're closer to today's goals than you think!";

  const gaps: string[] = [];
  if (hydration < 2500) gaps.push(`💧 ${Math.round((hydration/2500)*100)}% hydration`);
  if (reading   < 30)   gaps.push(`📖 ${reading}/30 min reading`);
  if (deepWork  < 1)    gaps.push(`🧠 deep work pending`);
  if (exercise  < 1)    gaps.push(`🏃 no exercise logged`);

  return gaps.length === 0
    ? "Amazing! You crushed all your habits today! Rest well. 🎉"
    : `Still to go: ${gaps.join(' · ')}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
const Header: React.FC = () => {
  const [userName, setUserName] = useState("there");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [habits, setHabits] = useState<HabitProgress>({ hydration:0, reading:0, deepWork:0, exercise:0 });

  const now          = new Date();
  const hour         = now.getHours();
  const greeting     = getGreeting(hour);
  const subMessage   = getSubMessage(hour, habits);

  const formattedDate = now.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  useEffect(() => {
    return onAuthStateChanged(auth, async user => {
      if (!user) { setUserName("Guest"); return; }

      const name = user.displayName ?? user.email?.split("@")[0] ?? "User";
      setUserName(name.split(" ")[0]);
      setAvatarUrl(user.photoURL);

      try {
        const todayStr = now.toISOString().split("T")[0];
        const q = query(
          collection(db, "habitLogs"),
          where("userId", "==", user.uid),
          where("date",   "==", todayStr),
        );
        const snap = await getDocs(q);
        const p: any = { hydration:0, reading:0, deepWork:0, exercise:0 };
        snap.forEach(d => { const data = d.data(); if (data.habitType in p) p[data.habitType] = data.progress ?? 0; });
        setHabits(p);
      } catch (e) { console.error(e); }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Habit completion dots
  const habitDots = [
    { key: 'hydration', icon: '💧', done: habits.hydration >= 2500 },
    { key: 'reading',   icon: '📖', done: habits.reading   >= 30   },
    { key: 'deepWork',  icon: '🧠', done: habits.deepWork  >= 1    },
    { key: 'exercise',  icon: '🏃', done: habits.exercise  >= 1    },
  ];
  // const completedCount = habitDots.filter(h => h.done).length;
  // const progressPct    = (completedCount / habitDots.length) * 100;

  return (
    <header className="mb-10 mt-14 sm:mt-0">
      <div className="rounded-2xl p-5 sm:p-6 relative overflow-hidden"
        style={{
          background: 'var(--surface)',
          border:     '1px solid var(--border)',
          boxShadow:  '0 4px 24px rgba(0,0,0,0.1)',
        }}>

        {/* Decorative radial glow */}
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 100% 0%, rgba(46,91,255,0.07) 0%, transparent 70%)' }} />

        {/* ── Top row: greeting + avatar + theme toggle ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">

            {/* Avatar or initial */}
            <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center overflow-hidden"
              style={{
                background: avatarUrl ? 'transparent' : 'linear-gradient(135deg,#2e5bff,#7C3AED)',
                boxShadow:  '0 0 16px -4px rgba(46,91,255,0.4)',
              }}>
              {avatarUrl
                ? <Image src={avatarUrl} alt={userName} width={100} height={100} className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-base">{userName.charAt(0).toUpperCase()}</span>
              }
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl" role="img">{greeting.emoji}</span>
                <h1 className="text-xl sm:text-2xl font-black leading-tight truncate"
                  style={{ color: 'var(--text-main)' }}>
                  {greeting.text},&nbsp;
                  <span style={{ backgroundImage:'linear-gradient(120deg,#2e5bff,#7C3AED)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                    {userName}
                  </span>
                  .
                </h1>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{formattedDate}</p>
            </div>
          </div>

          <ThemeToggle />
        </div>

        {/* ── Sub-message ── */}
        <p className="mt-4 text-sm leading-relaxed"
          style={{ color: 'var(--text-muted)', maxWidth: '560px' }}>
          {subMessage}
        </p>

        {/* ── Habit progress row ── */}
        <div className="mt-5 flex items-center gap-4 flex-wrap">

          {/* Habit dots */}
          <div className="flex items-center gap-2">
            {habitDots.map(h => (
              <div key={h.key}
                title={h.key + (h.done ? ' — done ✓' : ' — pending')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background:   h.done ? 'rgba(16,185,129,0.12)' : 'var(--border)',
                  border:       `1px solid ${h.done ? 'rgba(16,185,129,0.25)' : 'var(--border-strong)'}`,
                  color:        h.done ? '#10B981' : 'var(--text-faint)',
                }}>
                <span>{h.icon}</span>
                {h.done && <span className="material-icons" style={{ fontSize: 10 }}>check</span>}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="h-4 w-px" style={{ background: 'var(--border-strong)' }} />

          {/* Progress bar + count */}
          {/* <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[120px]"
              style={{ background: 'var(--border-strong)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct === 100
                    ? '#10B981'
                    : 'linear-gradient(90deg,#2e5bff,#7C3AED)',
                  boxShadow: progressPct === 100 ? '0 0 8px rgba(16,185,129,0.5)' : '0 0 8px rgba(46,91,255,0.4)',
                }} />
            </div>
            <span className="text-xs font-semibold whitespace-nowrap"
              style={{ color: progressPct === 100 ? '#10B981' : 'var(--text-faint)' }}>
              {completedCount}/{habitDots.length} habits
            </span>
          </div> */}
        </div>
      </div>
    </header>
  );
};

export default Header;