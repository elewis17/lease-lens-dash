CREATE TABLE public.dealstack_workspace_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL CHECK (
    jsonb_typeof(payload) = 'object' AND
    COALESCE(payload->>'kind', '') IN ('pipeline', 'acquisition', 'capital', 'policy')
  )
);
CREATE INDEX dealstack_workspace_entries_owner_history
  ON public.dealstack_workspace_entries (user_id, created_at, id);
ALTER TABLE public.dealstack_workspace_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.dealstack_workspace_entries FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.dealstack_workspace_entries TO authenticated;
CREATE POLICY "Read own workspace entries" ON public.dealstack_workspace_entries
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Append own workspace entries" ON public.dealstack_workspace_entries
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

CREATE UNIQUE INDEX dealstack_capital_lifecycle_once
  ON public.dealstack_workspace_entries (user_id, (payload->>'opportunityId'), (payload->>'status'))
  WHERE payload->>'kind' = 'capital';

CREATE FUNCTION public.check_dealstack_capital_transition()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  next_status text := NEW.payload->>'status';
  opportunity text := NEW.payload->>'opportunityId';
  prior_status text;
  decision jsonb;
BEGIN
  IF NEW.payload->>'kind' <> 'capital' THEN
    RETURN NEW;
  END IF;
  IF opportunity IS NULL OR char_length(opportunity) = 0 OR
     COALESCE(next_status, '') NOT IN ('investigating', 'decided', 'executing', 'completed') THEN
    RAISE EXCEPTION 'Invalid opportunity transition' USING ERRCODE = '23514';
  END IF;

  prior_status := CASE next_status
    WHEN 'decided' THEN 'investigating' WHEN 'executing' THEN 'decided' WHEN 'completed' THEN 'executing'
  END;
  IF prior_status IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.dealstack_workspace_entries e
    WHERE e.user_id = NEW.user_id AND e.payload->>'kind' = 'capital'
      AND e.payload->>'opportunityId' = opportunity AND e.payload->>'status' = prior_status
  ) THEN
    RAISE EXCEPTION 'Prior opportunity status is missing' USING ERRCODE = '23514';
  END IF;
  IF next_status IN ('executing', 'completed') THEN
    SELECT e.payload INTO decision FROM public.dealstack_workspace_entries e
    WHERE e.user_id = NEW.user_id AND e.payload->>'kind' = 'capital'
      AND e.payload->>'opportunityId' = opportunity AND e.payload->>'status' = 'decided';
    IF decision IS NULL OR (decision->'projection') IS DISTINCT FROM (NEW.payload->'projection')
       OR (decision->>'propertyId') IS DISTINCT FROM (NEW.payload->>'propertyId') THEN
      RAISE EXCEPTION 'The original projection is frozen' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_dealstack_capital_transition
BEFORE INSERT ON public.dealstack_workspace_entries FOR EACH ROW
EXECUTE FUNCTION public.check_dealstack_capital_transition();
