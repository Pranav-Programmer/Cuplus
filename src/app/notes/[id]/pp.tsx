"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import NoteCreator from "@/components/NoteCreator";
import NoteGrid from "@/components/NoteGrid";
import CategorySelector from "@/components/CategorySelector";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import CuplusLoader from "@/components/CuplusLoader";

interface Note {
  id: string;
  title: string;
  category: string;
  color: string;
  content: string;
  createdAt: any;
  remove: boolean;
}

const NotesPage: React.FC = () => {
  const [user, setUser]                                 = useState<any>(null);
  const [allNotes, setAllNotes]                         = useState<Note[]>([]);
  const [selectedCategory, setSelectedCategory]         = useState<string | null>(null);
  const [searchQuery, setSearchQuery]                   = useState("");
  const [showCreator, setShowCreator]                   = useState(false);
  const [showCategoriesMobile, setShowCategoriesMobile] = useState(false);
  const [categories, setCategories]                     = useState<string[]>([]);
  const [loading, setLoading]                           = useState(true);
  const [authChecking, setAuthChecking]                 = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthChecking(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notes"), where("userId", "==", user.uid));
    return onSnapshot(q, snap => {
      const fetched: Note[] = [];
      const cats = new Set<string>();
      snap.forEach(d => {
        const data = d.data() as Note;
        fetched.push({ id: d.id, ...data });
        if (data.category) cats.add(data.category);
      });
      setAllNotes(fetched);
      setCategories(Array.from(cats).sort());
      setLoading(false);
    });
  }, [user]);

  const filteredNotes = (() => {
    let list = allNotes.filter(n => !n.remove);
    if (selectedCategory) list = list.filter(n => n.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
  })();

  const handleAddNote = async (newNote: Omit<Note, "id" | "createdAt">) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "notes"), { ...newNote, userId: user.uid, createdAt: new Date() });
      setShowCreator(false);
    } catch (err) { console.error(err); }
  };

  if (authChecking) return <CuplusLoader fullScreen label="Loading notes…" />;

  // ── Shared search bar ─────────────────────────────────────────────────────
  const SearchBar = () => (
    <div className="relative">
      <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ fontSize: 16, color: 'var(--text-faint)' }}>search</span>
      <input
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search notes…"
        className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{
          background: 'var(--bg)',
          border:     '1px solid var(--border-strong)',
          color:      'var(--text-main)',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'rgba(46,91,255,0.5)';
          e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(46,91,255,0.08)';
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'var(--border-strong)';
          e.currentTarget.style.boxShadow   = 'none';
        }}
      />
      {searchQuery && (
        <button onClick={() => setSearchQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: 'var(--text-faint)' }}>
          <span className="material-icons" style={{ fontSize: 15 }}>close</span>
        </button>
      )}
    </div>
  );

  // ── Page header banner ────────────────────────────────────────────────────
  const PageHeader = () => (
    <div className="flex items-center justify-between mb-6 px-6 lg:px-12 pt-8">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="material-icons" style={{ color: '#2e5bff', fontSize: 22 }}>sticky_note_2</span>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-main)' }}>Notes</h1>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
          {allNotes.length} note{allNotes.length !== 1 ? 's' : ''}
          {selectedCategory && <span> · {selectedCategory}</span>}
          {searchQuery      && <span> · "{searchQuery}"</span>}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {(searchQuery || selectedCategory) && (
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span className="material-icons" style={{ fontSize: 13 }}>filter_alt_off</span>
            Clear
          </button>
        )}
        <button
          onClick={() => setShowCreator(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
          style={showCreator
            ? { background: 'var(--border)', color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }
            : { background: 'linear-gradient(135deg,#2e5bff,#1a3acc)', boxShadow: '0 0 18px -4px rgba(46,91,255,0.5)', border: 'none' }
          }
          onMouseEnter={e => { if (!showCreator) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.12)'; }}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'}
        >
          <span className="material-icons" style={{ fontSize: 16 }}>
            {showCreator ? 'close' : 'add'}
          </span>
          {showCreator ? 'Close' : 'New Note'}
        </button>
      </div>
    </div>
  );

  return (
    <Layout>

      {/* ══ DESKTOP (md+) ══ */}
      <div className="hidden md:flex flex-1 w-full max-w-[1400px] mx-auto h-full overflow-hidden">

        {/* Left: header + creator + grid */}
        <div className="w-3/4 flex flex-col overflow-hidden"
          style={{ borderRight: '1px solid var(--border)' }}>

          <PageHeader />

          {showCreator ? (
            /* Full-screen creator — hides everything else */
            <div className="flex-1 overflow-y-auto px-6 lg:px-12 pb-12">
              <NoteCreator onSubmit={handleAddNote} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 lg:px-12 pb-12 no-scrollbar-mobile">
              <NoteGrid notes={filteredNotes} loading={loading} />
            </div>
          )}
        </div>

        {/* Right sidebar — hidden when creator is open */}
        {!showCreator && (
          <div className="w-1/4 flex flex-col overflow-hidden"
            style={{ background: 'var(--surface)' }}>

            {/* Search + stats */}
            <div className="p-5 space-y-3 shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}>

              <SearchBar />

              {/* Stat chips row */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: 'All',   count: allNotes.length,      active: !selectedCategory },
                  ...categories.map(c => ({
                    label: c,
                    count: allNotes.filter(n => n.category === c).length,
                    active: selectedCategory === c,
                  })),
                ].slice(0, 4).map(chip => (
                  <button key={chip.label}
                    onClick={() => setSelectedCategory(chip.active ? null : (chip.label === 'All' ? null : chip.label))}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                    style={chip.active
                      ? { background: 'rgba(46,91,255,0.14)', color: '#2e5bff', border: '1px solid rgba(46,91,255,0.25)' }
                      : { background: 'var(--border)', color: 'var(--text-faint)', border: '1px solid var(--border-strong)' }
                    }>
                    {chip.label}
                    <span className="ml-0.5 text-[9px] font-bold">{chip.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Full category list */}
            <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--text-faint)' }}>
                All Categories
              </p>
              <CategorySelector
                categories={categories}
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </div>
          </div>
        )}
      </div>

      {/* ══ MOBILE (< md) ══ */}
      <div className="flex-1 overflow-y-auto md:hidden mt-14 no-scrollbar-mobile"
        style={{ background: 'var(--bg)' }}>

        {/* Sticky top bar */}
        <div className="sticky top-0 z-20 px-4 pt-4 pb-3"
          style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>

          {!showCreator ? (
            <div className="space-y-2.5">
              {/* Title row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-icons" style={{ color: '#2e5bff', fontSize: 18 }}>sticky_note_2</span>
                  <span className="font-bold text-base" style={{ color: 'var(--text-main)' }}>Notes</span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--border)', color: 'var(--text-faint)' }}>
                    {filteredNotes.length}
                  </span>
                </div>
                <button onClick={() => setShowCreator(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#2e5bff,#1a3acc)', boxShadow: '0 0 12px -4px rgba(46,91,255,0.5)' }}>
                  <span className="material-icons" style={{ fontSize: 14 }}>add</span>
                  New
                </button>
              </div>
              {/* Search */}
              <SearchBar />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => setShowCreator(false)}
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl transition-colors"
                style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                <span className="material-icons" style={{ fontSize: 18 }}>arrow_back</span>
              </button>
              <span className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>New Note</span>
            </div>
          )}
        </div>

        <div className="px-4 py-4 space-y-4">
          {showCreator ? (
            <NoteCreator onSubmit={handleAddNote} />
          ) : (
            <>
              {/* Collapsible categories */}
              <div className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <button
                  onClick={() => setShowCategoriesMobile(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 transition-colors"
                  style={{ color: 'var(--text-main)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
                  <div className="flex items-center gap-2">
                    <span className="material-icons" style={{ fontSize: 16, color: '#2e5bff' }}>label</span>
                    <span className="text-sm font-semibold">Categories</span>
                    {/* Active filter badge */}
                    {selectedCategory ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(46,91,255,0.12)', color: '#2e5bff' }}>
                        {selectedCategory}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--border)', color: 'var(--text-faint)' }}>
                        {categories.length}
                      </span>
                    )}
                  </div>
                  <span className="material-icons" style={{ fontSize: 18, color: 'var(--text-faint)' }}>
                    {showCategoriesMobile ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {showCategoriesMobile && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="p-3 max-h-[50vh] overflow-y-auto no-scrollbar">
                      <CategorySelector
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onSelect={cat => { setSelectedCategory(cat); setShowCategoriesMobile(false); }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Active filters row */}
              {(searchQuery || selectedCategory) && (
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-faint)' }}>
                    <span className="material-icons" style={{ fontSize: 13 }}>filter_alt</span>
                    {filteredNotes.length} result{filteredNotes.length !== 1 ? 's' : ''}
                  </div>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                    className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: '#EF4444' }}>
                    <span className="material-icons" style={{ fontSize: 12 }}>filter_alt_off</span>
                    Clear
                  </button>
                </div>
              )}

              <NoteGrid notes={filteredNotes} loading={loading} />
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NotesPage;