import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { destinationStorageKey, loadSessionValue, storeSessionValue, workspacePath, type WorkspaceDestination } from "./sessionState";

export function ReturnToWorkspace() {
  const [destination] = useState(() => loadSessionValue<WorkspaceDestination | null>(destinationStorageKey, null));
  useEffect(() => { storeSessionValue(destinationStorageKey, null); }, []);
  return <Navigate to={destination && workspacePath.test(destination.pathname) ? destination : "/"} replace />;
}
