import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";

const redirectUrl = import.meta.env.DEV
  ? "https://obscure-happiness-x96vq4vxrj43pvp-8000.app.github.dev/auth/callback"
  : "https://elewis17.github.io/lease-lens-dash/auth/callback"

export default function Login() {
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