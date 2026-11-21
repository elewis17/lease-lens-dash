import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import PortfolioSnapshot from "@/pages/PortfolioSnapshot";
import PortfolioDecisions from "@/pages/PortfolioDecisions";
import DealsScenarios from "@/pages/DealsScenarios";
import Memo from "@/pages/Memo";
import { RecordedMemo } from "@/features/decisions/RecordedMemo";
import { InvestmentPipeline } from "@/features/underwriting/InvestmentPipeline";
import { PortfolioStatus } from "./PortfolioStatus";
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
  const { draft, setDraft, illustrative, policyFor, entries } = useWorkspace();
  return <div className="space-y-8">
    <DealsScenarios values={draft} onChange={setDraft} illustrative={illustrative} policy={policyFor(draft.propertyType)} />
    {entries.available ? <InvestmentPipeline /> : entries.isPending ? null : (
      <p className="border-t pt-3 text-sm text-muted-foreground">{entries.isError ? "The investment pipeline could not be loaded." : "The connected database does not have the investment pipeline table yet."}</p>
    )}
  </div>;
}

export function DecisionMemo() {
  const { id } = useParams();
  const { dealAssumptions, pathTo, draft, policyFor } = useWorkspace();
  const navigate = useNavigate();
  return id === "draft"
    ? <Memo assumptions={dealAssumptions} policy={policyFor(draft.propertyType)} onOpenUnderwriting={() => navigate(pathTo("/underwrite"))} />
    : <RecordedMemo id={id ?? ""} />;
}

export function WorkspaceHome() {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: "briefing", search, hash }} replace />;
}
