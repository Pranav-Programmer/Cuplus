// src/components/ProjectCard.tsx
import React from "react";
import Image from "next/image";

interface Project {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  content: string;
  createdAt: any;
}

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const formatDateTime = (timestamp: any) => {
    const date = timestamp.toDate();
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-surface-dark rounded-xl p-4 border border-gray-800 hover:border-primary/50 transition-all cursor-pointer overflow-hidden">
      {/* Image */}
      <div className="mb-3 relative w-full h-32">
        <Image
          src={project.imageUrl || "/img1.png"}
          alt={project.title}
          fill
          className="object-cover rounded-lg"
        />
      </div>
      {/* Title */}
      <h3 className="text-lg font-bold text-white mb-2 truncate">{project.title}</h3>
      {/* Content Preview */}
      <p className="text-sm text-gray-400 mb-3 line-clamp-3">{project.content}</p>
      {/* Date/Time */}
      <p className="text-xs text-gray-500">{formatDateTime(project.createdAt)}</p>
    </div>
  );
};

export default ProjectCard;