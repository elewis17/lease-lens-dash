import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth";

type ProtectedRouteProps = {
  children: (userId: string) => ReactNode;
  signedOut?: ReactNode;
};

export function ProtectedRoute({ children, signedOut }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div role="status" aria-label="Loading workspace" className="container space-y-4 px-4 py-8">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!user || user.is_anonymous) {
    return signedOut ?? <Navigate to="/auth/login" replace />;
  }

  return <>{children(user.id)}</>;
}
