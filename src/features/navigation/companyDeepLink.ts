const memoRoute = /^\/dealstack\/(?:demo\/)?decisions\/[0-9a-f-]{36}\/memo\/?$/i;

export function restoreCompanyDeepLink(location: Location, history: History) {
  if (location.pathname !== "/dealstack/") return;
  const route = new URLSearchParams(location.search).get("pages-route");
  if (!route?.startsWith("/dealstack/")) return;
  const target = new URL(route, location.origin);
  if (target.origin === location.origin && memoRoute.test(target.pathname)) {
    history.replaceState(history.state, "", target.pathname + target.search + target.hash);
  }
}
