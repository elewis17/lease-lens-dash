import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { entrySchema, type Entry, type EntryPayload } from "./entries";
import { connectedReview } from "@/features/portfolio/releaseProfile";

export function useWorkspaceEntries(userId: string, illustrative: boolean) {
  const client = useQueryClient();
  const key = ["dealstack-entries", userId] as const;
  const local = `dealstack:illustrative:${userId}:entries`;
  const query = useQuery({
    queryKey: key,
    retry: false,
    queryFn: async ({ signal }): Promise<Entry[]> => {
      if (connectedReview) return [];
      if (illustrative) return JSON.parse(localStorage.getItem(local) ?? "[]") as Entry[];
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
    if (connectedReview) throw new Error("Saving decisions is unavailable in the connected review.");
    const validated = entrySchema.parse(payload);
    const id = crypto.randomUUID();
    if (illustrative) {
      const existing = JSON.parse(localStorage.getItem(local) ?? "[]") as Entry[];
      const entry = { id, created_at: new Date().toISOString(), payload: validated };
      localStorage.setItem(local, JSON.stringify([entry, ...existing]));
    } else {
      const { error } = await supabase.from("dealstack_workspace_entries").insert({ id, user_id: userId, payload: validated });
      if (error) throw new Error("The entry could not be saved. Try again.");
    }
    await client.invalidateQueries({ queryKey: key, exact: true });
    return id;
  };
  return { ...query, append, entries: query.data ?? [] };
}
