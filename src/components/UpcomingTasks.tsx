"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

interface Task {
  id: string;
  task: string;
  date: string;
  time: string;
  notify: boolean;
  done: boolean;
  tags: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDateTime(
  date: string,
  time: string,
): { label: string; urgent: boolean } {
  const now = new Date();
  const target = new Date(`${date}T${time}`);
  const diffMs = target.getTime() - now.getTime();
  const diffH = diffMs / (1000 * 60 * 60);

  const todayStr = now.toISOString().split("T")[0];
  const tomorrowStr = new Date(now.getTime() + 86400000)
    .toISOString()
    .split("T")[0];

  const timeStr = new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  let label: string;
  if (date === todayStr) label = `Today · ${timeStr}`;
  else if (date === tomorrowStr) label = `Tomorrow · ${timeStr}`;
  else
    label = `${new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${timeStr}`;

  return { label, urgent: diffH <= 2 && diffH >= 0 };
}

// Priority color from tags
const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#EF4444",
  high: "#F97316",
  medium: "#F59E0B",
  low: "#10B981",
  work: "#2e5bff",
  personal: "#8B5CF6",
};
function tagColor(tag: string): string {
  return PRIORITY_COLORS[tag.toLowerCase()] ?? "#2e5bff";
}

// ── Component ─────────────────────────────────────────────────────────────────
const UpcomingTasks: React.FC = () => {
  const [user] = useAuthState(auth);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const q = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid),
      where("date", ">=", today),
    );
    return onSnapshot(
      q,
      (snap) => {
        const list: Task[] = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Task,
        );
        list.sort((a, b) =>
          a.date !== b.date
            ? a.date.localeCompare(b.date)
            : a.time.localeCompare(b.time),
        );
        setTasks(list.slice(0, 3));
      },
      (err) => {
        if (err.code !== "permission-denied") console.error(err);
      },
    );
  }, [user]);

  const handleToggle = async (id: string, done: boolean) => {
    setToggling(id);
    try {
      await updateDoc(doc(db, "tasks", id), { done, notify: !done });
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(null);
    }
  };

  return (
    <section className="mb-10">
      {/* ── Section header ── */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-lg font-bold flex items-center gap-2"
          style={{ color: "var(--text-main)" }}
        >
          <span
            className="material-icons text-base"
            style={{ color: "#2e5bff" }}
          >
            event_available
          </span>
          Upcoming
        </h2>
        <Link
          href="/tasks"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{
            color: "#2e5bff",
            background: "rgba(46,91,255,0.1)",
            border: "1px solid rgba(46,91,255,0.2)",
          }}
        >
          View all →
        </Link>
      </div>

      {/* ── Task list ── */}
      {tasks.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-10 rounded-2xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <span
            className="material-icons text-4xl mb-2"
            style={{ color: "var(--text-faint)" }}
          >
            event_available
          </span>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            You're all clear!
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
            No upcoming tasks
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task, idx) => {
            const { label: dtLabel, urgent } = formatDateTime(
              task.date,
              task.time,
            );
            const isLoading = toggling === task.id;

            return (
              <div
                key={task.id}
                className="group relative rounded-2xl overflow-hidden transition-all duration-200"
                style={{
                  background: "var(--surface)",
                  border: `1px solid ${task.done ? "var(--border)" : urgent ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
                  opacity: task.done ? 0.65 : 1,
                  boxShadow:
                    urgent && !task.done
                      ? "0 0 16px -6px rgba(239,68,68,0.3)"
                      : "none",
                }}
              >
                {/* Left accent stripe */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                  style={{
                    background: task.done
                      ? "var(--border)"
                      : urgent
                        ? "#EF4444"
                        : `linear-gradient(180deg, #2e5bff, #7C3AED)`,
                  }}
                />

                <div className="flex items-center gap-3 px-4 py-3.5 pl-5">
                  {/* Custom checkbox */}
                  <button
                    onClick={() => handleToggle(task.id, !task.done)}
                    disabled={isLoading}
                    className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                    style={{
                      background: task.done ? "#2e5bff" : "transparent",
                      borderColor: task.done
                        ? "#2e5bff"
                        : "var(--border-strong)",
                      boxShadow: task.done
                        ? "0 0 10px rgba(46,91,255,0.4)"
                        : "none",
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
                    {isLoading && (
                      <span
                        className="material-icons animate-spin"
                        style={{ fontSize: 11, color: "#2e5bff" }}
                      >
                        sync
                      </span>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate transition-colors"
                      style={{
                        color: task.done
                          ? "var(--text-faint)"
                          : "var(--text-main)",
                        textDecoration: task.done ? "line-through" : "none",
                      }}
                    >
                      {task.task}
                    </p>

                    {/* Date + time */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="material-icons"
                        style={{
                          fontSize: 11,
                          color:
                            urgent && !task.done
                              ? "#EF4444"
                              : "var(--text-faint)",
                        }}
                      >
                        {urgent && !task.done ? "alarm" : "schedule"}
                      </span>
                      <span
                        className="text-[11px]"
                        style={{
                          color:
                            urgent && !task.done
                              ? "#EF4444"
                              : "var(--text-faint)",
                        }}
                      >
                        {dtLabel}
                      </span>
                      {urgent && !task.done && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "rgba(239,68,68,0.12)",
                            color: "#EF4444",
                            border: "1px solid rgba(239,68,68,0.2)",
                          }}
                        >
                          Soon
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {task.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {task.tags.map((tag, i) => {
                          const c = tagColor(tag);
                          return (
                            <span
                              key={i}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
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

                  {/* Done badge OR index number */}
                  {task.done ? (
                    <span
                      className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(16,185,129,0.12)",
                        color: "#10B981",
                        border: "1px solid rgba(16,185,129,0.2)",
                      }}
                    >
                      Done
                    </span>
                  ) : (
                    <span
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: "var(--border)",
                        color: "var(--text-faint)",
                      }}
                    >
                      {idx + 1}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default UpcomingTasks;
