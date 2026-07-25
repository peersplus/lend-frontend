-- 1. Extend profiles with location + notification prefs
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS radius_km integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS push_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_enabled boolean NOT NULL DEFAULT true;

-- 2. Requests table
CREATE TABLE public.requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  urgency text NOT NULL DEFAULT 'normal',
  needed_by timestamptz,
  lat double precision,
  lng double precision,
  radius_km integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requests TO authenticated;
GRANT ALL ON public.requests TO service_role;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open requests visible to authenticated"
  ON public.requests FOR SELECT TO authenticated
  USING (status = 'open' OR auth.uid() = owner_id);
CREATE POLICY "Users insert own requests"
  ON public.requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users update own requests"
  ON public.requests FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users delete own requests"
  ON public.requests FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);
CREATE TRIGGER requests_set_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 3. Notifications inbox
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id uuid NOT NULL,
  request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'nearby_request',
  title text NOT NULL,
  body text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipients read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = recipient_id);
CREATE POLICY "Recipients update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
CREATE POLICY "Recipients delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = recipient_id);
CREATE INDEX notifications_recipient_idx
  ON public.notifications(recipient_id, created_at DESC);

-- 4. Push subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subs"
  ON public.push_subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Fan-out trigger: on new request, insert notifications for nearby neighbors
CREATE OR REPLACE FUNCTION public.notify_nearby_on_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_lat double precision := NEW.lat;
  r_lng double precision := NEW.lng;
  r_radius integer := COALESCE(NEW.radius_km, 5);
BEGIN
  INSERT INTO public.notifications (recipient_id, request_id, kind, title, body)
  SELECT
    p.id,
    NEW.id,
    CASE WHEN NEW.urgency = 'urgent' THEN 'urgent_nearby' ELSE 'nearby_request' END,
    CASE WHEN NEW.urgency = 'urgent'
      THEN '🚨 Urgent nearby: ' || NEW.title
      ELSE 'Nearby request: ' || NEW.title END,
    COALESCE(NEW.description, 'A neighbor needs help.')
  FROM public.profiles p
  WHERE p.id <> NEW.owner_id
    AND (
      -- If either side has no coordinates, still notify (opt-in radius mode)
      r_lat IS NULL OR r_lng IS NULL OR p.lat IS NULL OR p.lng IS NULL
      OR (
        -- Approx distance in km using equirectangular projection
        6371 * sqrt(
          pow(radians(p.lat - r_lat), 2) +
          pow(radians(p.lng - r_lng) * cos(radians((p.lat + r_lat)/2)), 2)
        ) <= LEAST(r_radius, COALESCE(p.radius_km, 5))
      )
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_request_created ON public.requests;
CREATE TRIGGER on_request_created
  AFTER INSERT ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_nearby_on_request();