"use client";

import { useAppSelector } from "../store/hooks";

export default function StatsBar() {
  const applications =
    useAppSelector(
      (state) =>
        state.applications.items
    );

  const total =
    applications.length;

  const active =
    applications.filter(
      (a) =>
        a.status === "applied" ||
        a.status === "interviewing"
    ).length;

  const interviewing =
    applications.filter(
      (a) =>
        a.status === "interviewing"
    ).length;

  const offers =
    applications.filter(
      (a) =>
        a.status === "offer"
    ).length;

  const stats = [
    [
      "All applications",
      total,
      "📋",
      "bg-blue-50 text-blue-600",
      "text-slate-950",
    ],
    [
      "Active",
      active,
      "⚡",
      "bg-violet-50 text-violet-600",
      "text-violet-700",
    ],
    [
      "Interviewing",
      interviewing,
      "💬",
      "bg-amber-50 text-amber-600",
      "text-amber-700",
    ],
    [
      "Offers",
      offers,
      "🎉",
      "bg-emerald-50 text-emerald-600",
      "text-emerald-700",
    ],
  ] as const;

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(
        ([
          label,
          value,
          icon,
          iconClass,
          valueClass,
        ]) => (
          <div
            key={label}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${iconClass}`}
            >
              {icon}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500">
                {label}
              </p>

              <p
                className={`text-2xl font-black tracking-tight ${valueClass}`}
              >
                {value}
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
