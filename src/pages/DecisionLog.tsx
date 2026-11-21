import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { useWorkspace } from "@/features/portfolio/useWorkspace";
import { modelDeal } from "@/domain/finance/underwriting";

export default function DecisionLog() {
  const { pathTo, dealAssumptions, entries } = useWorkspace();
  const hasDraft = !!dealAssumptions && modelDeal(dealAssumptions) !== null;

  const decisions = entries.entries.filter(entry => entry.payload.kind === "acquisition" || entry.payload.kind === "policy" || (entry.payload.kind === "capital" && entry.payload.status === "decided"));

  return (
    <section className="space-y-4">
      <h1 className="view-title">Decision Log</h1>
      {entries.isPending ? <div className="h-14 animate-pulse border-y bg-muted/30" aria-label="Loading decisions" />
        : entries.isError ? <p role="alert">Could not load the Decision Log.</p>
        : !entries.available ? <p className="text-muted-foreground">The connected database does not have the Decision Log table yet.</p>
        : decisions.length === 0 ? <p className="text-muted-foreground">No recorded decisions yet.</p>
        : <ul className="divide-y border-y">{decisions.map(entry => (
            <li key={entry.id} className="py-3">
              <Link className="font-medium underline underline-offset-4" to={pathTo("/decisions/" + entry.id + "/memo")}>{entry.payload.title}</Link>
              <p className="text-sm text-muted-foreground">{new Date(entry.created_at).toLocaleDateString()}</p>
            </li>
          ))}</ul>}

      {hasDraft ? (
        <Link className={buttonVariants({ variant: "outline" })} to={pathTo("/decisions/draft/memo")}>Open draft memo</Link>
      ) : (
        <Link className={buttonVariants({ variant: "outline" })} to={pathTo("/underwrite")}>Open Underwrite</Link>
      )}
    </section>
  );
}
