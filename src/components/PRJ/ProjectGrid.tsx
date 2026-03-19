// src/components/ProjectGrid.tsx
import React from "react";
import ProjectCard from "./ProjectCard";

interface Project {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  content: string;
  createdAt: any;
}

interface ProjectGridProps {
  projects: Project[];
}

const ProjectGrid: React.FC<ProjectGridProps> = ({ projects }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
      {projects.length === 0 && (
        <p className="col-span-full text-center text-gray-400 py-8 text-lg">
          No projects yet. Create one above!
        </p>
      )}
    </div>
  );
};

export default ProjectGrid;