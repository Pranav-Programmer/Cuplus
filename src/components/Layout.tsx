// src/components/Layout.tsx
"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark text-gray-100">

      {/* Full-width black bar behind Hamburger Button (mobile only) */}
      {!isMenuOpen && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-background-dark/80 backdrop-blur-sm z-40 md:hidden mt-[35px] sm:mt-0" />
      )}
      
      {/* Sidebar - Hidden on <md, shown via toggle */}
      <div
        className={`fixed inset-0 z-30 transform ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:z-auto transition-transform duration-300 ease-in-out w-max md:w-64 shrink-0`}
      >
        <Sidebar />
      </div>

      {/* Backdrop for mobile menu - closes on click */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleMenu}
        />
      )}

      {/* Main Content - Flex-1, scrollable */}
      <main className="flex relative w-screen mt-[37px] sm:mt-0">
        {/* Hamburger Button - Visible only on <md */}
        <div className="absolute top-3 left-4 z-40 md:hidden text-white focus:outline-none flex justify-between">
         {!isMenuOpen ? <div className="ml-10 flex flex-1 gap-2 justify-center items-center">
          {/* <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-icons text-white text-lg">bolt</span>
          </div>  */}
          <span className="text-xl font-bold tracking-tight text-white border border-gray-400 rounded-lg p-1">Cuplus</span>
          </div>
          : null}
        {!isMenuOpen && (<button
          className="absolute z-40 md:hidden text-white focus:outline-none border border-gray-400 rounded-lg pt-1 pl-1 pr-1 -pb-2"
          onClick={toggleMenu}
        >
          <span className="material-icons text-3xl mt-0.5">{isMenuOpen ? "" : "menu"}</span>
        </button>)}
      </div>
        {children}
      </main>
    </div>
  );
};

export default Layout;