import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleAuth() {
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) {
        console.error("Error exchanging code:", error);
      }
        // Redirect user to dashboard after login completes
        navigate("/", { replace: true });
    }

    handleAuth();
  }, []);

  return <div>Processing login...</div>;
}
