import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useLocation } from "react-router-dom";
import { ReturnToWorkspace } from "@/features/navigation/returnTo";
import { callbackUrl } from "@/features/auth/authRedirect";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
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
        appearance={{ theme: ThemeSupa }}
        providers={["google"]}
        redirectTo={redirectUrl}
      />
    </div>
  );
}