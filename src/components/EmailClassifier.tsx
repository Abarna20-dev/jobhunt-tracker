"use client";

import { useState } from "react";
import {
  FiCheckCircle,
  FiCpu,
  FiLoader,
  FiXCircle,
} from "react-icons/fi";

import { useAppDispatch } from "../store/hooks";

import {
  addNote,
  updateStatus,
} from "../store/applicationsSlice";

import {
  ApplicationStatus,
  STATUS_LABELS,
} from "../types/application";

import { generateId } from "../lib/generateId";

const CLASSIFICATION_TO_STATUS: Record<
  string,
  ApplicationStatus | null
> = {
  rejected: "rejected",
  interviewing: "interviewing",
  offer: "offer",
  applied: "applied",
  unclear: null,
};

export default function EmailClassifier({
  applicationId,
}: {
  applicationId: string;
}) {
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [emailText, setEmailText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [result, setResult] =
    useState<string | null>(null);

  async function handleClassify() {
    if (!emailText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        "/api/classify-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emailText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to classify the email."
        );
        return;
      }

      const classification =
        String(data.classification || "")
          .toLowerCase()
          .trim();

      setResult(classification);

      const newStatus =
        CLASSIFICATION_TO_STATUS[
          classification
        ];

      if (newStatus) {
        dispatch(
          updateStatus({
            id: applicationId,
            status: newStatus,
          })
        );
      }

      dispatch(
        addNote({
          id: applicationId,
          note: {
            id: generateId(),
            date: new Date()
              .toISOString()
              .slice(0, 10),
            text: `AI classified the email as "${classification}"${
              newStatus
                ? ` and updated the application to ${STATUS_LABELS[newStatus]}.`
                : "."
            }`,
          },
        })
      );

      setEmailText("");
    } catch {
      setError(
        "Could not connect to the email classifier."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <FiCpu size={18} />
          </div>

          <div>
            <p className="text-sm font-extrabold text-slate-800">
              Email status assistant
            </p>

            <p className="text-xs text-slate-400">
              Paste an email to detect its status
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-blue-600">
          {open ? "Close" : "Open"}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5">
          <textarea
            value={emailText}
            onChange={(e) =>
              setEmailText(e.target.value)
            }
            placeholder="Paste the email content here..."
            rows={6}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
          />

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              <FiXCircle size={16} />
              {error}
            </div>
          )}

          {result && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <FiCheckCircle size={16} />
              Detected:{" "}
              <strong>{result}</strong>
            </div>
          )}

          <button
            type="button"
            onClick={handleClassify}
            disabled={
              loading || !emailText.trim()
            }
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <FiLoader
                  className="animate-spin"
                  size={17}
                />
                Classifying...
              </>
            ) : (
              <>
                <FiCpu size={17} />
                Classify email
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
