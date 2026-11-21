import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { connectedReview } from "@/features/portfolio/releaseProfile";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: connectedReview ? { fetch: (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input);
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    const auth = (method === "POST" && ["/auth/v1/token", "/auth/v1/logout"].includes(url.pathname))
      || (method === "GET" && url.pathname === "/auth/v1/user");
    const dataRead = method === "GET" && (url.pathname.startsWith("/rest/v1/") || url.pathname.startsWith("/storage/v1/"));
    const scopedLeaseChange = (method === "PATCH" || method === "DELETE") && url.pathname === "/rest/v1/leases"
      && ["id", "unit_id"].every(column => /^eq\.[0-9a-f-]{36}$/i.test(url.searchParams.get(column) ?? ""));
    const newLease = method === "POST" && (url.pathname === "/rest/v1/rpc/dealstack_add_lease" ||
      (url.pathname === "/rest/v1/rpc/save_manual_lease" && typeof init?.body === "string" && /"p_edit":false[,}]/.test(init.body)));
    const legacyLeaseCreation = method === "POST" && ["/rest/v1/units", "/rest/v1/tenants", "/rest/v1/leases",
      "/rest/v1/rpc/update_property_unit_count"].includes(url.pathname);
    if (url.origin !== new URL(SUPABASE_URL).origin || (!auth && !dataRead && !scopedLeaseChange && !newLease && !legacyLeaseCreation)) {
      return Promise.resolve(new Response(JSON.stringify({ message: "The connected review is read-only." }), {
        status: 403, headers: { "Content-Type": "application/json" },
      }));
    }
    return fetch(input, init);
  } } : undefined,
  auth: {
    storage: connectedReview ? sessionStorage : localStorage,
    ...(connectedReview ? { storageKey: "dealstack-connected-review-auth" } : {}),
    flowType: "pkce",
    persistSession: true,
    autoRefreshToken: true,
  }
});
