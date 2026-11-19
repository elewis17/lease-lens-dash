import { useEffect, useState, type ReactNode } from "react";
import { AuthContext, type AuthContextValue } from "./auth";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // INITIAL_SESSION follows Supabase’s URL callback and session initialization.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = { user, session, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
