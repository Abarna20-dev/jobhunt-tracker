"use client";

import { useState } from "react";
import {
  FiBriefcase,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiGift,
  FiMinusCircle,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";

import {
  useAppDispatch,
  useAppSelector,
} from "../store/hooks";

import {
  deleteApplication,
  updateStatus,
} from "../store/applicationsSlice";

import {
  APPLICATION_STATUSES,
  ApplicationStatus,
  STATUS_LABELS,
} from "../types/application";

import ConfirmDialog from "./ui/ConfirmDialog";
import { useToast } from "./ui/ToastProvider";

const COLUMN_ICONS = {
  applied: FiBriefcase,
  interviewing: FiClock,
  offer: FiGift,
  rejected: FiXCircle,
  withdrawn: FiMinusCircle,
};

interface StatusTheme {
  column: string;
  headerIcon: string;
  badge: string;
  accentBorder: string;
}

const STATUS_THEMES: Record<
  ApplicationStatus,
  StatusTheme
> = {
  applied: {
    column: "bg-slate-50/80 border-slate-200/80 shadow-xs",
    headerIcon: "bg-blue-600 text-white shadow-xs",
    badge: "bg-blue-50 text-blue-700 border border-blue-200/80",
    accentBorder: "border-l-blue-500 hover:border-blue-300",
  },
  interviewing: {
    column: "bg-slate-50/80 border-slate-200/80 shadow-xs",
    headerIcon: "bg-amber-500 text-white shadow-xs",
    badge: "bg-amber-50 text-amber-800 border border-amber-200/80",
    accentBorder: "border-l-amber-500 hover:border-amber-300",
  },
  offer: {
    column: "bg-slate-50/80 border-slate-200/80 shadow-xs",
    headerIcon: "bg-emerald-600 text-white shadow-xs",
    badge: "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
    accentBorder: "border-l-emerald-500 hover:border-emerald-300",
  },
  rejected: {
    column: "bg-slate-50/80 border-slate-200/80 shadow-xs",
    headerIcon: "bg-rose-500 text-white shadow-xs",
    badge: "bg-rose-50 text-rose-800 border border-rose-200/80",
    accentBorder: "border-l-rose-500 hover:border-rose-300",
  },
  withdrawn: {
    column: "bg-slate-50/80 border-slate-200/80 shadow-xs",
    headerIcon: "bg-slate-600 text-white shadow-xs",
    badge: "bg-slate-100 text-slate-700 border border-slate-200",
    accentBorder: "border-l-slate-400 hover:border-slate-300",
  },
};

const PAGE_SIZE = 4;

interface PendingDelete {
  id: string;
  company: string;
}

export default function KanbanBoard() {
  const dispatch =
    useAppDispatch();

  const { showToast } = useToast();

  const applications =
    useAppSelector(
      (state) =>
        state.applications.items
    );

  const [pendingDelete, setPendingDelete] =
    useState<PendingDelete | null>(null);

  const [pageByStatus, setPageByStatus] = useState<
    Record<ApplicationStatus, number>
  >({
    applied: 1,
    interviewing: 1,
    offer: 1,
    rejected: 1,
    withdrawn: 1,
  });

  function requestDelete(
    id: string,
    company: string
  ) {
    setPendingDelete({ id, company });
  }

  function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    dispatch(
      deleteApplication({ id: pendingDelete.id })
    );

    showToast(
      `${pendingDelete.company} was deleted.`,
      "success"
    );

    setPendingDelete(null);
  }

  function goToPage(
    status: ApplicationStatus,
    page: number
  ) {
    setPageByStatus((prev) => ({
      ...prev,
      [status]: page,
    }));
  }

  return (
    <>
      <div className="flex overflow-x-auto pb-4 gap-4 snap-x xl:grid xl:grid-cols-5 xl:overflow-visible xl:pb-0 items-start">
        {APPLICATION_STATUSES.map(
          (status) => {
            const Icon =
              COLUMN_ICONS[status];

            const items =
              applications.filter(
                (application) =>
                  application.status ===
                  status
              );

            const totalPages = Math.max(
              1,
              Math.ceil(items.length / PAGE_SIZE)
            );

            const currentPage = Math.min(
              pageByStatus[status],
              totalPages
            );

            const visibleItems = items.slice(
              (currentPage - 1) * PAGE_SIZE,
              currentPage * PAGE_SIZE
            );

            const theme = STATUS_THEMES[status];

            return (
              <section
                key={status}
                className={`min-w-[280px] w-[82vw] sm:w-[320px] xl:w-auto xl:min-w-0 flex-shrink-0 snap-start rounded-2xl border p-3.5 transition-all duration-200 ${theme.column}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${theme.headerIcon}`}
                    >
                      <Icon size={14} />
                    </div>

                    <h3 className="text-xs font-black tracking-tight text-slate-900">
                      {STATUS_LABELS[status]}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-black shadow-xs ${theme.badge}`}
                  >
                    {items.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/60 px-3 py-6 text-center">
                      <span className="mb-1 text-lg opacity-40">📁</span>
                      <p className="text-xs font-semibold text-slate-400">
                        No applications
                      </p>
                    </div>
                  ) : (
                    visibleItems.map((application) => (
                      <article
                        key={application.id}
                        className={`group rounded-xl border border-slate-200/90 border-l-[3.5px] bg-white p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${theme.accentBorder}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                              {application.company}
                            </h4>

                            <p className="mt-0.5 line-clamp-2 text-xs font-medium text-slate-500">
                              {application.role}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              requestDelete(
                                application.id,
                                application.company
                              )
                            }
                            title="Delete application"
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>

                        {/* Metadata tags */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {application.source && (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              {application.source}
                            </span>
                          )}

                          {application.interviewDate && (
                            <span className="rounded-md border border-amber-200/80 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              🗓️ {application.interviewDate}
                            </span>
                          )}

                          {application.jobLink && (
                            <a
                              href={application.jobLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-md border border-blue-200/60 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 hover:text-blue-800"
                            >
                              Job posting &rarr;
                            </a>
                          )}
                        </div>

                        {/* Status dropdown */}
                        <div className="relative mt-3">
                          <FiChevronDown
                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                            size={13}
                          />

                          <select
                            value={application.status}
                            onChange={(e) =>
                              dispatch(
                                updateStatus({
                                  id: application.id,
                                  status:
                                    e.target.value as ApplicationStatus,
                                })
                              )
                            }
                            className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200/90 bg-slate-50/80 px-2.5 py-1.5 pr-7 text-xs font-semibold text-slate-700 outline-none transition hover:bg-slate-100 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                          >
                            {APPLICATION_STATUSES.map((nextStatus) => (
                              <option key={nextStatus} value={nextStatus}>
                                Move to {STATUS_LABELS[nextStatus]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </article>
                    ))
                  )}
                </div>

                {items.length > PAGE_SIZE && (
                  <div className="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-2.5">
                    <button
                      type="button"
                      onClick={() => goToPage(status, currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Previous page"
                    >
                      <FiChevronLeft size={14} />
                    </button>

                    <span className="text-[11px] font-bold text-slate-500">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => goToPage(status, currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Next page"
                    >
                      <FiChevronRight size={14} />
                    </button>
                  </div>
                )}
              </section>
            );
          }
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this application?"
        description={
          pendingDelete
            ? `This will permanently remove the application for ${pendingDelete.company}.`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
