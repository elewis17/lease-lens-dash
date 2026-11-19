import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "./useWorkspace";

export function PortfolioStatus({ children }: { children: ReactNode }) {
  const { query } = useWorkspace();
  if (query.isPending) return (
    <div className="space-y-4" role="status">
      <span className="sr-only">Loading portfolio records…</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
  if (query.isError) return (
    <section className="space-y-3">
      <p role="alert">{query.error.message} Try loading the portfolio again.</p>
      <Button onClick={() => void query.refetch()} disabled={query.isFetching}>Retry loading portfolio</Button>
    </section>
  );
  return <>{children}</>;
}
