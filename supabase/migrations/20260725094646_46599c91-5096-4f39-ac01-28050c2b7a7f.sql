
-- Profile contact + address
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS building_name text,
  ADD COLUMN IF NOT EXISTS address text;

-- Items location + address
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS building_name text,
  ADD COLUMN IF NOT EXISTS address text;

-- Messages tied to a booking (chat unlocks after approval)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL CHECK (length(btrim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_booking_created_idx
  ON public.messages(booking_id, created_at);

GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helper: is this booking active + is caller a participant?
CREATE OR REPLACE FUNCTION public.can_chat_on_booking(_booking_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = _booking_id
      AND (b.borrower_id = _user_id OR b.owner_id = _user_id)
      AND b.status IN ('approved','picked_up','returned','defect_reported','completed')
  );
$$;

CREATE POLICY "Participants can read booking messages"
  ON public.messages FOR SELECT TO authenticated
  USING (public.can_chat_on_booking(booking_id, auth.uid()));

CREATE POLICY "Participants can send booking messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.can_chat_on_booking(booking_id, auth.uid())
  );

-- Enable realtime for chat
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Reveal counterpart contact only when a booking between them is approved+
CREATE OR REPLACE FUNCTION public.get_booking_contact(_booking_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  phone text,
  building_name text,
  address text,
  role text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b public.bookings;
  caller uuid := auth.uid();
  other uuid;
  other_role text;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id = _booking_id;
  IF b.id IS NULL THEN RETURN; END IF;
  IF caller NOT IN (b.borrower_id, b.owner_id) THEN RETURN; END IF;
  IF b.status NOT IN ('approved','picked_up','returned','defect_reported','completed') THEN RETURN; END IF;

  IF caller = b.borrower_id THEN
    other := b.owner_id; other_role := 'owner';
  ELSE
    other := b.borrower_id; other_role := 'borrower';
  END IF;

  RETURN QUERY
  SELECT p.id, p.display_name, p.avatar_url, p.phone, p.building_name, p.address, other_role
  FROM public.profiles p WHERE p.id = other;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_booking_contact(uuid) TO authenticated;
