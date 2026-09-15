"use client";

import { useState } from "react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiInbox,
  FiLoader,
  FiMail,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  addApplication,
  addNote,
  updateStatus,
} from "../store/applicationsSlice";
import { generateId } from "../lib/generateId";
import {
  type ApplicationStatus,
  STATUS_LABELS,
} from "../types/application";

type InboxClassification =
  | "rejected"
  | "interviewing"
  | "offer"
  | "unclear";

interface InboxMatch {
  company: string;
  subject: string;
  from: string;
  classification: InboxClassification;
}

interface InboxResponse {
  matches?: InboxMatch[];
  error?: string;
}

const CLASSIFICATION_TO_STATUS: Record<
  InboxClassification,
  ApplicationStatus | null
> = {
  rejected: "rejected",
  interviewing: "interviewing",
  offer: "offer",
  unclear: null,
};

const DOTS: Record<ApplicationStatus, string> = {
  applied: "bg-blue-500",
  interviewing: "bg-amber-500",
  offer: "bg-emerald-500",
  rejected: "bg-rose-500",
  withdrawn: "bg-slate-400",
};

function normalizeCompany(value: string) {
  return value.trim().toLowerCase();
}

function label(classification: InboxClassification) {
  if (classification === "interviewing") {
    return "Interview detected";
  }

  if (classification === "offer") {
    return "Offer detected";
  }

  if (classification === "rejected") {
    return "Rejection detected";
  }

  return "No status change";
}

function badge(classification: InboxClassification) {
  if (classification === "interviewing") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (classification === "offer") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (classification === "rejected") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-500";
}

function isInboxMatch(value: unknown): value is InboxMatch {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;
  const classification = item.classification;

  return (
    typeof item.company === "string" &&
    typeof item.subject === "string" &&
    typeof item.from === "string" &&
    (classification === "rejected" ||
      classification === "interviewing" ||
      classification === "offer" ||
      classification === "unclear")
  );
}

export default function InboxCheckPanel() {
  const applications = useAppSelector(
    (state) => state.applications.items
  );

  const dispatch = useAppDispatch();

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [results, setResults] = useState<InboxMatch[] | null>(null);

  async function handleCheckInbox() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/check-inbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyNames: applications.map(
            (application) => application.company
          ),
        }),
      });

      const data: InboxResponse = await response.json();

      if (!response.ok) {
        setError(
          data.error || "Unable to check your inbox."
        );
        return;
      }

      const matches = Array.isArray(data.matches)
        ? data.matches.filter(isInboxMatch)
        : [];

      const unique = matches.filter(
        (match, index, list) => {
          return (
            list.findIndex(
              (item) =>
                normalizeCompany(item.company) ===
                  normalizeCompany(match.company) &&
                item.subject === match.subject &&
                item.from === match.from
            ) === index
          );
        }
      );

      setResults(unique);

      if (unique.length === 0) {
        setSuccess(
          "Inbox checked. No job-response emails were detected."
        );
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not check your inbox. Please verify your Gmail settings and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function openAndCheck() {
    setShowModal(true);
    handleCheckInbox();
  }

  function closeModal() {
    if (loading) {
      return;
    }
    setShowModal(false);
  }

  function findApplication(company: string) {
    const normalized = normalizeCompany(company);

    if (normalized === normalizeCompany("Unknown company")) {
      return undefined;
    }

    return applications.find(
      (application) =>
        normalizeCompany(application.company) === normalized
    );
  }

  function moveApplication(
    match: InboxMatch,
    newStatus: ApplicationStatus
  ) {
    const application = findApplication(match.company);

    if (!application) {
      return;
    }

    dispatch(
      updateStatus({
        id: application.id,
        status: newStatus,
      })
    );

    dispatch(
      addNote({
        id: application.id,
        note: {
          id: generateId(),
          date: new Date()
            .toISOString()
            .slice(0, 10),
          text: `Gmail update: "${match.subject}" — moved to ${STATUS_LABELS[newStatus]}.`,
        },
      })
    );

    setSuccess(
      `${match.company} is now ${STATUS_LABELS[newStatus]}.`
    );
  }

  function addUnknownCompany(match: InboxMatch) {
    const exists = findApplication(match.company);

    if (exists) {
      return;
    }

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    dispatch(
      addApplication({
        id: generateId(),
        company: match.company.trim(),
        role: "Role from email",
        status: "applied",
        dateApplied: today,
        source: "Gmail",
        jobLink: "",
        notes: [
          {
            id: generateId(),
            date: today,
            text: `Added from Gmail: "${match.subject}".`,
          },
        ],
      })
    );

    setSuccess(
      `${match.company} was added to Applied.`
    );
  }

  return (
    <>
      {/* Compact bar - always a single row, never grows the page */}
      <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-[#101633] via-[#18245a] to-[#28449d] px-4 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-100 ring-1 ring-white/10">
            <FiInbox size={18} />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white">
              Gmail assistant
            </h2>
            <p className="truncate text-xs text-blue-100/65">
              Scan recent emails for interviews, offers, and rejections.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAndCheck}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-blue-700 shadow-lg hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? (
            <FiLoader size={15} className="animate-spin" />
          ) : (
            <FiRefreshCw size={15} />
          )}
          {loading
            ? "Checking..."
            : results
            ? "Check again"
            : "Check inbox"}
        </button>
      </section>

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="relative my-6 w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl sm:my-auto"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                  Gmail assistant
                </p>
                <h3 className="text-base font-black text-slate-900">
                  Inbox results
                </h3>
              </div>

              <button
                onClick={closeModal}
                disabled={loading}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-6">
              {error && (
                <div className="mb-4 flex gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <FiAlertCircle size={18} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <FiCheckCircle size={17} />
                  {success}
                </div>
              )}

              {loading && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-5 py-9 text-center">
                  <FiLoader
                    size={23}
                    className="mx-auto animate-spin text-blue-600"
                  />
                  <p className="mt-3 text-sm font-bold text-slate-800">
                    Checking your inbox
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Looking for recent job-related responses...
                  </p>
                </div>
              )}

              {!loading && results === null && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-5 py-8 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <FiMail size={20} />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-800">
                    Ready to check Gmail
                  </h3>
                  <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
                    Click Check inbox whenever you want to scan recent messages.
                  </p>
                </div>
              )}

              {!loading && results && results.length === 0 && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-5 py-8 text-center">
                  <FiCheckCircle
                    size={24}
                    className="mx-auto text-emerald-500"
                  />
                  <h3 className="mt-3 text-sm font-bold text-slate-800">
                    No new job responses found
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Try Check again later after a company sends a new message.
                  </p>
                </div>
              )}

              {!loading && results && results.length > 0 && (
                <div>
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Recent email activity
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Messages that look relevant to a job search.
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                      {results.length} found
                    </span>
                  </div>

                  <div className="space-y-3">
                    {results.map((match, index) => {
                      const application = findApplication(match.company);

                      const detectedStatus =
                        CLASSIFICATION_TO_STATUS[match.classification];

                      const alreadyCurrent = Boolean(
                        application &&
                          detectedStatus &&
                          application.status === detectedStatus
                      );

                      return (
                        <article
                          key={`${normalizeCompany(
                            match.company
                          )}-${match.subject}-${index}`}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 hover:shadow-md"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <FiMail size={19} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-[15px] font-bold text-slate-900">
                                  {match.company}
                                </h4>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${badge(
                                    match.classification
                                  )}`}
                                >
                                  {label(match.classification)}
                                </span>
                              </div>

                              <p className="mt-1.5 truncate text-sm font-semibold text-slate-700">
                                {match.subject || "Application email"}
                              </p>

                              <p className="mt-1 truncate text-xs text-slate-400">
                                {match.from}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-3 rounded-xl bg-slate-50 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                            {normalizeCompany(match.company) === normalizeCompany("Unknown company") ? (
                              <span className="text-xs font-semibold text-slate-400">
                                Sender company could not be identified — check manually
                              </span>
                            ) : application ? (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-slate-400">
                                  Current
                                </span>

                                <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                                  <span
                                    className={`h-2 w-2 rounded-full ${DOTS[application.status]}`}
                                  />
                                  {STATUS_LABELS[application.status]}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-blue-600">
                                New company — not in your tracker
                              </span>
                            )}

                            {application &&
                              detectedStatus &&
                              alreadyCurrent && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                  <FiCheckCircle size={15} />
                                  Already {STATUS_LABELS[application.status]}
                                </span>
                              )}

                            {application &&
                              detectedStatus &&
                              !alreadyCurrent && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    moveApplication(match, detectedStatus)
                                  }
                                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                                >
                                  Move to {STATUS_LABELS[detectedStatus]}
                                  <FiArrowRight size={14} />
                                </button>
                              )}

                            {!application && normalizeCompany(match.company) !== normalizeCompany("Unknown company") && (
                              <button
                                type="button"
                                onClick={() => addUnknownCompany(match)}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                              >
                                Add to Applied
                                <FiArrowRight size={14} />
                              </button>
                            )}

                            {application && !detectedStatus && (
                              <span className="text-xs font-semibold text-slate-400">
                                No status change needed
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
