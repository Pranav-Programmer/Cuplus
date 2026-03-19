'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Archive } from 'lucide-react';
import CuplusLoader from '@/components/CuplusLoader';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import ProjectGrid from '@/components/ProjectGrid';
import { getArchivedProjects, unarchiveProject, removeProject } from '@/lib/projects';
import { Project } from '@/components/editor/types';
import Layout from "@/components/Layout";

export default function ArchivePage() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading]   = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const userId = firebaseUser?.uid ?? '';

  const [projects, setProjects]       = useState<Project[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProjects = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setProjects(await getArchivedProjects(userId));
    } catch (e) {
      console.error('Failed to load archived projects:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleUnarchive = async (id: string) => {
    await unarchiveProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRemove = async (id: string) => {
    await removeProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  if (authLoading) {
    return <CuplusLoader fullScreen />;
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <p className="text-[#94A3B8] text-sm">Please sign in to view your archive.</p>
      </div>
    );
  }

  return (
  <Layout>
    <div className="min-h-screen w-full bg-[#0B0E14] px-4 sm:px-8 py-8">

      {/* ── Page header ── */}
      <div className="flex items-center gap-3 mb-2 mt-10 md:mt-0">
        <div className="w-9 h-9 rounded-xl bg-[#2e5bff]/15 border border-[#2e5bff]/20
          flex items-center justify-center">
          <Archive size={16} className="text-[#60A5FA]" />
        </div>
        <h1 className="text-3xl font-bold text-[#E2E8F0]">Archive</h1>
      </div>
      <p className="text-[#94A3B8] text-sm mb-8 ml-12">
        Archived projects are hidden from your main view. Restore them any time.
      </p>

      {/* ── Search ── */}
      <div className="mb-6">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
          <input
            type="text"
            placeholder="Search archived projects…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151922] border border-white/10 rounded-2xl pl-10 pr-4 py-3
              text-[#E2E8F0] text-sm outline-none focus:border-[#2e5bff]/50
              placeholder-[#94A3B8]/60 transition-colors"
          />
        </div>
      </div>

      {/* ── Grid — no onEdit, no onArchive; show onUnarchive + onRemove ── */}
      <ProjectGrid
        projects={projects}
        loading={loading}
        searchQuery={searchQuery}
        onUnarchive={handleUnarchive}
        onRemove={handleRemove}
      />
    </div>
  </Layout>
  );
}
