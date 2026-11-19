import type { ReactNode } from "react";
import { Route } from "react-router-dom";
import Holdings from "@/pages/Holdings";
import DecisionLog from "@/pages/DecisionLog";
import { Briefing, Capital, Underwrite, DecisionMemo, WorkspaceHome } from "./WorkspacePages";

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
