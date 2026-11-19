import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { loadSessionValue, storeSessionValue } from "./sessionState";

const storageKey = "dealstack:sign-in-destination";
const allowedPath = /^\/(?:briefing|capital|underwrite|holdings|decisions(?:\/[a-z0-9-]+\/memo)?)\/?$/i;
type Destination = { pathname: string; search: string; hash: string };

export function rememberWorkspaceLocation(location: Destination) {
  const { pathname, search, hash } = location;
  storeSessionValue(storageKey, allowedPath.test(pathname) ? { pathname, search, hash } : null);
}

export function ReturnToWorkspace() {
  const [destination] = useState(() => loadSessionValue<Destination | null>(storageKey, null));
  useEffect(() => { storeSessionValue(storageKey, null); }, []);
  return <Navigate to={destination && allowedPath.test(destination.pathname) ? destination : "/"} replace />;
}
