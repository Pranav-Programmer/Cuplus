// src/components/Sidebar.tsx (updated for initial Dashboard highlight)
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || (path === "/home" && pathname === "/");

  return (
    <aside className="w-64 h-full bg-surface-dark border-r border-gray-800 flex flex-col justify-between flex-shrink-0 overflow-y-auto">
      <div>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-800 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-icons text-white text-lg">bolt</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Cuplus</span>
          </div>
        </div>
        {/* Navigation */}
        <nav className="p-4 space-y-1">
          <Link href="/home" className={`flex items-center gap-3 px-4 py-3 rounded-lg group transition-all ${isActive("/home") ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-surface-dark-lighter hover:text-white hover:bg-primary/20"}`}>
            <span className="material-icons text-xl">dashboard</span>
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/notes" className={`flex items-center gap-3 px-4 py-3 rounded-lg group transition-all ${isActive("/notes") ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-surface-dark-lighter hover:text-white hover:bg-primary/20"}`}>
            <span className="material-icons text-xl">description</span>
            <span className="font-medium">Notes</span>
          </Link>
          <Link href="/tasks" className={`flex items-center gap-3 px-4 py-3 rounded-lg group transition-all ${isActive("/tasks") ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-surface-dark-lighter hover:text-white hover:bg-primary/20"}`}>
            <span className="material-icons text-xl">check_circle</span>
            <span className="font-medium">Tasks</span>
          </Link>
          <Link href="/projects" className={`flex items-center gap-3 px-4 py-3 rounded-lg group transition-all ${isActive("/projects") ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-surface-dark-lighter hover:text-white hover:bg-primary/20"}`}>
            <span className="material-icons text-xl">folder_open</span>
            <span className="font-medium">Projects</span>
          </Link>
          <Link href="/sanctum" className={`flex items-center gap-3 px-4 py-3 rounded-lg group transition-all ${isActive("/sanctum") ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-surface-dark-lighter hover:text-white hover:bg-primary/20"}`}>
            <span className="material-icons text-xl">folder_open</span>
            <span className="font-medium">Sanctum</span>
          </Link>
          <Link href="/archive" className={`flex items-center gap-3 px-4 py-3 rounded-lg group transition-all ${isActive("/archive") ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-surface-dark-lighter hover:text-white hover:bg-primary/20"}`}>
            <span className="material-icons text-xl">inventory_2</span>
            <span className="font-medium">Archive</span>
          </Link>
          <Link href="/recycle-bin" className={`flex items-center gap-3 px-4 py-3 rounded-lg group transition-all ${isActive("/recycle-bin") ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-surface-dark-lighter hover:text-white hover:bg-primary/20"}`}>
            <span className="material-icons text-xl">delete</span>
            <span className="font-medium">Recycle Bin</span>
          </Link>
        </nav>
        <div className="px-6 py-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Favorites</h3>
          <div className="space-y-3">
            <Link href="#" className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Q4 Strategy
            </Link>
            <Link href="#" className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Personal Wiki
            </Link>
            <Link href="#" className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              Book Drafts
            </Link>
          </div>
        </div>
      </div>
      {/* User Profile */}
      <div className="p-4 border-t border-gray-800">
        <button className="flex items-center gap-3 w-full p-2 hover:bg-surface-dark-lighter rounded-lg transition-colors">
          <Image
            src="/user.png"
            alt="User Profile Picture"
            width={40}
            height={40}
            className="rounded-full border border-gray-600"
          />
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Alex Morgan</p>
            <p className="text-xs text-gray-400">User Designation</p>
          </div>
          <span className="material-icons text-gray-400 ml-auto">more_vert</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;