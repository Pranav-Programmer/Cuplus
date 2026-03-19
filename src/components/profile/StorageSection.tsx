'use client';
import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, writeBatch, doc } from 'firebase/firestore';

interface Counts { notes: number; tasks: number; projects: number; sanctumPersonal: number; sanctumOfficial: number; }

function StatBar({ label, count, color, icon }: { label: string; count: number; color: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-xl"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        <span className="material-icons" style={{ fontSize: 18, color }}>{icon}</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{label}</p>
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{count} item{count !== 1 ? 's' : ''}</p>
      </div>
      <span className="text-lg font-black" style={{ color }}>{count}</span>
    </div>
  );
}

type CollectionKey = 'notes' | 'tasks' | 'projects' | 'sanctumPersonal' | 'sanctumOfficial';

const LABELS: Record<CollectionKey, { label: string; color: string; icon: string }> = {
  notes:          { label: 'Notes',                    color: '#10B981', icon: 'sticky_note_2' },
  tasks:          { label: 'Tasks',                    color: '#F59E0B', icon: 'check_circle'  },
  projects:       { label: 'Projects',                 color: '#2e5bff', icon: 'folder_open'   },
  sanctumPersonal:{ label: 'Sanctum — Personal',       color: '#A78BFA', icon: 'shield'        },
  sanctumOfficial:{ label: 'Sanctum — Official',       color: '#FBBF24', icon: 'shield'        },
};

export default function StorageSection() {
  const [counts,  setCounts]  = useState<Counts>({ notes: 0, tasks: 0, projects: 0, sanctumPersonal: 0, sanctumOfficial: 0 });
  const [loading, setLoading] = useState(true);
  const [deleting,setDeleting]= useState<CollectionKey | null>(null);
  const [confirm, setConfirm] = useState<CollectionKey | null>(null);
  const [error,   setError]   = useState('');

  const fetchCounts = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const uid = user.uid;
      const [notesSnap, tasksSnap, projectsSnap, spSnap, soSnap] = await Promise.all([
        getDocs(query(collection(db, 'notes'),          where('userId','==',uid))),
        getDocs(query(collection(db, 'tasks'),          where('userId','==',uid))),
        getDocs(query(collection(db, 'projects'),       where('userId','==',uid))),
        getDocs(query(collection(db, 'sanctumProjects'),where('userId','==',uid), where('space','==','personal'))),
        getDocs(query(collection(db, 'sanctumProjects'),where('userId','==',uid), where('space','==','official'))),
      ]);
      setCounts({
        notes: notesSnap.size, tasks: tasksSnap.size, projects: projectsSnap.size,
        sanctumPersonal: spSnap.size, sanctumOfficial: soSnap.size,
      });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCounts(); }, []);

  const deleteCollection = async (key: CollectionKey) => {
    const user = auth.currentUser;
    if (!user) return;
    setDeleting(key); setError('');
    try {
      let q;
      if (key === 'sanctumPersonal') q = query(collection(db,'sanctumProjects'), where('userId','==',user.uid), where('space','==','personal'));
      else if (key === 'sanctumOfficial') q = query(collection(db,'sanctumProjects'), where('userId','==',user.uid), where('space','==','official'));
      else q = query(collection(db, key), where('userId','==',user.uid));

      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      await fetchCounts();
    } catch (e: any) { setError(e.message); }
    finally { setDeleting(null); setConfirm(null); }
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <section id="storage" className="scroll-mt-6">
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-main)' }}>Storage</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-faint)' }}>
        Overview of your stored data across all Cuplus collections.
      </p>
      <div className="h-px mb-5" style={{ background: 'var(--border)' }} />

      {/* Summary */}
      <div className="rounded-2xl p-5 mb-6"
        style={{ background: 'linear-gradient(135deg,var(--surface-2),var(--surface))', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>Total Items Stored</p>
          <span className="text-2xl font-black" style={{ color: '#2e5bff' }}>{total}</span>
        </div>
        {/* Mini bar chart */}
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          {(Object.keys(LABELS) as CollectionKey[]).map(k => (
            <div key={k} className="h-full rounded-full transition-all duration-500"
              style={{ flex: counts[k] || 0.05, background: LABELS[k].color, opacity: counts[k] > 0 ? 1 : 0.15 }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {(Object.keys(LABELS) as CollectionKey[]).map(k => (
            <div key={k} className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-faint)' }}>
              <div className="w-2 h-2 rounded-full" style={{ background: LABELS[k].color }} />
              {LABELS[k].label}
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10" style={{ color: 'var(--text-faint)' }}>
          <span className="material-icons" style={{ fontSize: 20, animation: 'spin 1s linear infinite' }}>sync</span>
        </div>
      ) : (
        <div className="space-y-3">
          {(Object.keys(LABELS) as CollectionKey[]).map(k => (
            <div key={k} className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border)' }}>
              <StatBar label={LABELS[k].label} count={counts[k]} color={LABELS[k].color} icon={LABELS[k].icon} />

              {/* Delete row */}
              {confirm === k ? (
                <div className="px-4 py-3 flex items-center justify-between gap-3"
                  style={{ borderTop: '1px solid var(--border)', background: 'rgba(239,68,68,0.04)' }}>
                  <p className="text-xs text-red-400 font-medium">
                    Permanently delete all {counts[k]} {LABELS[k].label}? This cannot be undone.
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setConfirm(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                      Cancel
                    </button>
                    <button onClick={() => deleteCollection(k)} disabled={deleting === k}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                      style={{ background: '#EF4444' }}>
                      {deleting === k ? 'Deleting…' : 'Yes, Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-2.5 flex justify-end"
                  style={{ borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => { if (counts[k] > 0) setConfirm(k); }}
                    disabled={counts[k] === 0}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-400 transition-all disabled:opacity-30"
                    style={{ opacity: counts[k] === 0 ? 0.3 : 1 }}>
                    <span className="material-icons" style={{ fontSize: 13 }}>delete_forever</span>
                    Delete All {LABELS[k].label}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
    </section>
  );
}
