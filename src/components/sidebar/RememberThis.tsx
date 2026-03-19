"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import AddMemoryModal from "./AddMemoryModal";
import ViewMemoryModal, { Memory } from "./ViewMemoryModal";

export default function RememberThis({ userId }: { userId: string }) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [viewing, setViewing] = useState<Memory | null>(null);

  useEffect(() => {
    if (!userId) {
      setMemories([]);
      return;
    }
    const q = query(
      collection(db, "memories"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(
      q,
      (snap) =>
        setMemories(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Memory),
        ),
      (err) => {
        if (err.code !== "permission-denied") console.error(err);
      },
    );
  }, [userId]);

  const handleSave = async (text: string) => {
    await addDoc(collection(db, "memories"), {
      userId,
      text,
      createdAt: new Date(),
    });
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "memories", id));
  };

  return (
    <div className="px-4 ">
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <h3
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: "var(--text-faint)" }}
        >
          Remember This
        </h3>
        <button
          onClick={() => setShowAdd(true)}
          className="w-5 h-5 flex items-center justify-center rounded-md transition-colors"
          style={{ color: "var(--text-faint)", background: "var(--border)" }}
          title="Add memory"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(46,91,255,0.15)";
            (e.currentTarget as HTMLButtonElement).style.color = "#2e5bff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--border)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-faint)";
          }}
        >
          <span className="material-icons" style={{ fontSize: 13 }}>
            add
          </span>
        </button>
      </div>

      {/* Memories list */}
      {memories.length === 0 ? (
        <p className="text-[11px] py-2" style={{ color: "var(--text-faint)" }}>
          Nothing saved yet. Hit + to add.
        </p>
      ) : (
        <div className="space-y-1 max-h-[160px] overflow-y-auto no-scrollbar pr-0.5">
          {memories.map((m) => (
            <button
              key={m.id}
              onClick={() => setViewing(m)}
              className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--border)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: [
                    "#2e5bff",
                    "#10b981",
                    "#8b5cf6",
                    "#f59e0b",
                    "#ef4444",
                    "#06b6d4",
                    "#84cc16",
                    "#ec4899",
                    "#f97316",
                    "#14b8a6",
                    "#a855f7",
                    "#FFD700",
                  ][Math.floor(Math.random() * 12)],
                }}
              />
              <p
                className="flex-1 text-xs truncate"
                style={{ color: "var(--text-muted)" }}
              >
                {m.text}
              </p>
              <span
                className="material-icons shrink-0 opacity-0 group-hover:opacity-100"
                style={{ fontSize: 12, color: "var(--text-faint)" }}
              >
                chevron_right
              </span>
            </button>
          ))}
          {/* {memories.length > 5 && (
            <p className="text-[10px] pl-2 mt-1" style={{ color: 'var(--text-faint)' }}>
              +{memories.length - 5} more…
            </p>
          )} */}
        </div>
      )}

      <AddMemoryModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleSave}
      />
      <ViewMemoryModal
        isOpen={!!viewing}
        memory={viewing}
        onClose={() => setViewing(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
