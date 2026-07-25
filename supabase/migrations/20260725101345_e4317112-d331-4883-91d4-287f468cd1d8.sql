
-- 1) request_offers: neighbor offers to help on a request
CREATE TABLE public.request_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  helper_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, helper_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_offers TO authenticated;
GRANT ALL ON public.request_offers TO service_role;
ALTER TABLE public.request_offers ENABLE ROW LEVEL SECURITY;

-- Helper offers are visible to the helper and to the request owner
CREATE POLICY "offers_select_participants" ON public.request_offers
  FOR SELECT TO authenticated
  USING (
    helper_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.owner_id = auth.uid())
  );

CREATE POLICY "offers_insert_helper" ON public.request_offers
  FOR INSERT TO authenticated
  WITH CHECK (
    helper_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.owner_id = auth.uid())
  );

CREATE POLICY "offers_delete_helper" ON public.request_offers
  FOR DELETE TO authenticated USING (helper_id = auth.uid());

-- 2) messages: allow request-scoped conversations
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS peer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.messages ALTER COLUMN booking_id DROP NOT NULL;

-- Helper to test if caller can chat on a request thread
CREATE OR REPLACE FUNCTION public.can_chat_on_request(_request_id uuid, _peer_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.requests r
    WHERE r.id = _request_id
      AND (
        (r.owner_id = _user_id AND EXISTS (SELECT 1 FROM public.request_offers o WHERE o.request_id = r.id AND o.helper_id = _peer_id))
        OR (_peer_id = r.owner_id AND EXISTS (SELECT 1 FROM public.request_offers o WHERE o.request_id = r.id AND o.helper_id = _user_id))
      )
  );
$$;

-- Drop and recreate messages policies to include request threads
DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_participants" ON public.messages;

CREATE POLICY "messages_select_participants" ON public.messages
  FOR SELECT TO authenticated
  USING (
    (booking_id IS NOT NULL AND public.can_chat_on_booking(booking_id, auth.uid()))
    OR (request_id IS NOT NULL AND peer_id IS NOT NULL AND public.can_chat_on_request(request_id, peer_id, auth.uid()))
    OR (request_id IS NOT NULL AND peer_id IS NOT NULL AND public.can_chat_on_request(request_id, auth.uid(), peer_id))
  );

CREATE POLICY "messages_insert_participants" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND (
      (booking_id IS NOT NULL AND public.can_chat_on_booking(booking_id, auth.uid()))
      OR (request_id IS NOT NULL AND peer_id IS NOT NULL AND public.can_chat_on_request(request_id, peer_id, auth.uid()))
    )
  );

-- 3) bookings: scheduled pickup/return + optional handoff person
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_scheduled_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS return_scheduled_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_person_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_person_photo text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS return_person_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS return_person_photo text;

-- 4) profiles: toggle to ask for handoff person details
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS require_handoff_person boolean NOT NULL DEFAULT false;
