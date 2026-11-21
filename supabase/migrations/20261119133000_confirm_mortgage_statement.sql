CREATE TABLE public.dealstack_mortgage_statements (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mortgage_id uuid NOT NULL REFERENCES public.mortgages(id) ON DELETE CASCADE,
  statement_date date NOT NULL,
  principal_balance numeric(14,2) NOT NULL CHECK (principal_balance >= 0),
  document_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mortgage_id, statement_date)
);
ALTER TABLE public.dealstack_mortgage_statements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.dealstack_mortgage_statements FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.dealstack_mortgage_statements TO authenticated;
CREATE POLICY "Read own mortgage statements" ON public.dealstack_mortgage_statements
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE FUNCTION public.confirm_mortgage_statement(
  p_id uuid, p_mortgage_id uuid, p_statement_date date, p_principal_balance numeric, p_document_path text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  owner_id uuid := auth.uid();
  before_statement date;
BEGIN
  IF owner_id IS NULL OR COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) THEN
    RAISE EXCEPTION 'Sign-in required' USING ERRCODE = '42501';
  END IF;
  IF p_id IS NULL OR p_statement_date IS NULL OR p_statement_date > CURRENT_DATE OR
     p_principal_balance IS NULL OR p_principal_balance < 0 OR p_principal_balance >= 1000000000000 OR
     p_document_path IS NULL OR p_document_path !~ ('^' || owner_id || '/' || p_id || '/statement\.(pdf|jpg|png|webp)$') THEN
    RAISE EXCEPTION 'Invalid statement details' USING ERRCODE = '23514';
  END IF;

  PERFORM 1 FROM public.mortgages m WHERE m.id = p_mortgage_id AND m.user_id = owner_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mortgage unavailable' USING ERRCODE = '42501';
  END IF;
  PERFORM 1 FROM public.dealstack_mortgage_statements s
  WHERE s.id = p_id AND s.mortgage_id = p_mortgage_id AND s.user_id = owner_id;
  IF FOUND THEN RETURN p_id; END IF;
  PERFORM 1 FROM storage.objects WHERE bucket_id = 'lease-documents' AND name = p_document_path;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Statement document unavailable' USING ERRCODE = '23514';
  END IF;

  SELECT max(s.statement_date) INTO before_statement
  FROM public.dealstack_mortgage_statements s WHERE s.mortgage_id = p_mortgage_id AND s.user_id = owner_id;
  IF before_statement IS NOT NULL AND p_statement_date <= before_statement THEN
    RAISE EXCEPTION 'A statement dated the same day or later is already confirmed' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.dealstack_mortgage_statements (id, user_id, mortgage_id, statement_date, principal_balance, document_path)
  VALUES (p_id, owner_id, p_mortgage_id, p_statement_date, p_principal_balance, p_document_path);
  UPDATE public.mortgages SET current_balance = p_principal_balance WHERE id = p_mortgage_id AND user_id = owner_id;
  RETURN p_id;
END;
$$;
REVOKE ALL ON FUNCTION public.confirm_mortgage_statement(uuid, uuid, date, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_mortgage_statement(uuid, uuid, date, numeric, text) TO authenticated;
