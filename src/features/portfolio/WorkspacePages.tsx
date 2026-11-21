import { useState, type RefObject } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { currentDeals } from "@/features/decisions/entries";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Navigate, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import PortfolioSnapshot from "@/pages/PortfolioSnapshot";
import PortfolioDecisions from "@/pages/PortfolioDecisions";
import DealsScenarios from "@/pages/DealsScenarios";
import Memo from "@/pages/Memo";
import { RecordedMemo } from "@/features/decisions/RecordedMemo";
import { InvestmentPipeline } from "@/features/underwriting/InvestmentPipeline";
import { PortfolioStatus } from "./PortfolioStatus";
import type { WorkspaceContext } from "./Workspace";
import { useWorkspace } from "./useWorkspace";

export function Briefing() {
  const { metrics, pathTo, illustrative, userId } = useWorkspace();
  const navigate = useNavigate();
  return (
    <PortfolioStatus>
      <PortfolioSnapshot metrics={metrics} onAddData={() => navigate(pathTo("/holdings"))}
        onReviewProperty={propertyId => {
          const destination = pathTo("/capital");
          const search = new URLSearchParams(destination.search);
          search.set("property", propertyId);
          navigate({ ...destination, search: search.toString() });
        }}
        initialAppreciation={illustrative ? "3" : ""} vacancyTarget={illustrative ? 5 : null}
        sessionKey={`dealstack:${userId}:appreciation`} />
    </PortfolioStatus>
  );
}

export function Capital() {
  const { metrics, pathTo, marketRate, setMarketRate, rentScenario, userId } = useWorkspace();
  const navigate = useNavigate();
  return (
    <PortfolioStatus>
      <PortfolioDecisions metrics={metrics} onAddData={() => navigate(pathTo("/holdings"))}
        marketRate={marketRate} onMarketRateChange={setMarketRate} rentScenario={rentScenario} sessionKey={`dealstack:${userId}:capital`} />
    </PortfolioStatus>
  );
}

export function Underwrite() {
  const { draft, setDraft, illustrative, policyFor, entries, activeDealId } = useWorkspace();
  const [actions, setActions] = useState<HTMLDivElement | null>(null);
  const dealName = currentDeals(entries.entries).find(entry => entry.payload.dealId === activeDealId)?.payload.title
    ?? (illustrative && !activeDealId ? "Kirkwood" : undefined);
  return <div className="space-y-8">
    <DealsScenarios values={draft} onChange={setDraft} dealName={dealName} actionRef={setActions} policy={policyFor(draft.propertyType)} />
    {entries.available ? <InvestmentPipeline actionContainer={actions} /> : entries.isPending ? <Skeleton className="h-20 w-full" aria-label="Loading pipeline" /> : (
      <p className="border-t pt-3 text-sm text-muted-foreground">{entries.isError ? "The investment pipeline could not be loaded." : "The connected database does not have the investment pipeline table yet."}</p>
    )}
  </div>;
}

export function DecisionMemo() {
  const { id } = useParams();
  const { dealAssumptions, pathTo, draft, policyFor, memoTriggerRef, entries, activeDealId, illustrative } =
    useOutletContext<WorkspaceContext & { memoTriggerRef: RefObject<HTMLAnchorElement> }>();
  const navigate = useNavigate();
  const dealName = currentDeals(entries.entries).find(entry => entry.payload.dealId === activeDealId)?.payload.title
    ?? (illustrative && !activeDealId ? "Kirkwood" : undefined);
  return <Sheet open onOpenChange={open => {
    if (!open) navigate(pathTo("/decisions"), { replace: true, preventScrollReset: true });
  }}>
    <SheetContent side="bottom" className="mx-auto max-h-[88dvh] max-w-3xl overflow-y-auto rounded-t-xl"
      onCloseAutoFocus={event => {
        event.preventDefault();
        memoTriggerRef.current?.focus({ preventScroll: true });
      }}>
      <SheetTitle className="sr-only">Decision memo</SheetTitle>
      <SheetDescription className="sr-only">Details for the selected decision</SheetDescription>
      {id === "draft"
        ? <Memo dealName={dealName} assumptions={dealAssumptions} policy={policyFor(draft.propertyType)} onOpenUnderwriting={() => navigate(pathTo("/underwrite"))} />
        : <RecordedMemo id={id ?? ""} />}
    </SheetContent>
  </Sheet>;
}

export function WorkspaceHome() {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: "briefing", search, hash }} replace />;
}
