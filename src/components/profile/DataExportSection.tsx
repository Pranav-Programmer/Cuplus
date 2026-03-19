'use client';
import React, { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

type Format = 'json' | 'csv';
type DataKey = 'notes' | 'tasks' | 'projects' | 'sanctumPersonal' | 'sanctumOfficial';

const EXPORTS: { key: DataKey; label: string; icon: string; color: string; firestoreCol: string; spaceFilter?: string }[] = [
  { key: 'notes',          label: 'Notes',             icon: 'sticky_note_2', color: '#10B981', firestoreCol: 'notes'           },
  { key: 'tasks',          label: 'Tasks',             icon: 'check_circle',  color: '#F59E0B', firestoreCol: 'tasks'           },
  { key: 'projects',       label: 'Projects',          icon: 'folder_open',   color: '#2e5bff', firestoreCol: 'projects'        },
  { key: 'sanctumPersonal',label: 'Sanctum Personal',  icon: 'shield',        color: '#A78BFA', firestoreCol: 'sanctumProjects', spaceFilter: 'personal' },
  { key: 'sanctumOfficial',label: 'Sanctum Official',  icon: 'shield',        color: '#FBBF24', firestoreCol: 'sanctumProjects', spaceFilter: 'official' },
];

function toCSV(rows: any[]): string {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [keys.join(','), ...rows.map(r => keys.map(k => escape(r[k])).join(','))].join('\n');
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function DataExportSection() {
  const [format,      setFormat]      = useState<Format>('json');
  const [downloading, setDownloading] = useState<DataKey | null>(null);
  const [error,       setError]       = useState('');

  const handleDownload = async (exp: typeof EXPORTS[number]) => {
    const user = auth.currentUser;
    if (!user) return;
    setDownloading(exp.key); setError('');
    try {
      let q = query(collection(db, exp.firestoreCol), where('userId','==',user.uid));
      if (exp.spaceFilter) q = query(collection(db, exp.firestoreCol), where('userId','==',user.uid), where('space','==',exp.spaceFilter));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (format === 'json') {
        downloadFile(JSON.stringify(data, null, 2), `cuplus_${exp.key}.json`, 'application/json');
      } else {
        downloadFile(toCSV(data), `cuplus_${exp.key}.csv`, 'text/csv');
      }
    } catch (e: any) { setError(e.message); }
    finally { setDownloading(null); }
  };

  return (
    <section id="data-export" className="scroll-mt-6">
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-main)' }}>Data & Export</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-faint)' }}>
        Download your data at any time. Each collection exports as a separate file.
      </p>
      <div className="h-px mb-5" style={{ background: 'var(--border)' }} />

      {/* Format picker */}
      <div className="flex items-center gap-2 mb-6">
        <p className="text-sm font-medium shrink-0" style={{ color: 'var(--text-muted)' }}>Format:</p>
        <div className="flex gap-2">
          {(['json','csv'] as Format[]).map(f => (
            <button key={f} onClick={() => setFormat(f)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              style={format === f
                ? { background: 'rgba(46,91,255,0.14)', color: '#2e5bff', border: '1px solid rgba(46,91,255,0.25)' }
                : { background: 'var(--border)', color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }
              }>.{f}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {EXPORTS.map(exp => (
          <div key={exp.key} className="flex items-center gap-4 p-4 rounded-2xl"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${exp.color}15`, border: `1px solid ${exp.color}25` }}>
              <span className="material-icons" style={{ fontSize: 18, color: exp.color }}>{exp.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{exp.label}</p>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                cuplus_{exp.key}.{format}
              </p>
            </div>
            <button onClick={() => handleDownload(exp)} disabled={downloading === exp.key}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg,${exp.color},${exp.color}bb)`, boxShadow: `0 0 12px -4px ${exp.color}60` }}>
              {downloading === exp.key
                ? <><span className="material-icons" style={{ fontSize: 13, animation: 'spin 1s linear infinite' }}>sync</span> Exporting…</>
                : <><span className="material-icons" style={{ fontSize: 13 }}>download</span> Export</>}
            </button>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400 mt-4">{error}</p>}

      <div className="rounded-xl p-3 mt-5 flex items-start gap-2"
        style={{ background: 'var(--border)', border: '1px solid var(--border-strong)' }}>
        <span className="material-icons shrink-0 mt-0.5" style={{ fontSize: 14, color: 'var(--text-faint)' }}>info</span>
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
          Sanctum data is exported as encrypted ciphertext. You cannot read it without your Sanctum password.
        </p>
      </div>
    </section>
  );
}
