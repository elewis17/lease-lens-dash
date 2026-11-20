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
    if (url.origin !== new URL(SUPABASE_URL).origin || (!auth && !dataRead)) {
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
