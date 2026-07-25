
REVOKE ALL ON FUNCTION public.can_chat_on_booking(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_booking_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_chat_on_booking(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_booking_contact(uuid) TO authenticated, service_role;
