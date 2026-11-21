import { Skeleton } from "@/components/ui/skeleton";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useTheme } from "next-themes";
import { useLocation } from "react-router-dom";
import { ReturnToWorkspace } from "@/features/navigation/returnTo";
import { callbackUrl } from "@/features/auth/authRedirect";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { connectedReview, connectedReviewCallback, legacyPortfolio } from "@/features/portfolio/releaseProfile";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Login() {
  const { resolvedTheme } = useTheme();
  const { user, loading } = useAuth();
  const { search } = useLocation();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const retry = new URLSearchParams(search).get("retry") === "1";
  if (loading) return <section role="status" aria-label="Loading sign-in" className="mx-auto max-w-md space-y-4 p-6"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-32 w-full" /></section>;
  if (user && !retry) return <ReturnToWorkspace />;

  if (legacyPortfolio) {
    const redirect = connectedReview
      ? new URL(connectedReviewCallback, window.location.origin).href
      : callbackUrl(window.location.origin, import.meta.env.BASE_URL) + "/";
    const signIn = new URL("auth/login/", new URL(import.meta.env.BASE_URL, window.location.origin)).href;
    return (
      <section className="mx-auto max-w-md space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Sign in to DealStack</h1>
        {error && <p role="alert">Google sign-in could not start. Try again.</p>}
        {window.top !== window.self
          ? <Button asChild><a href={signIn} target="_blank" rel="noopener noreferrer">Open sign-in in a browser tab</a></Button>
          : <Button disabled={pending} onClick={async () => {
              setPending(true);
              setError(false);
              try {
                const result = await supabase.auth.signInWithOAuth({ provider: "google", options: {
                  redirectTo: redirect,
                } });
                if (result.error) throw result.error;
              } catch {
                setError(true);
              } finally {
                setPending(false);
              }
            }}>Continue with Google</Button>}
      </section>
    );
  }

  const redirectUrl = callbackUrl(window.location.origin, import.meta.env.BASE_URL);
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Auth
        supabaseClient={supabase}
        theme={resolvedTheme}
        appearance={{ theme: ThemeSupa, style: { button: {
          backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))",
          borderColor: "hsl(var(--border))", borderRadius: "999px",
        } }, variables: { default: { colors: {
          brand: "hsl(var(--primary))", brandAccent: "hsl(var(--primary) / 0.9)",
          brandButtonText: "hsl(var(--primary-foreground))", defaultButtonBackground: "hsl(var(--card))",
          defaultButtonBackgroundHover: "hsl(var(--muted))", defaultButtonBorder: "hsl(var(--input))",
          defaultButtonText: "hsl(var(--foreground))", inputBackground: "hsl(var(--background))",
          inputBorder: "hsl(var(--input))", inputBorderHover: "hsl(var(--ring))",
          inputBorderFocus: "hsl(var(--ring))", inputText: "hsl(var(--foreground))",
          inputLabelText: "hsl(var(--muted-foreground))", inputPlaceholder: "hsl(var(--muted-foreground))",
          anchorTextColor: "hsl(var(--foreground))", anchorTextHoverColor: "hsl(var(--foreground))",
          messageText: "hsl(var(--foreground))", messageTextDanger: "hsl(var(--destructive))",
        } } } }}
        providers={["google"]}
        redirectTo={redirectUrl}
      />
    </div>
  );
}
