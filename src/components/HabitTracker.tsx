"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  subscribeHabitDefs,
  subscribeLogs,
  updateLog,
  seedDefaultHabits,
  formatProgress,
  HabitDef,
  HabitLog,
} from "@/lib/habits";

export default function HabitTracker() {
  const [user, setUser] = useState<any>(null);
  const [habits, setHabits] = useState<HabitDef[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  useEffect(() => {
    if (!user) {
      setHabits([]);
      setLogs([]);
      return;
    }
    let unsub: (() => void) | undefined;
    seedDefaultHabits(user.uid).then(() => {
      unsub = subscribeHabitDefs(user.uid, setHabits);
    });
    return () => unsub?.();
  }, [user]);

  useEffect(() => {
    if (!user || habits.length === 0) return;
    return subscribeLogs(user.uid, [today], setLogs);
  }, [user, habits, today]);

  const getLog = (habitId: string): HabitLog =>
    logs.find((l) => l.habitId === habitId) ?? {
      id: "",
      userId: "",
      habitId,
      date: today,
      progress: 0,
      goal: 0,
      achieved: false,
    };

  const handleIncrement = async (habit: HabitDef) => {
    if (!user) return;
    const log = getLog(habit.id);
    const next =
      habit.measureType === "toggle"
        ? log.progress >= habit.goal
          ? 0
          : habit.goal
        : Math.min(log.progress + habit.incrementBy, habit.goal * 2);
    await updateLog(user.uid, habit, today, next);
  };

  // ── 3D tilt ───────────────────────────────────────────────────────────────
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const handleMouseMove = (e: React.MouseEvent, i: number) => {
    const el = cardRefs.current[i];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.03)`;
  };
  const handleMouseLeave = (i: number) => {
    const el = cardRefs.current[i];
    if (el)
      el.style.transform =
        "perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)";
  };

  const activeHabits = habits.filter((h) => h.active);

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-lg font-bold flex items-center gap-2"
          style={{ color: "var(--text-main)" }}
        >
          <span
            className="material-icons text-base"
            style={{ color: "#2e5bff" }}
          >
            timelapse
          </span>
          Daily Habits
        </h2>
        <Link
          href="/habits"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{
            color: "#2e5bff",
            background: "rgba(46,91,255,0.1)",
            border: "1px solid rgba(46,91,255,0.2)",
          }}
        >
          View Details →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activeHabits.map((habit, i) => {
          const log = getLog(habit.id);
          const pct = Math.min((log.progress / (habit.goal || 1)) * 100, 100);
          const done = log.achieved;
          const circ = 2 * Math.PI * 15.9155;
          const dash = (pct / 100) * circ;

          return (
            <div
              key={habit.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              onMouseMove={(e) => handleMouseMove(e, i)}
              onMouseLeave={() => handleMouseLeave(i)}
              className="relative rounded-2xl p-4 flex items-center gap-4 cursor-default overflow-hidden"
              style={{
                // Use CSS vars for base surface; accent glow only when done
                background: done ? `${habit.color}12` : "var(--surface)",
                border: `1px solid ${done ? habit.color + "45" : "var(--border)"}`,
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                boxShadow: done
                  ? `0 0 20px -6px ${habit.color}50, var(--shadow-card)`
                  : "var(--shadow-card)",
                willChange: "transform",
              }}
            >
              {/* Subtle radial bg glow — accent colour, light in both themes */}
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{
                  background: `radial-gradient(circle at 30% 50%, ${habit.color}0e 0%, transparent 70%)`,
                }}
              />

              {/* Progress ring */}
              <div className="relative shrink-0 w-14 h-14">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Track — use CSS var so it matches theme */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="var(--border-strong)"
                    strokeWidth="2.8"
                  />
                  {/* Progress arc */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke={habit.color}
                    strokeWidth="2.8"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    style={{
                      transition: "stroke-dasharray 0.5s ease",
                      filter: `drop-shadow(0 0 4px ${habit.color})`,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {done ? (
                    <span
                      className="material-icons text-lg"
                      style={{ color: habit.color }}
                    >
                      check
                    </span>
                  ) : (
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: habit.color }}
                    >
                      {Math.round(pct)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className="material-icons"
                    style={{ color: habit.color, fontSize: 14 }}
                  >
                    {habit.icon}
                  </span>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-main)" }}
                  >
                    {habit.name}
                  </p>
                </div>
                <p
                  className="text-[11px]"
                  style={{ color: "var(--text-faint)" }}
                >
                  {formatProgress(log.progress, habit.unit, habit.goal)}
                </p>
                {/* Mini progress bar — track uses CSS var */}
                <div
                  className="mt-1.5 h-1 rounded-full overflow-hidden"
                  style={{ background: "var(--border-strong)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: habit.color,
                      boxShadow: `0 0 6px ${habit.color}`,
                    }}
                  />
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={() => handleIncrement(habit)}
                disabled={
                  habit.measureType !== "toggle" &&
                  log.progress >= habit.goal * 2
                }
                className="relative z-10 shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95"
                style={{
                  background: `${habit.color}20`,
                  color: habit.color,
                  border: `1px solid ${habit.color}30`,
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    `${habit.color}38`)
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    `${habit.color}20`)
                }
              >
                {habit.measureType === "toggle"
                  ? log.progress >= habit.goal
                    ? "Undo"
                    : "Done"
                  : `+${habit.incrementBy}${habit.unit}`}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
