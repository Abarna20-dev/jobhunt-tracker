import { z } from "zod";

export const APPLICATION_STATUSES = [
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<
  ApplicationStatus,
  string
> = {
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const STATUS_COLORS: Record<
  ApplicationStatus,
  string
> = {
  applied: "border-blue-300 bg-blue-100/90 text-blue-800",
  interviewing: "border-amber-300 bg-amber-100/90 text-amber-900",
  offer: "border-emerald-300 bg-emerald-100/90 text-emerald-900",
  rejected: "border-rose-300 bg-rose-100/90 text-rose-900",
  withdrawn: "border-slate-300 bg-slate-100 text-slate-700",
};

export const noteEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  text: z.string().min(1),
});

export const applicationSchema = z.object({
  id: z.string(),
  company: z.string().min(1),
  role: z.string().min(1),
  status: z.enum(APPLICATION_STATUSES),
  dateApplied: z.string(),
  source: z.string(),
  jobLink: z.string().optional(),
  interviewDate: z.string().optional(),
  deadline: z.string().optional(),
  notes: z.array(noteEntrySchema),
});

export type NoteEntry = z.infer<
  typeof noteEntrySchema
>;

export type Application = z.infer<
  typeof applicationSchema
>;

export const createApplicationFormSchema =
  z.object({
    company: z
      .string()
      .trim()
      .min(1, "Company name is required"),

    role: z
      .string()
      .trim()
      .min(1, "Job role is required"),

    dateApplied: z
      .string()
      .min(1, "Date applied is required"),

    source: z
      .string()
      .min(1, "Please select a source"),

    jobLink: z.string().optional(),

    interviewDate: z.string().optional(),

    deadline: z.string().optional(),
  });
