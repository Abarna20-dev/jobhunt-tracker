"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "../../../store/hooks";
import { addNote, deleteApplication } from "../../../store/applicationsSlice";
import { STATUS_LABELS, STATUS_COLORS } from "../../../types/application";
import { generateId } from "../../../lib/generateId";
import EmailClassifier from "../../../components/EmailClassifier";

export default function ApplicationDetail() {
  const params = useParams();
  const id = params.id as string;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [noteText, setNoteText] = useState("");

  const application = useAppSelector((state) =>
    state.applications.items.find((a) => a.id === id)
  );

  if (!application) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Application not found.</p>
      </main>
    );
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;

    dispatch(
      addNote({
        id,
        note: {
          id: generateId(),
          date: new Date().toISOString().slice(0, 10),
          text: noteText.trim(),
        },
      })
    );
    setNoteText("");
  }

  function handleDelete() {
    dispatch(deleteApplication({ id }));
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          &larr; Back to board
        </Link>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mt-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {application.company}
              </h1>
              <p className="text-sm text-gray-500">{application.role}</p>
            </div>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                STATUS_COLORS[application.status]
              }`}
            >
              {STATUS_LABELS[application.status]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <p className="text-gray-400">Date applied</p>
              <p className="text-gray-800">{application.dateApplied}</p>
            </div>
            <div>
              <p className="text-gray-400">Source</p>
              <p className="text-gray-800">{application.source}</p>
            </div>
            {application.jobLink && (
              <div className="col-span-2">
                <p className="text-gray-400">Job link</p>
                <a
                  href={application.jobLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {application.jobLink}
                </a>
              </div>
            )}
          </div>
        </div>

        <EmailClassifier applicationId={id} />

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Notes</h2>

          {application.notes.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">
              No notes yet. Log interview rounds and updates here.
            </p>
          ) : (
            <ul className="space-y-2 mb-4">
              {application.notes.map((note) => (
                <li
                  key={note.id}
                  className="border-l-2 border-blue-200 pl-3 text-sm"
                >
                  <p className="text-gray-400 text-xs">{note.date}</p>
                  <p className="text-gray-800">{note.text}</p>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Round 1: DSA interview, went well"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-blue-700 transition"
            >
              Add
            </button>
          </form>
        </div>

        <button
          onClick={handleDelete}
          className="text-sm text-red-500 hover:text-red-700 font-medium"
        >
          Delete this application
        </button>
      </div>
    </main>
  );
}
