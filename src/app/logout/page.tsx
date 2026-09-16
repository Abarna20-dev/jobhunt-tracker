"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logout } from "../../lib/auth";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem("jobhunt_authenticated");
    logout().then(() => {
      router.replace("/login");
    });
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      Signing out...
    </main>
  );
}