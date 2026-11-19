import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useTheme } from "next-themes";
import { useLocation } from "react-router-dom";
import { ReturnToWorkspace } from "@/features/navigation/returnTo";
import { callbackUrl } from "@/features/auth/authRedirect";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const { resolvedTheme } = useTheme();
  const { user, loading } = useAuth();
  const { search } = useLocation();
  const retry = new URLSearchParams(search).get("retry") === "1";
  if (loading) return <p className="p-6" role="status">Loading sign-in…</p>;
  if (user && !retry) return <ReturnToWorkspace />;

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