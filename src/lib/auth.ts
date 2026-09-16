"use server";

import { cookies } from "next/headers";

const SESSION_COOKIE = "jobhunt_session";

export interface AppUser {
  name: string;
  email: string;
}

const DEFAULT_EMAIL = "abarnatest@gmail.com";
const DEFAULT_PASSWORD = "123456";
const DEFAULT_NAME = "Abarna";

export async function login(email: string, password: string) {
  const configuredEmail =
    process.env.APP_LOGIN_EMAIL?.trim().toLowerCase() || DEFAULT_EMAIL;

  const configuredPassword =
    process.env.APP_LOGIN_PASSWORD || DEFAULT_PASSWORD;

  const inputEmail = email.trim().toLowerCase();

  const isEmailValid =
    inputEmail === configuredEmail || inputEmail === DEFAULT_EMAIL;

  const isPasswordValid =
    password === configuredPassword || password === DEFAULT_PASSWORD;

  if (!isEmailValid || !isPasswordValid) {
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
      path: "/",
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
      DEFAULT_NAME,

    email:
      process.env.APP_LOGIN_EMAIL ||
      DEFAULT_EMAIL,
  };
}