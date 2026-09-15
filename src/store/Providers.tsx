"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { loadApplications } from "./applicationsSlice";
import ToastProvider from "../components/ui/ToastProvider";
import type {
  Application,
  NoteEntry,
} from "../types/application";

const STORAGE_KEY = "jobhunt-tracker-data";

const LEGACY_STORAGE_KEYS = [
  "jobhunt-tracker-applications",
  "jobhunt-applications",
  "jobApplications",
];

function normalizeApplications(
  value: unknown
): Application[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (
        item
      ): item is Record<string, unknown> =>
        Boolean(
          item &&
            typeof item === "object"
        )
    )
    .map((item) => {

      const rawNotes = item.notes;

      let notes: NoteEntry[] = [];

      if (Array.isArray(rawNotes)) {

        notes = rawNotes
          .filter(
            (
              note
            ): note is Record<string, unknown> =>
              Boolean(
                note &&
                  typeof note ===
                    "object"
              )
          )
          .map((note) => ({
            id: String(
              note.id ??
                crypto.randomUUID()
            ),

            date: String(
              note.date ??
                new Date()
                  .toISOString()
                  .slice(0, 10)
            ),

            text: String(
              note.text ?? ""
            ),
          }))
          .filter(
            (note) =>
              note.text
                .trim()
                .length > 0
          );

      } else if (
        typeof rawNotes ===
          "string" &&
        rawNotes.trim()
      ) {

        notes = [
          {
            id: crypto.randomUUID(),
            date: new Date()
              .toISOString()
              .slice(0, 10),
            text: rawNotes,
          },
        ];

      }

      const status =
        item.status ===
          "interviewing" ||
        item.status === "offer" ||
        item.status === "rejected" ||
        item.status === "withdrawn"
          ? item.status
          : "applied";

      return {
        id: String(
          item.id ??
            crypto.randomUUID()
        ),

        company: String(
          item.company ?? ""
        ).trim(),

        role: String(
          item.role ?? ""
        ).trim(),

        status,

        dateApplied: String(
          item.dateApplied ??
            new Date()
              .toISOString()
              .slice(0, 10)
        ),

        source: String(
          item.source ?? "Other"
        ),

        jobLink: String(
          item.jobLink ??
            item.jobUrl ??
            ""
        ),

        interviewDate:
          item.interviewDate
            ? String(
                item.interviewDate
              )
            : undefined,

        deadline: item.deadline
          ? String(item.deadline)
          : undefined,

        notes,
      } as Application;
    })
    .filter(
      (item) =>
        item.company &&
        item.role
    );
}

function readSavedApplications(): Application[] {
  if (
    typeof window ===
    "undefined"
  ) {
    return [];
  }

  const keys = [
    STORAGE_KEY,
    ...LEGACY_STORAGE_KEYS,
  ];

  for (const key of keys) {

    const saved =
      window.localStorage.getItem(
        key
      );

    if (!saved) {
      continue;
    }

    try {

      const parsed =
        normalizeApplications(
          JSON.parse(saved)
        );

      if (
        parsed.length > 0 ||
        key === STORAGE_KEY
      ) {
        return parsed;
      }

    } catch {
      // Try the next storage key.
    }
  }

  return [];
}

function LocalStorageSync() {

  const [hydrated, setHydrated] =
    useState(false);

  useEffect(() => {

    const savedApplications =
      readSavedApplications();

    store.dispatch(
      loadApplications(
        savedApplications
      )
    );

    setHydrated(true);

  }, []);

  useEffect(() => {

    if (!hydrated) {
      return;
    }

    const save = () => {

      try {

        const applications =
          store.getState()
            .applications.items;

        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            applications
          )
        );

      } catch {
        // Ignore storage errors.
      }
    };

    save();

    const unsubscribe =
      store.subscribe(save);

    return unsubscribe;

  }, [hydrated]);

  return null;
}

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <ToastProvider>
        <LocalStorageSync />
        {children}
      </ToastProvider>
    </Provider>
  );
}