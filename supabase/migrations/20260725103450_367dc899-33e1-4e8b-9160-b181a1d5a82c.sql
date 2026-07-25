DROP POLICY IF EXISTS "offers_select_participants" ON public.request_offers;
CREATE POLICY "offers_select_public" ON public.request_offers
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_offers.request_id));