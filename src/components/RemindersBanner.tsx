"use client";

import Link from "next/link";
import { useAppSelector } from "../store/hooks";

const URGENT_WINDOW_DAYS = 3;

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function formatCountdown(days: number): string {
  if (days < 0) return "passed";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

export default function RemindersBanner() {
  const applications = useAppSelector((state) => state.applications.items);

  const interviewReminders = applications
    .filter((a) => a.interviewDate)
    .map((a) => ({ app: a, days: daysUntil(a.interviewDate!) }))
    .filter((r) => r.days >= 0 && r.days <= URGENT_WINDOW_DAYS)
    .sort((a, b) => a.days - b.days);

  const deadlineReminders = applications
    .filter((a) => a.deadline)
    .map((a) => ({ app: a, days: daysUntil(a.deadline!) }))
    .filter((r) => r.days >= 0 && r.days <= URGENT_WINDOW_DAYS)
    .sort((a, b) => a.days - b.days);

  if (interviewReminders.length === 0 && deadlineReminders.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-2">
      {interviewReminders.map(({ app, days }) => (
        <Link
          key={`int-${app.id}`}
          href={`/application/${app.id}`}
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition"
        >
          <span className="text-lg">🗓️</span>
          <p className="text-sm text-amber-800">
            Interview with <strong>{app.company}</strong> is{" "}
            <strong>{formatCountdown(days)}</strong>
          </p>
        </Link>
      ))}
      {deadlineReminders.map(({ app, days }) => (
        <Link
          key={`dl-${app.id}`}
          href={`/application/${app.id}`}
          className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 hover:bg-red-100 transition"
        >
          <span className="text-lg">⏰</span>
          <p className="text-sm text-red-800">
            Application deadline for <strong>{app.company}</strong> closes{" "}
            <strong>{formatCountdown(days)}</strong>
          </p>
        </Link>
      ))}
    </div>
  );
}