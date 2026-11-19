import type { ReactNode } from "react";
import { Navigate, Route, useLocation, useNavigate, useParams } from "react-router-dom";
import PortfolioSnapshot from "@/pages/PortfolioSnapshot";
import PortfolioDecisions from "@/pages/PortfolioDecisions";
import DealsScenarios from "@/pages/DealsScenarios";
import Holdings from "@/pages/Holdings";
import DecisionLog from "@/pages/DecisionLog";
import Memo from "@/pages/Memo";
import NotFound from "@/pages/NotFound";
import { PortfolioStatus } from "./PortfolioStatus";
import { useWorkspace } from "./Workspace";

function Briefing() {
  const { metrics, pathTo, illustrative, userId } = useWorkspace();
  const navigate = useNavigate();
  return (
    <PortfolioStatus>
      <PortfolioSnapshot metrics={metrics} onAddData={() => navigate(pathTo("/holdings"))}
        initialAppreciation={illustrative ? "3" : ""} sessionKey={`dealstack:${userId}:appreciation`} />
    </PortfolioStatus>
  );
}

function Capital() {
  const { metrics, pathTo, marketRate, setMarketRate, rentScenario, userId } = useWorkspace();
  const navigate = useNavigate();
  return (
    <PortfolioStatus>
      <PortfolioDecisions metrics={metrics} onAddData={() => navigate(pathTo("/holdings"))}
        marketRate={marketRate} onMarketRateChange={setMarketRate} rentScenario={rentScenario} sessionKey={`dealstack:${userId}:capital`} />
    </PortfolioStatus>
  );
}

function Underwrite() {
  const { draft, setDraft, illustrative } = useWorkspace();
  return <DealsScenarios values={draft} onChange={setDraft} illustrative={illustrative} />;
}

function DecisionMemo() {
  const { id } = useParams();
  const { dealAssumptions, pathTo } = useWorkspace();
  const navigate = useNavigate();
  return id === "draft"
    ? <Memo assumptions={dealAssumptions} onOpenUnderwriting={() => navigate(pathTo("/underwrite"))} />
    : <NotFound />;
}

function WorkspaceHome() {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: "briefing", search, hash }} replace />;
}

export function workspaceRoutes(element: ReactNode, path?: string, includeIndex = true) {
  return (
    <Route path={path} element={element}>
      {includeIndex && <Route index element={<WorkspaceHome />} />}
      <Route path="briefing" element={<Briefing />} />
      <Route path="capital" element={<Capital />} />
      <Route path="underwrite" element={<Underwrite />} />
      <Route path="holdings" element={<Holdings />} />
      <Route path="decisions" element={<DecisionLog />} />
      <Route path="decisions/:id/memo" element={<DecisionMemo />} />
    </Route>
  );
}
