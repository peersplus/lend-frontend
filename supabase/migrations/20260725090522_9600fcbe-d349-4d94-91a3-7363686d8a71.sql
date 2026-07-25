
-- Extensions for HTTP + scheduling
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Extend the existing trigger to ALSO fan out email via an HTTP call to our
-- public server route. The route handles urgent-only email logic.
CREATE OR REPLACE FUNCTION public.notify_nearby_on_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r_lat double precision := NEW.lat;
  r_lng double precision := NEW.lng;
  r_radius integer := COALESCE(NEW.radius_km, 5);
BEGIN
  -- In-app inbox fan-out (unchanged)
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
      r_lat IS NULL OR r_lng IS NULL OR p.lat IS NULL OR p.lng IS NULL
      OR (
        6371 * sqrt(
          pow(radians(p.lat - r_lat), 2) +
          pow(radians(p.lng - r_lng) * cos(radians((p.lat + r_lat)/2)), 2)
        ) <= LEAST(r_radius, COALESCE(p.radius_km, 5))
      )
    );

  -- Fire off the HTTP hook so the app can send emails for urgent requests.
  -- Errors here must not block the insert.
  BEGIN
    PERFORM net.http_post(
      url := 'https://project--ded194ea-5232-4886-86cb-a35e37bf8690.lovable.app/api/public/hooks/notify-request',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_snG1sz96PIRYbdFGxNuL6w_NNc6CTAr'
      ),
      body := jsonb_build_object('request_id', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'notify-request hook failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists (it may already; recreate to be safe).
DROP TRIGGER IF EXISTS trg_notify_nearby_on_request ON public.requests;
CREATE TRIGGER trg_notify_nearby_on_request
AFTER INSERT ON public.requests
FOR EACH ROW EXECUTE FUNCTION public.notify_nearby_on_request();

-- Nightly digest at 09:00 UTC.
SELECT cron.unschedule('peers-help-daily-digest')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'peers-help-daily-digest');

SELECT cron.schedule(
  'peers-help-daily-digest',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--ded194ea-5232-4886-86cb-a35e37bf8690.lovable.app/api/public/hooks/daily-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_snG1sz96PIRYbdFGxNuL6w_NNc6CTAr'
    ),
    body := '{}'::jsonb
  );
  $$
);
