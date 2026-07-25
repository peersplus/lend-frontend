
-- 1) Role enum + table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('superadmin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own roles" ON public.user_roles;
CREATE POLICY "read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 2) has_role helper (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Superadmin read-own-roles policy allows the client to know its role
DROP POLICY IF EXISTS "superadmins see all roles" ON public.user_roles;
CREATE POLICY "superadmins see all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

-- 3) Auto-grant role on signup / email confirmation
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND NEW.email IS NOT NULL THEN
    IF lower(NEW.email) = 'yogitadheerajvarshney@gmail.com' THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'superadmin')
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

DROP TRIGGER IF EXISTS on_auth_user_confirmed_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_assign_role
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.assign_default_role();

-- Backfill existing users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::public.app_role FROM auth.users
WHERE lower(email) = 'yogitadheerajvarshney@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::public.app_role FROM auth.users
WHERE lower(COALESCE(email,'')) <> 'yogitadheerajvarshney@gmail.com'
  AND email_confirmed_at IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 4) Superadmin RLS overlays (in addition to existing owner policies)
DROP POLICY IF EXISTS "superadmin all requests" ON public.requests;
CREATE POLICY "superadmin all requests" ON public.requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "superadmin all items" ON public.items;
CREATE POLICY "superadmin all items" ON public.items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "superadmin all bookings" ON public.bookings;
CREATE POLICY "superadmin all bookings" ON public.bookings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "superadmin all offers" ON public.request_offers;
CREATE POLICY "superadmin all offers" ON public.request_offers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "superadmin read notifications" ON public.notifications;
CREATE POLICY "superadmin read notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "superadmin read profiles" ON public.profiles;
CREATE POLICY "superadmin read profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

-- 5) Item-listed notification trigger (mirrors requests fan-out)
CREATE OR REPLACE FUNCTION public.notify_nearby_on_item()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  i_lat double precision := NEW.lat;
  i_lng double precision := NEW.lng;
BEGIN
  INSERT INTO public.notifications (recipient_id, request_id, kind, title, body)
  SELECT
    p.id,
    NULL,
    'new_item',
    'New nearby lend: ' || NEW.title,
    COALESCE(NEW.description, 'A neighbor just listed something to lend.')
  FROM public.profiles p
  WHERE p.id <> NEW.owner_id
    AND (
      i_lat IS NULL OR i_lng IS NULL OR p.lat IS NULL OR p.lng IS NULL
      OR (
        6371 * sqrt(
          pow(radians(p.lat - i_lat), 2) +
          pow(radians(p.lng - i_lng) * cos(radians((p.lat + i_lat)/2)), 2)
        ) <= COALESCE(p.radius_km, 5)
      )
    );

  BEGIN
    PERFORM net.http_post(
      url := 'https://project--ded194ea-5232-4886-86cb-a35e37bf8690.lovable.app/api/public/hooks/notify-item',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_snG1sz96PIRYbdFGxNuL6w_NNc6CTAr'
      ),
      body := jsonb_build_object('item_id', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'notify-item hook failed: %', SQLERRM;
  END;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_nearby_on_item ON public.items;
CREATE TRIGGER trg_notify_nearby_on_item
  AFTER INSERT ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.notify_nearby_on_item();

-- Also attach the existing request notifier trigger if not present
DROP TRIGGER IF EXISTS trg_notify_nearby_on_request ON public.requests;
CREATE TRIGGER trg_notify_nearby_on_request
  AFTER INSERT ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_nearby_on_request();
