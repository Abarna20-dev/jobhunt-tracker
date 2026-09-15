import type { Metadata } from "next";

import Providers from "../store/Providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "JobHunt Tracker",
  description:
    "Track your job applications in one place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}