"use client";

import { SignIn } from "@hexclave/next";

/** Recruiter sign-in, rendered inside Debrief's own chrome. */
export function SignInGate() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-line px-8 py-4">
        <span className="font-mono text-sm font-medium tracking-widest text-ink uppercase">
          Debrief
        </span>
        <span className="font-mono text-xs text-ink-muted">
          recruiter console · sign in
        </span>
      </header>
      <main className="flex flex-1 items-center justify-center px-8 pb-16">
        <div className="w-full max-w-sm">
          <SignIn />
          <p className="mt-6 text-center font-mono text-[10.5px] text-ink-muted">
            candidates never need an account — only the hiring team signs in
          </p>
        </div>
      </main>
    </div>
  );
}
