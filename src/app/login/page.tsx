"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FiArrowRight,
  FiBriefcase,
  FiLock,
  FiMail,
} from "react-icons/fi";

import { login } from "../../lib/auth";
import { useToast } from "../../components/ui/ToastProvider";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email.")
    .email("Enter a valid email address."),
  password: z
    .string()
    .min(1, "Please enter your password."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const authenticated =
      localStorage.getItem(
        "jobhunt_authenticated"
      ) === "true";

    if (authenticated) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function onSubmit(values: LoginFormValues) {
    const result = await login(
      values.email.trim(),
      values.password
    );

    if (!result.success) {
      setError("root", {
        message: result.error || "Invalid email or password.",
      });
      return;
    }

    localStorage.setItem("jobhunt_authenticated", "true");
    showToast("Signed in successfully.", "success");
    router.replace("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/20">
            <FiBriefcase size={25} />
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight text-white">
            JobTrack
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Manage your job applications smarter.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <h2 className="text-xl font-extrabold text-slate-900">
            Welcome back
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Sign in to continue to your dashboard.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mt-7 space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Email <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <FiMail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className={`w-full rounded-xl border bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none focus:bg-white focus:ring-4 ${
                    errors.email
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                />
              </div>

              {errors.email && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Password <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <FiLock
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="password"
                  placeholder="Enter your password"
                  {...register("password")}
                  className={`w-full rounded-xl border bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none focus:bg-white focus:ring-4 ${
                    errors.password
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                />
              </div>

              {errors.password && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {errors.root && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {errors.root.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting
                ? "Signing in..."
                : "Sign in"}

              {!isSubmitting && (
                <FiArrowRight size={17} />
              )}
            </button>
          </form>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Instant Access
            </span>
          </div>

          <button
            type="button"
            onClick={async () => {
              const result = await login("abarnatest@gmail.com", "123456");
              if (result.success) {
                localStorage.setItem("jobhunt_authenticated", "true");
                showToast("Signed in successfully.", "success");
                router.replace("/dashboard");
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <span>⚡ One-Click Demo Sign In</span>
          </button>

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-center text-xs text-slate-600">
            <p className="font-bold text-blue-900">Demo Login Details:</p>
            <p className="mt-0.5 font-mono text-[11px] text-slate-700">
              Email: <span className="font-bold">abarnatest@gmail.com</span> | Password: <span className="font-bold">123456</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
