"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import CalendarWidget from "@/components/CalendarWidget";
import QuickCapture from "@/components/QuickCapture";
import DeleteConfirmation from "@/components/DeleteConfirmation";
import CuplusLoader from "@/components/CuplusLoader";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface Task {
  id: string;
  task: string;
  description?: string;
  date: string;
  time: string;
  notify: boolean;
  done: boolean;
  tags: string[];
  createdAt: any;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split("T")[0];

function formatDateTime(date: string, time: string) {
  const now = new Date();
  const target = new Date(`${date}T${time}`);
  const diffMs = target.getTime() - now.getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  const tomorrow = new Date(now.getTime() + 86400000)
    .toISOString()
    .split("T")[0];
  const timeStr = new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  let label: string;
  if (date === today) label = `Today · ${timeStr}`;
  else if (date === tomorrow) label = `Tomorrow · ${timeStr}`;
  else
    label = `${new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${timeStr}`;

  return {
    label,
    urgent: diffH >= 0 && diffH <= 2,
    overdue: diffMs < 0 && !new Date(`${date}T${time}`),
  };
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#EF4444",
  high: "#F97316",
  medium: "#F59E0B",
  low: "#10B981",
  work: "#2e5bff",
  personal: "#8B5CF6",
};
function tagColor(tag: string) {
  return PRIORITY_COLORS[tag.toLowerCase()] ?? "#2e5bff";
}

// ── Task card (module-level to avoid remount) ─────────────────────────────────
const TaskCard = ({
  task,
  expanded,
  onToggle,
  onExpand,
  onDelete,
}: {
  task: Task;
  expanded: boolean;
  onToggle: (id: string, done: boolean) => void;
  onExpand: (id: string | null) => void;
  onDelete: (task: Task) => void;
}) => {
  const isPast = task.date < today;
  const { label: dtLabel, urgent } = formatDateTime(task.date, task.time);
  const accentColor =
    urgent && !task.done ? "#EF4444" : isPast ? "var(--text-faint)" : "#2e5bff";

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "var(--surface)",
        border: `1px solid ${task.done ? "var(--border)" : urgent && !task.done ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
        opacity: task.done ? 0.65 : 1,
        boxShadow:
          urgent && !task.done
            ? "0 0 16px -6px rgba(239,68,68,0.3)"
            : "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Left accent stripe */}
      <div className="flex">
        <div
          className="w-1 shrink-0 rounded-l-2xl"
          style={{
            background: task.done
              ? "var(--border)"
              : urgent
                ? "#EF4444"
                : "linear-gradient(180deg,#2e5bff,#7C3AED)",
          }}
        />

        <div className="flex-1 p-4">
          {/* Main row */}
          <div className="flex items-start gap-3">
            {/* Custom checkbox */}
            <button
              onClick={() => onToggle(task.id, !task.done)}
              className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all"
              style={{
                background: task.done ? "#2e5bff" : "transparent",
                borderColor: task.done ? "#2e5bff" : "var(--border-strong)",
                boxShadow: task.done ? "0 0 10px rgba(46,91,255,0.4)" : "none",
              }}
            >
              {task.done && (
                <span
                  className="material-icons text-white"
                  style={{ fontSize: 11 }}
                >
                  check
                </span>
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold leading-snug"
                style={{
                  color: task.done ? "var(--text-faint)" : "var(--text-main)",
                  textDecoration: task.done ? "line-through" : "none",
                }}
              >
                {task.task}
              </p>

              {/* Date/time row */}
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="material-icons"
                  style={{ fontSize: 11, color: accentColor }}
                >
                  {urgent && !task.done ? "alarm" : "schedule"}
                </span>
                <span className="text-[11px]" style={{ color: accentColor }}>
                  {dtLabel}
                </span>
                {urgent && !task.done && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      color: "#EF4444",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    Soon
                  </span>
                )}
                {task.done && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "rgba(16,185,129,0.1)",
                      color: "#10B981",
                      border: "1px solid rgba(16,185,129,0.2)",
                    }}
                  >
                    Done
                  </span>
                )}
              </div>

              {/* Tags */}
              {task.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {task.tags.map((tag, i) => {
                    const c = tagColor(tag);
                    return (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: `${c}15`,
                          color: c,
                          border: `1px solid ${c}25`,
                        }}
                      >
                        #{tag}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onExpand(expanded ? null : task.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                style={{
                  color: "var(--text-faint)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--text-muted)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--text-faint)";
                }}
              >
                <span className="material-icons" style={{ fontSize: 16 }}>
                  {expanded ? "expand_less" : "expand_more"}
                </span>
              </button>
              <button
                onClick={() => onDelete(task)}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                style={{
                  color: "var(--text-faint)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(239,68,68,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#EF4444";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--text-faint)";
                }}
              >
                <span className="material-icons" style={{ fontSize: 15 }}>
                  delete
                </span>
              </button>
            </div>
          </div>

          {/* Expanded description */}
          {expanded && (
            <div
              className="mt-3 pt-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {/* <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {task.description || "No description added."}
              </p> */}
              <div
                className="flex items-center gap-3 mt-2 text-[11px]"
                style={{ color: "var(--text-faint)" }}
              >
                <span className="flex items-center gap-1">
                  <span className="material-icons" style={{ fontSize: 11 }}>
                    calendar_today
                  </span>
                  {task.date}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-icons" style={{ fontSize: 11 }}>
                    schedule
                  </span>
                  {task.time}
                </span>
                {/* {task.notify && (
                  <span className="flex items-center gap-1">
                    <span className="material-icons" style={{ fontSize: 11 }}>
                      notifications_active
                    </span>
                    Notify on
                  </span>
                )} */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({
  icon,
  label,
  count,
  iconColor,
}: {
  icon: string;
  label: string;
  count: number;
  iconColor: string;
}) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="material-icons text-base" style={{ color: iconColor }}>
      {icon}
    </span>
    <h3 className="text-base font-bold" style={{ color: "var(--text-main)" }}>
      {label}
    </h3>
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
      style={{
        background: `${iconColor}15`,
        color: iconColor,
        border: `1px solid ${iconColor}25`,
      }}
    >
      {count}
    </span>
  </div>
);

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyTasks = ({ filtered }: { filtered: boolean }) => (
  <div
    className="flex flex-col items-center justify-center py-16 rounded-2xl"
    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
  >
    <span
      className="material-icons text-5xl mb-3"
      style={{ color: "var(--text-faint)" }}
    >
      check_circle
    </span>
    <p className="font-semibold text-sm" style={{ color: "var(--text-muted)" }}>
      {filtered ? "No tasks for this date" : "You're all clear!"}
    </p>
    <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
      {filtered ? "Try a different date" : "Add a task using Quick Capture"}
    </p>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const TasksPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setAllTasks([]);
      return;
    }
    const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
    return onSnapshot(
      q,
      (snap) => {
        setAllTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task));
      },
      (err) => {
        if (err.code !== "permission-denied") console.error(err);
      },
    );
  }, [user]);

  const { upcoming, past } = (() => {
    let list = allTasks;
    if (selectedDate) list = list.filter((t) => t.date === selectedDate);
    const upcoming = list
      .filter((t) => t.date >= today)
      .sort((a, b) =>
        a.date !== b.date
          ? a.date.localeCompare(b.date)
          : a.time.localeCompare(b.time),
      );
    const past = list
      .filter((t) => t.date < today)
      .sort((a, b) =>
        a.date !== b.date
          ? b.date.localeCompare(a.date)
          : b.time.localeCompare(a.time),
      );
    return { upcoming, past };
  })();

  const toggleDone = async (id: string, done: boolean) => {
    await updateDoc(doc(db, "tasks", id), { done, notify: !done });
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    await deleteDoc(doc(db, "tasks", taskToDelete.id));
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const handleQuickCaptureSubmit = async (
    newTask: Omit<Task, "id" | "createdAt">,
  ) => {
    await addDoc(collection(db, "tasks"), {
      ...newTask,
      userId: user?.uid,
      done: false,
      createdAt: new Date(),
    });
  };

  // Stats
  const doneToday = allTasks.filter((t) => t.date === today && t.done).length;
  const totalToday = allTasks.filter((t) => t.date === today).length;
  const overdueCount = allTasks.filter((t) => t.date < today && !t.done).length;

  if (authLoading) return <CuplusLoader fullScreen label="Loading tasks…" />;

  const TaskList = ({ tasks }: { tasks: Task[] }) => (
    <div className="space-y-2.5">
      {tasks.map((t) => (
        <TaskCard
          key={t.id}
          task={t}
          expanded={expandedTaskId === t.id}
          onToggle={toggleDone}
          onExpand={setExpandedTaskId}
          onDelete={(task) => {
            setTaskToDelete(task);
            setShowDeleteModal(true);
          }}
        />
      ))}
    </div>
  );

  return (
    <Layout>
      {/* ══ MOBILE (< lg) ══ */}
      <div
        className="flex-1 overflow-y-auto lg:hidden mt-14 no-scrollbar-mobile"
        style={{ background: "var(--bg)" }}
      >
        {/* Sticky mobile header */}
        <div
          className="sticky top-0 z-10 px-4 pt-4 pb-3"
          style={{
            background: "var(--bg)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="material-icons"
                style={{ color: "#2e5bff", fontSize: 20 }}
              >
                check_circle
              </span>
              <h1
                className="text-xl font-black"
                style={{ color: "var(--text-main)" }}
              >
                Tasks
              </h1>
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--border)",
                  color: "var(--text-faint)",
                }}
              >
                {upcoming.length + past.length}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCalendar((v) => !v)}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                style={{
                  background: showCalendar
                    ? "rgba(46,91,255,0.12)"
                    : "var(--border)",
                  color: showCalendar ? "#2e5bff" : "var(--text-muted)",
                  border: showCalendar
                    ? "1px solid rgba(46,91,255,0.2)"
                    : "1px solid var(--border-strong)",
                }}
              >
                <span className="material-icons" style={{ fontSize: 17 }}>
                  calendar_month
                </span>
              </button>
              <button
                onClick={() => setShowQuickCapture((v) => !v)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-white transition-all"
                style={{
                  background: showQuickCapture
                    ? "var(--border)"
                    : "linear-gradient(135deg,#2e5bff,#1a3acc)",
                  color: showQuickCapture ? "var(--text-muted)" : "#fff",
                }}
              >
                <span className="material-icons" style={{ fontSize: 18 }}>
                  {showQuickCapture ? "close" : "add"}
                </span>
              </button>
            </div>
          </div>

          {/* Active date filter pill */}
          {selectedDate && (
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium"
                style={{
                  background: "rgba(46,91,255,0.1)",
                  color: "#2e5bff",
                  border: "1px solid rgba(46,91,255,0.2)",
                }}
              >
                <span className="material-icons" style={{ fontSize: 12 }}>
                  calendar_today
                </span>
                {selectedDate}
              </span>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-[11px] font-semibold"
                style={{ color: "#EF4444" }}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="px-4 pb-8 pt-4 sm:pb-4 space-y-4">
          {showQuickCapture && (
            <QuickCapture onSubmit={handleQuickCaptureSubmit} />
          )}
          {showCalendar && (
            <CalendarWidget
              onDateClick={(d) => setSelectedDate(d === today ? null : d)}
              selectedDate={selectedDate}
            />
          )}

          {upcoming.length > 0 && (
            <div>
              <SectionHeader
                icon="schedule"
                label="Upcoming"
                count={upcoming.length}
                iconColor="#2e5bff"
              />
              <TaskList tasks={upcoming} />
            </div>
          )}
          {past.length > 0 && (
            <div>
              <SectionHeader
                icon="history"
                label="Past"
                count={past.length}
                iconColor="var(--text-faint)"
              />
              <TaskList tasks={past} />
            </div>
          )}
          {upcoming.length === 0 && past.length === 0 && (
            <EmptyTasks filtered={!!selectedDate} />
          )}
        </div>
      </div>

      {/* ══ DESKTOP (lg+) ══ */}
      <div className="hidden lg:flex flex-1 w-full h-full overflow-hidden">
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Page header */}
          <div
            className="px-8 pt-8 pb-5 shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="material-icons"
                    style={{ color: "#2e5bff", fontSize: 22 }}
                  >
                    check_circle
                  </span>
                  <h1
                    className="text-2xl font-black"
                    style={{ color: "var(--text-main)" }}
                  >
                    Tasks
                  </h1>
                </div>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  {selectedDate
                    ? `Showing tasks for ${selectedDate}`
                    : `${upcoming.length} upcoming · ${past.length} past`}
                  {overdueCount > 0 && (
                    <span
                      className="ml-2 font-semibold"
                      style={{ color: "#EF4444" }}
                    >
                      · {overdueCount} overdue
                    </span>
                  )}
                </p>
              </div>

              {/* Today progress + clear filter */}
              <div className="flex items-center gap-3">
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      color: "#EF4444",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: 13 }}>
                      filter_alt_off
                    </span>
                    Clear filter
                  </button>
                )}
                {totalToday > 0 && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--text-faint)" }}
                    >
                      Today
                    </span>
                    <div
                      className="w-20 h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--border-strong)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(doneToday / totalToday) * 100}%`,
                          background:
                            doneToday === totalToday
                              ? "#10B981"
                              : "linear-gradient(90deg,#2e5bff,#7C3AED)",
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-bold"
                      style={{
                        color:
                          doneToday === totalToday
                            ? "#10B981"
                            : "var(--text-main)",
                      }}
                    >
                      {doneToday}/{totalToday}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tasks list */}
          <div className="flex-1 overflow-y-auto px-8 py-6 no-scrollbar-mobile">
            <div className="max-w-full space-y-8">
              {upcoming.length > 0 && (
                <div>
                  <SectionHeader
                    icon="schedule"
                    label="Upcoming"
                    count={upcoming.length}
                    iconColor="#2e5bff"
                  />
                  <TaskList tasks={upcoming} />
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <SectionHeader
                    icon="history"
                    label="Past"
                    count={past.length}
                    iconColor="var(--text-faint)"
                  />
                  <TaskList tasks={past} />
                </div>
              )}
              {upcoming.length === 0 && past.length === 0 && (
                <EmptyTasks filtered={!!selectedDate} />
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside
          className="w-80 shrink-0 flex flex-col overflow-hidden"
          style={{
            borderLeft: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          {/* Sidebar header */}
          {/* <div className="px-5 pt-6 pb-4 shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold" style={{ color: "var(--text-main)" }}>Calendar</h4>
              {selectedDate && (
                <button onClick={() => setSelectedDate(null)}
                  className="text-[10px] font-bold" style={{ color: "#2e5bff" }}>
                  Clear
                </button>
              )}
            </div>
            <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
              Click a date to filter tasks
            </p>
          </div> */}

          <div className="px-4 pt-4 shrink-0">
            <CalendarWidget
              onDateClick={(d) => setSelectedDate(d === today ? null : d)}
              selectedDate={selectedDate}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar">
            <QuickCapture onSubmit={handleQuickCaptureSubmit} />
          </div>
        </aside>
      </div>

      <DeleteConfirmation
        isOpen={showDeleteModal}
        itemName={taskToDelete?.task || "this task"}
        type="task"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setTaskToDelete(null);
        }}
      />
    </Layout>
  );
};

export default TasksPage;
