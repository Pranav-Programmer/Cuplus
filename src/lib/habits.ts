// src/lib/habits.ts
// ─── Habit definitions + daily logs CRUD ─────────────────────────────────────

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

// ── Types ──────────────────────────────────────────────────────────────────────

export type MeasureType = "increment" | "toggle" | "count";
export type HabitUnit =
  | "ml"
  | "min"
  | "pages"
  | "reps"
  | "km"
  | "hrs"
  | "done"
  | string;

export interface HabitDef {
  id: string;
  userId: string;
  name: string;
  icon: string; // material icon name
  color: string; // hex
  goal: number;
  unit: HabitUnit;
  measureType: MeasureType;
  incrementBy: number; // amount per tap (for 'increment' type)
  order: number; // display order
  active: boolean;
  createdAt: any;
}

export interface HabitLog {
  id: string;
  userId: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  progress: number;
  goal: number;
  achieved: boolean;
}

// ── Default habits (used when a user has no habits yet) ───────────────────────
export const DEFAULT_HABITS: Omit<HabitDef, "id" | "userId" | "createdAt">[] = [
  {
    name: "Hydration",
    icon: "water_drop",
    color: "#0EA5E9",
    goal: 2500,
    unit: "ml",
    measureType: "increment",
    incrementBy: 250,
    order: 0,
    active: true,
  },
  {
    name: "Reading",
    icon: "menu_book",
    color: "#8B5CF6",
    goal: 30,
    unit: "min",
    measureType: "increment",
    incrementBy: 15,
    order: 1,
    active: true,
  },
  {
    name: "Deep Work",
    icon: "psychology",
    color: "#F59E0B",
    goal: 1,
    unit: "done",
    measureType: "toggle",
    incrementBy: 1,
    order: 2,
    active: true,
  },
  {
    name: "Exercise",
    icon: "fitness_center",
    color: "#F97316",
    goal: 30,
    unit: "min",
    measureType: "increment",
    incrementBy: 15,
    order: 3,
    active: true,
  },
];

export const ICON_OPTIONS = [
  "water_drop",
  "menu_book",
  "fitness_center",
  "psychology",
  "directions_run",
  "self_improvement",
  "bedtime",
  "lunch_dining",
  "music_note",
  "code",
  "favorite",
  "directions_bike",
  "pool",
  "local_fire_department",
  "emoji_events",
];

export const COLOR_OPTIONS = [
  "#0EA5E9",
  "#8B5CF6",
  "#F59E0B",
  "#F97316",
  "#10B981",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#6366F1",
];

// ── Habit definitions CRUD ────────────────────────────────────────────────────
const HABITS_COL = "habits";
const LOGS_COL = "habitLogs";

function docToHabit(id: string, d: Record<string, any>): HabitDef {
  return {
    id,
    userId: d.userId ?? "",
    name: d.name ?? "",
    icon: d.icon ?? "star",
    color: d.color ?? "#2e5bff",
    goal: d.goal ?? 1,
    unit: d.unit ?? "done",
    measureType: d.measureType ?? "toggle",
    incrementBy: d.incrementBy ?? 1,
    order: d.order ?? 0,
    active: d.active ?? true,
    createdAt: d.createdAt,
  };
}

export async function getHabitDefs(userId: string): Promise<HabitDef[]> {
  if (!userId) return [];
  const q = query(
    collection(db, HABITS_COL),
    where("userId", "==", userId),
    orderBy("order", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToHabit(d.id, d.data()));
}

export function subscribeHabitDefs(
  userId: string,
  cb: (h: HabitDef[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, HABITS_COL),
    where("userId", "==", userId),
    orderBy("order", "asc"),
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => docToHabit(d.id, d.data()))),
    (err) => {
      if (err.code !== "permission-denied") console.error(err);
    },
  );
}

export async function createHabitDef(
  userId: string,
  input: Omit<HabitDef, "id" | "userId" | "createdAt">,
): Promise<string> {
  const ref = await addDoc(collection(db, HABITS_COL), {
    ...input,
    userId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateHabitDef(
  id: string,
  input: Partial<HabitDef>,
): Promise<void> {
  await updateDoc(doc(db, HABITS_COL, id), input);
}

export async function deleteHabitDef(id: string): Promise<void> {
  await deleteDoc(doc(db, HABITS_COL, id));
}

/** Seed default habits for a new user if they have none */
export async function seedDefaultHabits(userId: string): Promise<void> {
  const existing = await getHabitDefs(userId);
  if (existing.length > 0) return;
  for (const h of DEFAULT_HABITS) {
    await createHabitDef(userId, h);
  }
}

// ── Daily logs CRUD ───────────────────────────────────────────────────────────
function logId(userId: string, habitId: string, date: string) {
  return `${userId}_${habitId}_${date}`;
}

export async function getOrCreateLog(
  userId: string,
  habit: HabitDef,
  date: string,
): Promise<HabitLog> {
  const id = logId(userId, habit.id, date);
  const ref = doc(db, LOGS_COL, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const d = snap.data();
    return {
      id,
      userId,
      habitId: habit.id,
      date,
      progress: d.progress ?? 0,
      goal: d.goal ?? habit.goal,
      achieved: d.achieved ?? false,
    };
  }
  const newLog: Omit<HabitLog, "id"> = {
    userId,
    habitId: habit.id,
    date,
    progress: 0,
    goal: habit.goal,
    achieved: false,
  };
  await setDoc(ref, newLog);
  return { id, ...newLog };
}

export async function updateLog(
  userId: string,
  habit: HabitDef,
  date: string,
  newProgress: number,
): Promise<void> {
  const id = logId(userId, habit.id, date);
  const ref = doc(db, LOGS_COL, id);
  const achieved = newProgress >= habit.goal;
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { progress: newProgress, achieved });
  } else {
    await setDoc(ref, {
      userId,
      habitId: habit.id,
      date,
      progress: newProgress,
      goal: habit.goal,
      achieved,
    });
  }
}

export function subscribeLogs(
  userId: string,
  dates: string[],
  cb: (logs: HabitLog[]) => void,
): Unsubscribe {
  if (!userId || dates.length === 0) return () => {};
  const q = query(
    collection(db, LOGS_COL),
    where("userId", "==", userId),
    where("date", "in", dates.slice(0, 10)), // Firestore 'in' limit = 10
  );
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as HabitLog));
    },
    (err) => {
      if (err.code !== "permission-denied") console.error(err);
    },
  );
}

export async function getLogsForRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<HabitLog[]> {
  if (!userId) return [];
  const q = query(
    collection(db, LOGS_COL),
    where("userId", "==", userId),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as HabitLog);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatProgress(
  progress: number,
  unit: HabitUnit,
  goal: number,
): string {
  if (unit === "done") return progress >= goal ? "Done ✓" : "Not done";
  if (unit === "ml")
    return `${(progress / 1000).toFixed(1)}L / ${(goal / 1000).toFixed(1)}L`;
  return `${progress} / ${goal} ${unit}`;
}

export function getLast14Days(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split("T")[0];
  });
}

export function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });
}

export function toDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
