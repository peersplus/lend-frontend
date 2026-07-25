
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS deposit_amount numeric(10,2);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  borrower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','approved','declined','picked_up','returned','defect_reported','closed','cancelled')),
  agreed_rent_per_day numeric(10,2),
  agreed_days integer,
  agreed_deposit numeric(10,2) NOT NULL DEFAULT 0,
  consent_accepted_at timestamptz,
  pickup_at timestamptz,
  return_due timestamptz,
  returned_at timestamptz,
  has_defect boolean NOT NULL DEFAULT false,
  defect_notes text,
  amount_paid numeric(10,2),
  borrower_notes text,
  owner_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or borrower can view booking"
  ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = borrower_id);

CREATE POLICY "Borrower creates own booking"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = borrower_id);

CREATE POLICY "Owner or borrower updates booking"
  ON public.bookings FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = borrower_id)
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = borrower_id);

CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX IF NOT EXISTS bookings_borrower_idx ON public.bookings(borrower_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_owner_idx ON public.bookings(owner_id, created_at DESC);
