"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Layout from "@/components/Layout";
import CuplusLoader from "@/components/CuplusLoader";
import {
  subscribeHabitDefs,
  subscribeLogs,
  getLogsForRange,
  updateLog,
  createHabitDef,
  updateHabitDef,
  deleteHabitDef,
  seedDefaultHabits,
  formatProgress,
  getLast30Days,
  getLast14Days,
  toDisplayDate,
  ICON_OPTIONS,
  COLOR_OPTIONS,
  HabitDef,
  HabitLog,
  MeasureType,
  HabitUnit,
} from "@/lib/habits";

// ── Helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
function pct(progress: number, goal: number) {
  return Math.min((progress / (goal || 1)) * 100, 100);
}

// ── 3D tilt hook ─────────────────────────────────────────────────────────────
function use3DTilt(strength = 12) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) scale(1.025)`;
    el.style.boxShadow = `${-x * 16}px ${y * 16}px 40px rgba(0,0,0,0.35)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform =
      "perspective(900px) rotateY(0deg) rotateX(0deg) scale(1)";
    el.style.boxShadow = "";
  };
  return { ref, onMouseMove: onMove, onMouseLeave: onLeave };
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (!values.length) return null;
  const h = 36,
    w = 120,
    pad = 3;
  const max = Math.max(...values, 1);
  const pts = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1 || 1)) * (w - pad * 2);
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const area =
    `M${pad},${h - pad} ` +
    values
      .map((v, i) => {
        const x = pad + (i / (values.length - 1 || 1)) * (w - pad * 2);
        const y = h - pad - (v / max) * (h - pad * 2);
        return `L${x},${y}`;
      })
      .join(" ") +
    ` L${w - pad},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
      <defs>
        <linearGradient
          id={`sg-${color.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  );
}

// ── Activity grid ─────────────────────────────────────────────────────────────
function ActivityGrid({
  days,
  logs,
  habit,
}: {
  days: string[];
  logs: HabitLog[];
  habit: HabitDef;
}) {
  return (
    <div className="flex gap-1 flex-wrap mt-2">
      {days.map((d) => {
        const log = logs.find((l) => l.habitId === habit.id && l.date === d);
        const p = log ? pct(log.progress, habit.goal) : 0;
        return (
          <div
            key={d}
            title={`${toDisplayDate(d)}: ${log ? formatProgress(log.progress, habit.unit, habit.goal) : "No data"}`}
            className="w-5 h-5 rounded cursor-pointer transition-transform hover:scale-125"
            style={{
              background: p > 0 ? habit.color : "var(--border)",
              opacity: p > 0 ? Math.max(0.2, p / 100) * 0.8 + 0.2 : 1,
              boxShadow: p > 0 ? `0 0 6px ${habit.color}60` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

// ── Habit modal ───────────────────────────────────────────────────────────────
function HabitModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<HabitDef>;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "star");
  const [color, setColor] = useState(initial?.color ?? "#2e5bff");
  const [goal, setGoal] = useState(initial?.goal ?? 1);
  const [unit, setUnit] = useState<HabitUnit>(initial?.unit ?? "done");
  const [measureType, setMeasureType] = useState<MeasureType>(
    initial?.measureType ?? "toggle",
  );
  const [incBy, setIncBy] = useState(initial?.incrementBy ?? 1);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!name.trim()) {
      setErr("Name is required");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        icon,
        color,
        goal: Number(goal),
        unit,
        measureType,
        incrementBy: Number(incBy),
        active: true,
      });
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  // inputCls uses CSS variables so it responds to theme
  const inputCls = `
    w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors
    bg-[var(--bg)] border-[var(--border-strong)] text-[var(--text-main)]
    placeholder-[var(--text-faint)]
    focus:border-[#2e5bff]/50
  `;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "var(--overlay-bg)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl border overflow-hidden shadow-2xl"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border-strong)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h3 className="font-bold" style={{ color: "var(--text-main)" }}>
            {initial?.id ? "Edit Habit" : "New Habit"}
          </h3>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: "var(--text-faint)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-main)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-faint)")
            }
          >
            <span className="material-icons" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label
              className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
              style={{ color: "var(--text-faint)" }}
            >
              Habit Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="e.g. Morning Walk"
            />
          </div>

          {/* Icon picker */}
          <div>
            <label
              className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
              style={{ color: "var(--text-faint)" }}
            >
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: icon === ic ? `${color}30` : "var(--border)",
                    border: `1px solid ${icon === ic ? color : "var(--border-strong)"}`,
                  }}
                >
                  <span
                    className="material-icons"
                    style={{
                      fontSize: 17,
                      color: icon === ic ? color : "var(--text-muted)",
                    }}
                  >
                    {ic}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label
              className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
              style={{ color: "var(--text-faint)" }}
            >
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c,
                    boxShadow:
                      color === c
                        ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}`
                        : "none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Measure type */}
          <div>
            <label
              className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
              style={{ color: "var(--text-faint)" }}
            >
              Measure Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["toggle", "Toggle (done/not done)"],
                  ["increment", "Incremental (add progress)"],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setMeasureType(v)}
                  className="py-2.5 px-3 rounded-xl text-xs font-medium text-left transition-all"
                  style={
                    measureType === v
                      ? {
                          background: `${color}22`,
                          border: `1px solid ${color}50`,
                          color,
                        }
                      : {
                          background: "var(--border)",
                          border: "1px solid var(--border-strong)",
                          color: "var(--text-muted)",
                        }
                  }
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Goal + unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
                style={{ color: "var(--text-faint)" }}
              >
                Goal
              </label>
              <input
                type="number"
                min={1}
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value))}
                className={inputCls}
                disabled={measureType === "toggle"}
              />
            </div>
            <div>
              <label
                className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
                style={{ color: "var(--text-faint)" }}
              >
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value as HabitUnit)}
                placeholder="e.g. ml, min, pages…"
                className={inputCls}
                disabled={measureType === "toggle"}
              />
            </div>
          </div>

          {/* Increment amount */}
          {measureType === "increment" && (
            <div>
              <label
                className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
                style={{ color: "var(--text-faint)" }}
              >
                Increment per tap
              </label>
              <input
                type="number"
                min={1}
                value={incBy}
                onChange={(e) => setIncBy(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          )}

          {/* Preview */}
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: `${color}10`, border: `1px solid ${color}25` }}
          >
            <span className="material-icons" style={{ color, fontSize: 22 }}>
              {icon}
            </span>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {name || "Habit name"}
              </p>
              <p className="text-[11px]" style={{ color }}>
                Goal:{" "}
                {measureType === "toggle"
                  ? "Complete it once"
                  : `${goal} ${unit}`}
              </p>
            </div>
          </div>

          {err && <p className="text-xs text-red-400">{err}</p>}

          <button
            onClick={submit}
            disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: color,
              boxShadow: `0 0 20px -4px ${color}80`,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : initial?.id ? "Save Changes" : "Add Habit"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Habit card ────────────────────────────────────────────────────────────────
function HabitCard({
  habit,
  logs30,
  todayLog,
  userId,
  onEdit,
  onDelete,
}: {
  habit: HabitDef;
  logs30: HabitLog[];
  todayLog: HabitLog | undefined;
  userId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const tilt = use3DTilt(8);
  const d30 = getLast30Days();
  const d14 = getLast14Days();
  const todayDate = today();

  const habLogs = logs30.filter((l) => l.habitId === habit.id);
  const sparkValues = d14.map((d) => {
    const l = habLogs.find((x) => x.date === d);
    return l ? pct(l.progress, habit.goal) : 0;
  });

  const streak = (() => {
    let s = 0,
      dt = new Date();
    for (let i = 0; i < 30; i++) {
      const dStr = dt.toISOString().split("T")[0];
      const l = habLogs.find((x) => x.date === dStr);
      if (l && l.achieved) {
        s++;
        dt.setDate(dt.getDate() - 1);
      } else if (i === 0) {
        dt.setDate(dt.getDate() - 1);
      } else break;
    }
    return s;
  })();

  const completedDays = habLogs.filter((l) => l.achieved).length;
  const progress = todayLog?.progress ?? 0;
  const p = pct(progress, habit.goal);
  const done = todayLog?.achieved ?? false;
  const circ = 2 * Math.PI * 15.9155;

  const handleTap = async () => {
    const next =
      habit.measureType === "toggle"
        ? progress >= habit.goal
          ? 0
          : habit.goal
        : Math.min(progress + habit.incrementBy, habit.goal);
    await updateLog(userId, habit, todayDate, next);
  };

  return (
    <div
      {...tilt}
      className="rounded-2xl overflow-hidden cursor-default"
      style={{
        background: "var(--surface)",
        border: `1px solid ${done ? habit.color + "45" : "var(--border)"}`,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        willChange: "transform",
        boxShadow: done
          ? `0 0 30px -8px ${habit.color}50, var(--shadow-card)`
          : "var(--shadow-card)",
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${habit.color}, ${habit.color}60)`,
        }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{
                background: `${habit.color}20`,
                border: `1px solid ${habit.color}35`,
                boxShadow: `0 0 16px -4px ${habit.color}50`,
              }}
            >
              <span
                className="material-icons"
                style={{ color: habit.color, fontSize: 22 }}
              >
                {habit.icon}
              </span>
            </div>
            <div>
              <h3
                className="font-bold text-base leading-tight"
                style={{ color: "var(--text-main)" }}
              >
                {habit.name}
              </h3>
              <p
                className="text-[11px] mt-0.5"
                style={{ color: "var(--text-faint)" }}
              >
                {formatProgress(progress, habit.unit, habit.goal)}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={onEdit}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{
                background: "var(--border)",
                color: "var(--text-faint)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-muted)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-faint)")
              }
            >
              <span className="material-icons" style={{ fontSize: 13 }}>
                edit
              </span>
            </button>
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{
                background: "var(--border)",
                color: "var(--text-faint)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#f87171")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-faint)")
              }
            >
              <span className="material-icons" style={{ fontSize: 13 }}>
                delete
              </span>
            </button>
          </div>
        </div>

        {/* Progress ring */}
        <div className="flex items-center gap-5 mb-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="var(--border)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke={habit.color}
                strokeWidth="3"
                strokeDasharray={`${(p / 100) * circ} ${circ}`}
                strokeLinecap="round"
                style={{
                  transition: "stroke-dasharray 0.5s ease",
                  filter: `drop-shadow(0 0 5px ${habit.color})`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-lg font-black"
                style={{
                  color: habit.color,
                  textShadow: `0 0 10px ${habit.color}`,
                }}
              >
                {done ? "✓" : `${Math.round(p)}%`}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <p
              className="text-sm font-semibold mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Today's Progress
            </p>
            <button
              onClick={handleTap}
              className="w-full py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={{
                background:
                  done && habit.measureType === "toggle"
                    ? `${habit.color}30`
                    : habit.color,
                color: "white",
                boxShadow: `0 0 16px -4px ${habit.color}70`,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.filter =
                  "brightness(1.15)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.filter =
                  "brightness(1)")
              }
            >
              {habit.measureType === "toggle"
                ? done
                  ? "↩ Undo"
                  : "✓ Mark Done"
                : `+${habit.incrementBy} ${habit.unit}`}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            {
              label: "Streak",
              value: `${streak}d`,
              icon: "local_fire_department",
            },
            {
              label: "This Month",
              value: `${completedDays}d`,
              icon: "calendar_month",
            },
            {
              label: "Completion",
              value: `${Math.round((completedDays / 30) * 100)}%`,
              icon: "percent",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl py-2 px-3 text-center"
              style={{
                background: "var(--border)",
                border: "1px solid var(--border-strong)",
              }}
            >
              <span
                className="material-icons block mb-0.5"
                style={{ fontSize: 13, color: habit.color }}
              >
                {s.icon}
              </span>
              <p
                className="text-sm font-bold"
                style={{ color: "var(--text-main)" }}
              >
                {s.value}
              </p>
              <p
                className="text-[9px] uppercase tracking-wider"
                style={{ color: "var(--text-faint)" }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Sparkline */}
        <div className="mb-3">
          <p
            className="text-[10px] uppercase tracking-wider mb-1"
            style={{ color: "var(--text-faint)" }}
          >
            Last 14 days
          </p>
          <Sparkline values={sparkValues} color={habit.color} />
        </div>

        {/* Activity grid */}
        <div>
          <p
            className="text-[10px] uppercase tracking-wider mb-1"
            style={{ color: "var(--text-faint)" }}
          >
            Activity (30 days)
          </p>
          <ActivityGrid days={d30} logs={logs30} habit={habit} />
        </div>
      </div>
    </div>
  );
}

// ── Summary hero ──────────────────────────────────────────────────────────────
function SummaryHero({
  habits,
  todayLogs,
}: {
  habits: HabitDef[];
  todayLogs: HabitLog[];
}) {
  const tilt = use3DTilt(4);
  const active = habits.filter((h) => h.active);
  const done = active.filter(
    (h) => todayLogs.find((x) => x.habitId === h.id)?.achieved,
  ).length;
  const pctDone =
    active.length > 0 ? Math.round((done / active.length) * 100) : 0;
  const circ = 2 * Math.PI * 15.9155;

  return (
    <div
      {...tilt}
      className="rounded-2xl p-6 mb-8 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, var(--surface-2) 0%, var(--surface) 100%)",
        border: "1px solid rgba(46,91,255,0.2)",
        transition: "transform 0.15s ease",
        willChange: "transform",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.2), 0 0 40px -10px rgba(46,91,255,0.2)",
      }}
    >
      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-strong) 1px,transparent 1px),linear-gradient(90deg,var(--border-strong) 1px,transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      {/* Glow */}
      <div
        className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(46,91,255,0.2) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
        <div>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Today's Overview
          </p>
          <h2
            className="text-4xl font-black mb-1"
            style={{ color: "var(--text-main)" }}
          >
            <span style={{ color: "#60A5FA" }}>{done}</span>
            <span className="text-2xl" style={{ color: "var(--text-faint)" }}>
              /{active.length}
            </span>
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            habits completed
          </p>
        </div>

        {/* Ring */}
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke="var(--border)"
              strokeWidth="2.5"
            />
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              strokeWidth="2.5"
              stroke="url(#hero-grad)"
              strokeLinecap="round"
              strokeDasharray={`${(pctDone / 100) * circ} ${circ}`}
              style={{
                filter: "drop-shadow(0 0 6px rgba(46,91,255,0.8))",
                transition: "stroke-dasharray 0.8s ease",
              }}
            />
            <defs>
              <linearGradient id="hero-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2e5bff" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-xl font-black"
              style={{ color: "var(--text-main)" }}
            >
              {pctDone}%
            </span>
          </div>
        </div>

        {/* Per-habit pills */}
        <div className="flex flex-wrap gap-2">
          {active.map((h) => {
            const ok = todayLogs.find((x) => x.habitId === h.id)?.achieved;
            return (
              <div
                key={h.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  background: ok ? `${h.color}20` : "var(--border)",
                  border: `1px solid ${ok ? h.color + "40" : "var(--border-strong)"}`,
                  color: ok ? h.color : "var(--text-faint)",
                }}
              >
                <span className="material-icons" style={{ fontSize: 11 }}>
                  {ok ? "check_circle" : "radio_button_unchecked"}
                </span>
                {h.name}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HabitsPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAL] = useState(true);
  const [habits, setHabits] = useState<HabitDef[]>([]);
  const [todayLogs, setTodayLogs] = useState<HabitLog[]>([]);
  const [logs30, setLogs30] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; habit?: HabitDef }>({
    open: false,
  });
  const [confirmDel, setConfirmDel] = useState<HabitDef | null>(null);

  const todayStr = today();

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setAL(false);
      }),
    [],
  );

  useEffect(() => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }
    let unsub: (() => void) | undefined;
    seedDefaultHabits(user.uid).then(() => {
      unsub = subscribeHabitDefs(user.uid, (h) => {
        setHabits(h);
        setLoading(false);
      });
    });
    return () => unsub?.();
  }, [user]);

  useEffect(() => {
    if (!user || habits.length === 0) return;
    return subscribeLogs(user.uid, [todayStr], setTodayLogs);
  }, [user, habits, todayStr]);

  useEffect(() => {
    if (!user || habits.length === 0) return;
    const days = getLast30Days();
    const load = async () => {
      const [r1, r2, r3] = await Promise.all([
        getLogsForRange(user.uid, days[0], days[9]),
        getLogsForRange(user.uid, days[10], days[19]),
        getLogsForRange(user.uid, days[20], days[29]),
      ]);
      setLogs30([...r1, ...r2, ...r3]);
    };
    load();
  }, [user, habits]);

  const handleSaveHabit = useCallback(
    async (data: any) => {
      if (!user) return;
      if (modal.habit?.id) await updateHabitDef(modal.habit.id, data);
      else await createHabitDef(user.uid, { ...data, order: habits.length });
    },
    [user, modal.habit, habits.length],
  );

  const handleDelete = async () => {
    if (!confirmDel) return;
    await deleteHabitDef(confirmDel.id);
    setConfirmDel(null);
  };

  if (authLoading || loading)
    return <CuplusLoader fullScreen label="Loading habits…" />;

  const activeHabits = habits.filter((h) => h.active);

  return (
    <Layout>
      {/* Page wrapper uses CSS variable for background */}
      <div
        className="min-h-screen px-4 sm:px-8 py-8 w-full overflow-y-auto no-scrollbar-mobile mt-10 md:mt-0"
        style={{ background: "var(--bg)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="material-icons"
                style={{ color: "#2e5bff", fontSize: 22 }}
              >
                timelapse
              </span>
              <h1
                className="text-3xl font-black"
                style={{ color: "var(--text-main)" }}
              >
                Habits
              </h1>
            </div>
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>
              Track your daily rituals. Build the life you want.
            </p>
          </div>
          <button
            onClick={() => setModal({ open: true })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg,#2e5bff,#7C3AED)",
              boxShadow: "0 0 20px -4px rgba(46,91,255,0.55)",
            }}
          >
            <span className="material-icons" style={{ fontSize: 16 }}>
              add
            </span>
            Add Habit
          </button>
        </div>

        <SummaryHero habits={activeHabits} todayLogs={todayLogs} />

        {activeHabits.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4">🌱</p>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              No habits yet. Start building your routine!
            </p>
            <button
              onClick={() => setModal({ open: true })}
              className="px-6 py-3 rounded-xl text-sm font-bold text-white"
              style={{
                background: "#2e5bff",
                boxShadow: "0 0 20px -4px rgba(46,91,255,0.55)",
              }}
            >
              + Add your first habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6 md:mb-0">
            {activeHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                logs30={[
                  ...logs30,
                  ...todayLogs.filter(
                    (l) => l.habitId === habit.id && l.date === todayStr,
                  ),
                ]}
                todayLog={todayLogs.find((l) => l.habitId === habit.id)}
                userId={user?.uid ?? ""}
                onEdit={() => setModal({ open: true, habit })}
                onDelete={() => setConfirmDel(habit)}
              />
            ))}
          </div>
        )}
      </div>

      {modal.open && (
        <HabitModal
          initial={modal.habit}
          onSave={handleSaveHabit}
          onClose={() => setModal({ open: false })}
        />
      )}

      {confirmDel && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{
            background: "var(--overlay-bg)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border p-6 text-center"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-strong)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              <span
                className="material-icons text-red-400"
                style={{ fontSize: 22 }}
              >
                delete
              </span>
            </div>
            <h3
              className="font-bold mb-2"
              style={{ color: "var(--text-main)" }}
            >
              Delete "{confirmDel.name}"?
            </h3>
            <p className="text-sm mb-5" style={{ color: "var(--text-faint)" }}>
              This will remove the habit definition. Your past logs are kept.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDel(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  background: "var(--border)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-muted)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ background: "#EF4444" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
