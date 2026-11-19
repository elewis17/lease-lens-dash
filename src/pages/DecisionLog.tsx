import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { useWorkspace } from "@/features/portfolio/Workspace";
import { modelDeal } from "@/domain/finance/underwriting";

export default function DecisionLog() {
  const { pathTo, dealAssumptions } = useWorkspace();
  const hasDraft = !!dealAssumptions && modelDeal(dealAssumptions) !== null;

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Decision Log</h1>
      <p className="text-muted-foreground">No recorded decisions yet.</p>
      {hasDraft ? (
        <Link className={buttonVariants({ variant: "outline" })} to={pathTo("/decisions/draft/memo")}>Open draft memo</Link>
      ) : (
        <Link className={buttonVariants({ variant: "outline" })} to={pathTo("/underwrite")}>Open Underwrite</Link>
      )}
    </section>
  );
}
