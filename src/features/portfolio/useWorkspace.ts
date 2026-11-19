import { useOutletContext } from "react-router-dom";
import type { WorkspaceContext } from "./Workspace";

export const useWorkspace = () => useOutletContext<WorkspaceContext>();
