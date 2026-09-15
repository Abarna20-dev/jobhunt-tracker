// src/app/dashboard/page.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StatsBar from "../../components/StatsBar";
import KanbanBoard from "../../components/KanbanBoard";
import AddApplicationForm from "../../components/AddApplicationForm";
import InboxCheckPanel from "../../components/InboxCheckPanel";
import RemindersBanner from "../../components/RemindersBanner";
import { getCurrentUser } from "../../lib/auth";
import { FiLogOut, FiPlus, FiUser, FiX } from "react-icons/fi";

interface User {
  name: string;
  email: string;
}

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    getCurrentUser().then((currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);
      setCheckingAuth(false);
    });
  }, [router]);

  if (checkingAuth || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="text-sm font-semibold text-slate-500">
            Loading your dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-72 overflow-hidden">
        <div className="absolute -left-20 -top-32 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute right-0 -top-40 h-96 w-96 rounded-full bg-indigo-200/25 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <header className="mb-5 overflow-visible rounded-[28px] border border-white bg-white/90 shadow-[0_20px_70px_-35px_rgba(30,64,175,0.35)] backdrop-blur">
          <div className="relative px-5 py-4 sm:px-7 sm:py-5">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-100/60 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                  Job search dashboard
                </div>

                <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-[34px]">
                  JobHunt{" "}
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    Tracker
                  </span>
                </h1>

                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                  Welcome,{" "}
                  <span className="font-bold text-slate-700">
                    {user.name}
                  </span>
                  . Manage applications, interviews and offers in one place.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white shadow-xl transition hover:-translate-y-1 hover:bg-blue-700 sm:flex-none"
                >
                  <FiPlus size={17} strokeWidth={2.4} />
                  Add application
                </button>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu((value) => !value)}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-700"
                    aria-label="Account menu"
                  >
                    <FiUser size={19} />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                      <div className="border-b border-slate-100 px-4 py-4">
                        <p className="truncate text-sm font-extrabold text-slate-900">
                          {user.name}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>

                      <div className="p-2">
                        <button
                          onClick={() => router.push("/logout")}
                          className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                        >
                          <span className="flex items-center gap-2">
                            <FiLogOut size={16} />
                            Logout
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <StatsBar />
        <RemindersBanner />
        <InboxCheckPanel />

        <h2 className="mb-3 text-sm font-bold text-slate-500">
          Applications
        </h2>
        <KanbanBoard />
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div
            className="relative my-auto w-full max-w-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setShowForm(false)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 shadow-md transition hover:bg-red-50 hover:text-red-500"
              aria-label="Close add application form"
            >
              <FiX size={18} />
            </button>

            <AddApplicationForm onDone={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </main>
  );
}