import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "./useWorkspace";

export function PortfolioStatus({ children }: { children: ReactNode }) {
  const { query } = useWorkspace();
  if (query.isPending) return <p role="status" className="text-sm text-muted-foreground">Loading portfolio records…</p>;
  if (query.isError) return (
    <section className="space-y-3">
      <p role="alert">{query.error.message} Try loading the portfolio again.</p>
      <Button onClick={() => void query.refetch()} disabled={query.isFetching}>Retry loading portfolio</Button>
    </section>
  );
  return <>{children}</>;
}
