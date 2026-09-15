"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiLoader } from "react-icons/fi";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const authenticated =
      localStorage.getItem(
        "jobhunt_authenticated"
      ) === "true";

    if (authenticated) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950">
      <FiLoader
        className="animate-spin text-white"
        size={25}
      />
    </main>
  );
}