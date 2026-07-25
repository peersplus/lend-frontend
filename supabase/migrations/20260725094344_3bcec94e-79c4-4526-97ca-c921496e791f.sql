
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
