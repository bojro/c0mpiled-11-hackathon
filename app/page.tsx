import { hexclaveServerApp } from "@/lib/hexclave/server";
import { PipelineView } from "@/components/pipeline/PipelineView";
import { SignInGate } from "@/components/pipeline/SignInGate";

/**
 * The HR pipeline sits behind Hexclave auth — recruiters sign in, candidates
 * never have to (/apply, /status, /interview stay public by design).
 *
 * Fail-open: if the auth layer itself errors (e.g. running without the
 * hexclave dev wrapper), the console still renders. Auth must never be the
 * reason a demo dies.
 */
export default async function Home() {
  let user: { displayName?: string | null; primaryEmail?: string | null } | null = null;
  let authAvailable = true;
  try {
    user = await hexclaveServerApp.getUser();
  } catch (err) {
    console.error("[hexclave] auth unavailable, failing open:", err);
    authAvailable = false;
  }

  if (authAvailable && !user) {
    return <SignInGate />;
  }

  return (
    <PipelineView
      recruiterName={user?.displayName ?? user?.primaryEmail ?? undefined}
    />
  );
}
