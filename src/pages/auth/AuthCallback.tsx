import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { ReturnToWorkspace } from "@/features/navigation/returnTo";
import { callbackHasError } from "@/features/auth/authRedirect";
import { supabase } from "@/integrations/supabase/client";
import { connectedReview } from "@/features/portfolio/releaseProfile";

export default function AuthCallback() {
  const { search, hash } = useLocation();
  const providerError = callbackHasError(search, hash);
  const [arrivedWithCode] = useState(() => new URLSearchParams(search).has("code"));
  const [result, setResult] = useState<"checking" | "success" | "failure">("checking");

  useEffect(() => {
    if (providerError) return;
    let mounted = true;
    const finish = async () => {
      try {
        // Supabase initializes the PKCE exchange once, including any error from the provider.
        const { error: initializationError } = await supabase.auth.initialize();
        // A successful exchange removes the code. A code without its verifier can remain
        // unprocessed by the SDK even when an earlier session is still available.
        if (initializationError || new URLSearchParams(window.location.search).has("code")) {
          if (mounted) setResult("failure");
          return;
        }
        const { data, error } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (mounted) setResult(!error && user && !user.is_anonymous ? "success" : "failure");
      } catch {
        if (mounted) setResult("failure");
      }
    };
    void finish();
    return () => { mounted = false; };
  }, [providerError]);

  if (!providerError && result === "success") return <ReturnToWorkspace />;
  if (!providerError && result === "checking") return <p className="p-6" role="status">Completing sign-in…</p>;
  if (connectedReview && !providerError && !arrivedWithCode) return <Navigate to="/auth/login" replace />;

  return (
    <section aria-labelledby="sign-in-error" className="mx-auto max-w-md space-y-4 px-6 py-10">
      <h1 id="sign-in-error" className="text-xl font-semibold">Sign-in could not be completed</h1>
      <p role="alert" className="text-sm text-muted-foreground">Start a new sign-in attempt to continue to your portfolio.</p>
      <Link to="/auth/login?retry=1" replace className="inline-flex rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
        Try signing in again
      </Link>
    </section>
  );
}
