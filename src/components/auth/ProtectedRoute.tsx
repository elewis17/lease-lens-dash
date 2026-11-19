import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth";

type ProtectedRouteProps = {
  children: (userId: string) => ReactNode;
  signedOut?: ReactNode;
};

export function ProtectedRoute({ children, signedOut }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  if (!user) {
    return signedOut ?? <Navigate to="/auth/login" replace />;
  }

  return <>{children(user.id)}</>;
}
