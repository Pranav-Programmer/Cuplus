'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import CuplusLoader from '@/components/CuplusLoader';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import ProjectCreator from '@/components/projects/ProjectCreator';
import ProjectGrid from '@/components/projects/ProjectGrid';
import ProjectsHero from '@/components/projects/ProjectsHero';
import { getProjects, removeProject, archiveProject } from '@/lib/projects';
import { Project } from '@/components/editor/types';
import Layout from "@/components/Layout";
import DeleteConfirmation from "@/components/DeleteConfirmation";

export default function ProjectsPage() {
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

  const [projects, setProjects]           = useState<Project[]>([]);
  const [loading, setLoading]             = useState(true);
  const [creatorOpen, setCreatorOpen]     = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setProjects(await getProjects(userId));
    } catch (e) {
      console.error('Failed to load projects:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setCreatorOpen(true);
  };

  // const handleRemove = async (id: string) => {
  //   await removeProject(id);
  //   setProjects((prev) => prev.filter((p) => p.id !== id));
  // };

  //Delete confirmation modal (optional enhancement)
    const openDeleteModal = (id: string) => {
      setPendingRemoveId(id);
      setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
      if (!pendingRemoveId) return;
      await removeProject(pendingRemoveId);
      setProjects((prev) => prev.filter((p) => p.id !== pendingRemoveId));
      setPendingRemoveId(null);
      setShowDeleteModal(false);
    };
    const cancelDelete = () => setShowDeleteModal(false);

  const handleArchive = async (id: string) => {
    await archiveProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCreatorClose = () => {
    setCreatorOpen(false);
    setEditingProject(null);
  };

  const handleSaved = () => {
    loadProjects();
    setCreatorOpen(false);
    setEditingProject(null);
  };

  if (authLoading) {
    return <CuplusLoader fullScreen />;
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <p className="text-[#94A3B8] text-sm">Please sign in to view your projects.</p>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen w-full bg-[#0B0E14] px-4 sm:px-8 pb-16 pt-6 sm:pb-8 overflow-y-auto no-scrollbar-mobile">

        {/* Hero banner with Create button */}
        <ProjectsHero onCreateNew={() => { setEditingProject(null); setCreatorOpen(true); }} />

        {/* Search */}
        <div className="mb-6">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#151922] border border-white/10 rounded-2xl pl-10 pr-4 py-3
                text-[#E2E8F0] text-sm outline-none focus:border-primary/50 placeholder-[#94A3B8]/60
                transition-colors"
            />
          </div>
        </div>

        {/* Grid */}
        <ProjectGrid
          projects={projects}
          loading={loading}
          searchQuery={searchQuery}
          onEdit={handleEdit}
          onRemove={openDeleteModal}
          onArchive={handleArchive}
        />
      </div>

      {/* Full-screen creator */}
      <ProjectCreator
        isOpen={creatorOpen}
        onClose={handleCreatorClose}
        onSaved={handleSaved}
        userId={userId}
        editProject={editingProject}
      />

       <DeleteConfirmation
        isOpen={showDeleteModal}
        itemName={projects.find((p) => p.id === pendingRemoveId)?.title || "this project"}
        type="project"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </Layout>
  );
}
