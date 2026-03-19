'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';          // your existing firebase.ts export
import ProjectCreator from '@/components/ProjectCreator';
import ProjectGrid from '@/components/ProjectGrid';
import { getProjects, deleteProject, archiveProject } from '@/lib/projects';
import { Project } from '@/components/editor/types';
import Layout from "@/components/Layout";
import ProjectsHero from '@/components/ProjectsHero';

export default function ProjectsPage() {
  // ── Get the real Firebase Auth user ─────────────────────────────────────────
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading]   = useState(true);

  useEffect(() => {
    // onAuthStateChanged fires immediately with the current user (or null)
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Use the real UID — never a hardcoded string
  const userId = firebaseUser?.uid ?? '';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Load projects ────────────────────────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getProjects(userId);
      setProjects(data);
    } catch (e) {
      console.error('Failed to load projects:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setCreatorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleArchive = async (id: string) => {
    await archiveProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCreatorClose = () => {
    setCreatorOpen(false);
    setEditingProject(null);
  };

  const handleSaved = (projectId: string) => {
    loadProjects();          // Refresh list
    setCreatorOpen(false);
    setEditingProject(null);
  };

  // ── Auth loading guard ───────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-[#94A3B8]">
        <Loader2 className="animate-spin mr-2" size={22} />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  // Not signed in — should be handled by your auth middleware, but guard anyway
  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <p className="text-[#94A3B8] text-sm">Please sign in to view your projects.</p>
      </div>
    );
  }

  return (
    <Layout>
      {/* ── Projects page ── */}
      <div className="min-h-screen bg-[#0B0E14] px-4 sm:px-8 py-8 overflow-y-auto">

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-full">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search projects…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#151922] border border-white/10 rounded-2xl pl-10 pr-4 py-3
                text-[#E2E8F0] text-sm outline-none focus:border-[#2e5bff]/50 placeholder-[#94A3B8]/60
                transition-colors"
            />
          </div>
        </div>

        <ProjectsHero onCreateNew={() => { setEditingProject(null); setCreatorOpen(true); }} />

        {/* Grid */}
        <ProjectGrid
          projects={projects}
          loading={loading}
          searchQuery={searchQuery}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onArchive={handleArchive}
        />
      </div>

      {/* ── Full-screen creator ── */}
      <ProjectCreator
        isOpen={creatorOpen}
        onClose={handleCreatorClose}
        onSaved={handleSaved}
        userId={userId}
        editProject={editingProject}
      />
    </Layout>
  );
}
