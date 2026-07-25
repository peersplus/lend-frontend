
-- 1. Profiles: restrict SELECT to own row + public card via function
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.avatar_url FROM public.profiles p WHERE p.id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_request_contact(_request_id uuid, _peer_id uuid)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, phone text, building_name text, address text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE caller uuid := auth.uid();
BEGIN
  IF caller IS NULL THEN RETURN; END IF;
  IF NOT public.can_chat_on_request(_request_id, _peer_id, caller) THEN RETURN; END IF;
  RETURN QUERY SELECT p.id, p.display_name, p.avatar_url, p.phone, p.building_name, p.address
    FROM public.profiles p WHERE p.id = _peer_id;
END;
$$;

-- 2. request_offers: restrict SELECT to request owner + helper
DROP POLICY IF EXISTS offers_select_public ON public.request_offers;
CREATE POLICY offers_select_participants ON public.request_offers
  FOR SELECT TO authenticated USING (
    helper_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_offers.request_id AND r.owner_id = auth.uid())
  );

-- 3. Storage: restrict photos SELECT to owner or referenced by visible content
DROP POLICY IF EXISTS "photos: authenticated can read" ON storage.objects;
CREATE POLICY "photos: owner or related can read" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'photos' AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.avatar_url = name)
      OR EXISTS (SELECT 1 FROM public.items i WHERE i.image_url = name)
      OR EXISTS (SELECT 1 FROM public.requests r WHERE r.image_url = name)
      OR EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE (auth.uid() = b.owner_id OR auth.uid() = b.borrower_id)
          AND name IN (b.pickup_photo_url, b.return_photo_url, b.pickup_person_photo, b.return_person_photo)
      )
    )
  );

-- 4. Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_nearby_on_request() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.can_chat_on_booking(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_chat_on_request(uuid, uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_booking_contact(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profile(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_request_contact(uuid, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.can_chat_on_booking(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_chat_on_request(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_contact(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_request_contact(uuid, uuid) TO authenticated;
