import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import PortfolioSnapshot from "@/pages/PortfolioSnapshot";
import PortfolioDecisions from "@/pages/PortfolioDecisions";
import DealsScenarios from "@/pages/DealsScenarios";
import Memo from "@/pages/Memo";
import NotFound from "@/pages/NotFound";
import { PortfolioStatus } from "./PortfolioStatus";
import { useWorkspace } from "./useWorkspace";

export function Briefing() {
  const { metrics, pathTo, illustrative, userId } = useWorkspace();
  const navigate = useNavigate();
  return (
    <PortfolioStatus>
      <PortfolioSnapshot metrics={metrics} onAddData={() => navigate(pathTo("/holdings"))}
        initialAppreciation={illustrative ? "3" : ""} sessionKey={`dealstack:${userId}:appreciation`} />
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
  const { draft, setDraft, illustrative } = useWorkspace();
  return <DealsScenarios values={draft} onChange={setDraft} illustrative={illustrative} />;
}

export function DecisionMemo() {
  const { id } = useParams();
  const { dealAssumptions, pathTo } = useWorkspace();
  const navigate = useNavigate();
  return id === "draft"
    ? <Memo assumptions={dealAssumptions} onOpenUnderwriting={() => navigate(pathTo("/underwrite"))} />
    : <NotFound />;
}

export function WorkspaceHome() {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: "briefing", search, hash }} replace />;
}
