"use client";

import { useState } from "react";

import { useAppDispatch } from "../store/hooks";

import {
  addApplication,
} from "../store/applicationsSlice";

import {
  createApplicationFormSchema,
} from "../types/application";

import { generateId } from "../lib/generateId";
import { useToast } from "./ui/ToastProvider";

const SOURCES = [
  "LinkedIn",
  "Referral",
  "Company site",
  "Naukri",
  "Other",
];

export default function AddApplicationForm({
  onDone,
}: {
  onDone?: () => void;
}) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const [company, setCompany] =
    useState("");

  const [role, setRole] =
    useState("");

  const [dateApplied, setDateApplied] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

  const [source, setSource] =
    useState(SOURCES[0]);

  const [jobLink, setJobLink] =
    useState("");

  const [interviewDate, setInterviewDate] =
    useState("");

  const [deadline, setDeadline] =
    useState("");

  const [errors, setErrors] =
    useState<string[]>([]);

  function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const result =
      createApplicationFormSchema.safeParse({
        company,
        role,
        dateApplied,
        source,
        jobLink,
        interviewDate,
        deadline,
      });

    if (!result.success) {
      setErrors(
        result.error.issues.map(
          (issue) => issue.message
        )
      );

      return;
    }

    setErrors([]);

    dispatch(
      addApplication({
        id: generateId(),

        company: company.trim(),

        role: role.trim(),

        status: "applied",

        dateApplied,

        source,

        jobLink: jobLink.trim(),

        interviewDate:
          interviewDate ||
          undefined,

        deadline:
          deadline ||
          undefined,

        notes: [],
      })
    );

    setCompany("");

    setRole("");

    setDateApplied(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

    setSource(SOURCES[0]);

    setJobLink("");

    setInterviewDate("");

    setDeadline("");

    showToast(
      `${company.trim()} was added to Applied.`,
      "success"
    );

    onDone?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-h-[90vh] overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl sm:p-7"
    >
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl">
          📝
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-950">
            Add application
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Add the job once and manage
            its progress from your
            dashboard.
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-red-700">
            Please fix the following
          </p>

          <ul className="space-y-1 text-sm text-red-600">
            {errors.map(
              (error, index) => (
                <li key={index}>
                  • {error}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      <div className="space-y-5">

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Company <span className="text-red-500">*</span>
            </label>

            <input
              value={company}
              onChange={(e) =>
                setCompany(
                  e.target.value
                )
              }
              placeholder="e.g. Google"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Job role <span className="text-red-500">*</span>
            </label>

            <input
              value={role}
              onChange={(e) =>
                setRole(
                  e.target.value
                )
              }
              placeholder="e.g. Frontend Developer"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Date applied <span className="text-red-500">*</span>
            </label>

            <input
              type="date"
              value={dateApplied}
              onChange={(e) =>
                setDateApplied(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Application source
            </label>

            <select
              value={source}
              onChange={(e) =>
                setSource(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {SOURCES.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700">
            Job link{" "}
            <span className="font-normal text-slate-400">
              (optional)
            </span>
          </label>

          <input
            type="url"
            value={jobLink}
            onChange={(e) =>
              setJobLink(
                e.target.value
              )
            }
            placeholder="https://company.com/job/..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Interview date{" "}
              <span className="font-normal text-slate-400">
                (optional)
              </span>
            </label>

            <input
              type="date"
              value={interviewDate}
              onChange={(e) =>
                setInterviewDate(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Deadline{" "}
              <span className="font-normal text-slate-400">
                (optional)
              </span>
            </label>

            <input
              type="date"
              value={deadline}
              onChange={(e) =>
                setDeadline(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
            />
          </div>

        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={onDone}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-extrabold text-white shadow-lg transition hover:bg-blue-700"
          >
            Add application
          </button>

        </div>
      </div>
    </form>
  );
}