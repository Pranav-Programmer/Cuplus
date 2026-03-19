// src/app/home/page.tsx (updated for better mobile UI - adjust padding)
'use client';
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import HabitTracker from "@/components/HabitTracker";
import Scratchpad from "@/components/Scratchpad";
import UpcomingTasks from "@/components/UpcomingTasks";
import CalendarWidget from "@/components/CalendarWidget";
import QuickCapture from "@/components/QuickCapture";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

interface Task {
  id: string;
  task: string;
  date: string;
  time: string;
  notify: boolean;
  done: boolean;
  tags: string[];
}

const HomePage: React.FC = () => {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Auto-redirect if already logged in
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) router.push("/onboarding");
      });
      return unsubscribe;
    }, [router]);

    useEffect(() => {
    if (!user) { setTasks([]); return; }
    const today = new Date().toISOString().split("T")[0];
        
    const q = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid),
      where("date", ">=", today)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTasks: Task[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
        fetchedTasks.sort((a, b) =>
          a.date !== b.date ? a.date.localeCompare(b.date) : a.time.localeCompare(b.time)
        );
        setTasks(fetchedTasks.slice(0, 3));
      },
      (err) => { if (err.code !== 'permission-denied') console.error(err); }
    );
    
    return unsubscribe;
    }, [user]);

  return (
  <Layout>
    {/* Outer: full-width flex column, scrollbar sits right against the aside */}
    <div className="flex-1 overflow-y-auto no-scrollbar-mobile">
      {/* Inner: centers and pads the content */}
      <div className="p-4 md:p-0 lg:px-0 lg:py-12 max-w-4xl mx-auto">
        <Header />
        <HabitTracker />
        <Scratchpad />
        <UpcomingTasks />
        {/* Mobile/tablet: Calendar + QuickCapture below main content */}
        <div className="xl:hidden mt-8 w-full">
          <CalendarWidget />
          <QuickCapture />
        </div>
      </div>
    </div>

    {/* Right Column: hidden on <xl */}
    <aside className="w-80 border-l border-gray-800 bg-background-dark hidden xl:flex flex-col p-6 z-10 relative overflow-y-auto no-scrollbar">
      <CalendarWidget />
      <div className="flex-1" />
      <QuickCapture />
    </aside>

    {/* Mobile bottom fade */}
    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background-dark to-transparent pointer-events-none lg:hidden" />
  </Layout>
);
};

export default HomePage;