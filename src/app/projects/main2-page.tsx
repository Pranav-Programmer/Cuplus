'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import ProjectCreator from '@/components/ProjectCreator';
import ProjectGrid from '@/components/ProjectGrid';
import { getProjects, deleteProject, archiveProject } from '@/lib/projects';
import { Project } from '@/components/editor/types';
import Layout from "@/components/Layout";

// Replace with your actual auth hook / user context
// import { useAuth } from '@/hooks/useAuth';

// ─── Mock user for demo – replace with your auth ──────────────────────────────
const MOCK_USER_ID = 'demo-user-001';

export default function ProjectsPage() {
  // const { user } = useAuth();
  // const userId = user?.uid ?? '';
  const userId = MOCK_USER_ID;

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

  return (
    <Layout>
      {/* ── Projects page ── */}
      {/* <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 max-w-6xl mx-auto w-full"> */}
      <div className="w-full flex flex-col min-h-screen bg-[#0B0E14] px-4 sm:px-8 py-8">

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
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

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#E2E8F0] mb-1">
            Manage your projects
          </h1>
          <p className="text-[#94A3B8] text-sm">
            Organize and track your project workflows with customizable templates
          </p>
        </div>

        {/* Create button */}
        <button
          onClick={() => { setEditingProject(null); setCreatorOpen(true); }}
          className="w-full flex items-center justify-center gap-2 py-4 mb-8 rounded-2xl
            bg-[#2e5bff] hover:bg-[#1a40cc] text-white font-semibold text-base
            transition-all duration-200 shadow-[0_0_20px_-5px_rgba(46,91,255,0.5)]
            hover:shadow-[0_0_30px_-5px_rgba(46,91,255,0.7)] active:scale-[0.99]"
        >
          <Plus size={20} />
          Create New Project
        </button>

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
