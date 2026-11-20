import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { entrySchema, freezeAcquisition, type Entry, type EntryPayload } from "./entries";
import { connectedReview } from "@/features/portfolio/releaseProfile";
import { kirkwoodExample } from "@/domain/finance/underwriting";
import { loadSessionValue, storeSessionValue } from "@/features/navigation/sessionState";

const sampleDeal = {
  kind: "pipeline" as const, dealId: "85209680-bc14-4e36-85a0-57b18df175db", title: "Kirkwood",
  assumptions: kirkwoodExample,
};
const samplePass = freezeAcquisition(sampleDeal, "pass", "The asking price falls below the required debt-service coverage.");
const sampleEntries: Entry[] = [
  ...(samplePass ? [{ id: "1d69d5ce-a8a5-45d6-ae04-8bda90ace44b", created_at: "2026-11-18T12:00:00Z", payload: samplePass }] : []),
  { id: "7af0b7bd-d57c-4fba-8c67-4fbce07ba762", created_at: "2026-11-17T12:00:00Z", payload: sampleDeal },
];

export function useWorkspaceEntries(userId: string, illustrative: boolean) {
  const client = useQueryClient();
  const key = ["dealstack-entries", userId] as const;
  const local = `dealstack:illustrative:${userId}:entries`;
  const query = useQuery({
    queryKey: key,
    retry: false,
    queryFn: async ({ signal }): Promise<Entry[]> => {
      if (illustrative) return loadSessionValue(local, sampleEntries);
      if (connectedReview) return [];
      const rows: Entry[] = [];
      for (let start = 0; ; start += 500) {
        const { data, error } = await supabase.from("dealstack_workspace_entries")
          .select("id, created_at, payload").eq("user_id", userId)
          .order("created_at", { ascending: false }).order("id").range(start, start + 499).abortSignal(signal);
        if (error || !data) throw new Error("The decision record could not be loaded.");
        for (const row of data) {
          const payload = entrySchema.safeParse(row.payload);
          if (!payload.success) throw new Error("The decision record contains an unsupported entry.");
          rows.push({ ...row, payload: payload.data });
        }
        if (data.length < 500) return rows;
      }
    },
  });

  const append = async (payload: EntryPayload) => {
    if (connectedReview && !illustrative) throw new Error("Saving decisions is unavailable in the connected review.");
    const validated = entrySchema.parse(payload);
    const id = crypto.randomUUID();
    if (illustrative) {
      const existing = loadSessionValue(local, sampleEntries);
      const entry = { id, created_at: new Date().toISOString(), payload: validated };
      storeSessionValue(local, [entry, ...existing]);
      client.setQueryData(key, [entry, ...existing]);
      return id;
    } else {
      const { error } = await supabase.from("dealstack_workspace_entries").insert({ id, user_id: userId, payload: validated });
      if (error) throw new Error("The entry could not be saved. Try again.");
    }
    await client.invalidateQueries({ queryKey: key, exact: true });
    return id;
  };
  return { ...query, append, entries: query.data ?? [] };
}
