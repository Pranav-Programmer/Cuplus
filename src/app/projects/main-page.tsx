// src/app/projects/page.tsx (updated to single column layout)
"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ProjectCreator from "@/components/ProjectCreator";
import CategoryRow from "@/components/CategoryRow";
import ProjectGrid from "@/components/ProjectGrid";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import ProjectsHero from '@/components/ProjectsHero';

interface Project {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  content: string;
  createdAt: any;
}

const ProjectsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // null = all
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [showCreator, setShowCreator] = useState(false); // Collapsible creator

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  // Fetch all projects for user
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "projects"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProjects: Project[] = [];
      const cats = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data() as Project;
        fetchedProjects.push({ id: doc.id, ...data });
        if (data.category) cats.add(data.category);
      });
      setAllProjects(fetchedProjects);
      setCategories(Array.from(cats).sort());
    });

    return unsubscribe;
  }, [user]);

  // Filter projects by category + search
  const getFilteredProjects = () => {
    let filtered = allProjects;

    if (selectedCategory) {
      filtered = filtered.filter((project) => project.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(q) ||
          project.content.toLowerCase().includes(q)
      );
    }

    // Sort by createdAt desc (newest first)
    return filtered.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
  };

  const filteredProjects = getFilteredProjects();

  // Add new project
  const handleAddProject = async (newProject: Omit<Project, "id" | "createdAt">) => {
    if (!user) return;

    try {
      await addDoc(collection(db, "projects"), {
        ...newProject,
        userId: user.uid,
        createdAt: new Date(),
      });
      setShowCreator(false); // Close creator
    } catch (err) {
      console.error("Error adding project:", err);
    }
  };

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 max-w-6xl mx-auto w-full">
        {/* Search Bar */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects..."
          className="w-full p-3 bg-surface-dark-lighter border border-gray-800 rounded-xl text-white placeholder-gray-400 mb-6 focus:ring-2 focus:ring-primary focus:border-transparent"
        />

        {/* Heading */}
        <h1 className="text-3xl font-bold text-white mb-2">Manage your projects</h1>

        {/* Tag Line */}
        <p className="text-gray-400 mb-6 text-sm">Organize and track your project workflows with customizable templates</p>

        {/* Create New Project Button */}
        <button
          onClick={() => setShowCreator(!showCreator)}
          className="w-full flex justify-center items-center gap-2 p-4 bg-primary hover:bg-primary-dark text-white rounded-xl mb-6 transition-colors font-medium"
        >
          <span className="material-icons">add</span>
          Create New Project
        </button>

        {/* Collapsible Creator */}
        {showCreator && (
          <div className="mb-6">
            <ProjectCreator onSubmit={handleAddProject} />
          </div>
        )}

        {/* Category Row */}
        <CategoryRow
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* ProjectGrid (sorted by category) */}
        <ProjectGrid projects={filteredProjects} selectedCategory={selectedCategory} />
      </div>
    </Layout>
  );
};

export default ProjectsPage;