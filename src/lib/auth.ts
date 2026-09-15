"use server";

import { cookies } from "next/headers";

const SESSION_COOKIE = "jobhunt_session";

export interface AppUser {
  name: string;
  email: string;
}

export async function login(email: string, password: string) {
  const configuredEmail =
    process.env.APP_LOGIN_EMAIL?.trim().toLowerCase();

  const configuredPassword =
    process.env.APP_LOGIN_PASSWORD;

  if (!configuredEmail || !configuredPassword) {
    return {
      success: false,
      error:
        "Login is not configured. Add APP_LOGIN_EMAIL and APP_LOGIN_PASSWORD to .env.local.",
    };
  }

  if (
    email.trim().toLowerCase() !== configuredEmail ||
    password !== configuredPassword
  ) {
    return {
      success: false,
      error: "Incorrect email or password.",
    };
  }

  const cookieStore = await cookies();

  cookieStore.set(
    SESSION_COOKIE,
    "authenticated",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/", // -- this implies cookie is applied to whole website
      maxAge: 60 * 60 * 24 * 7,
    }
  );

  return {
    success: true,
  };
}

export async function logout() {
  const cookieStore = await cookies();

  cookieStore.delete(
    SESSION_COOKIE
  );

  return {
    success: true,
  };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();

  const session =
    cookieStore.get(
      SESSION_COOKIE
    )?.value;

  if (session !== "authenticated") {
    return null;
  }

  return {
    name:
      process.env.APP_LOGIN_NAME ||
      "Job Hunter",

    email:
      process.env.APP_LOGIN_EMAIL ||
      "",
  };
}