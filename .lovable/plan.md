# Plan

## 1. Toast visibility (mobile + desktop)
- In `src/routes/__root.tsx`, reconfigure Sonner `<Toaster />`:
  - Use `position="top-center"` with mobile-safe offset (`top: env(safe-area-inset-top) + 12px`).
  - Force high z-index via `toastOptions.className` + a small CSS block in `src/styles.css` targeting `[data-sonner-toaster]` so it sits above the sticky header on mobile (currently the header + backdrop-blur can occlude it).
  - Drop `expand` (causes toasts to stack tall behind header on small screens).
- Add a tiny helper `src/lib/notify.ts` that wraps `toast.success/error` so every action uses one consistent call.
- Sweep action handlers that still use bare `alert()`/silent catches on:
  - `src/routes/items.tsx` (create/update/delete)
  - `src/routes/requests.tsx` (create/mark inactive/reopen/delete already partly done — audit)
  - `src/routes/bookings.tsx` (approve/dispatch/return)
  - `src/routes/profile.tsx` and `src/routes/settings.tsx` (already toasts, verify)

## 2. Notifications & emails "like Jira"
Goal: on every meaningful create/update, recipients get an in-app notification + email.

- Audit existing webhook routes under `src/routes/api/public/hooks/`:
  - `notify-request.ts` (new request fan-out — nearby neighbors)
  - `request-updated.ts` (status/edits)
  - `offer-created.ts`, `booking-pickup.ts`, `daily-digest.ts`
- Add missing triggers:
  - **New item listed** → notify + email neighbors within radius (mirror `notify-request` shape). Add `notify-item.ts` webhook + Postgres trigger on `items` insert calling it.
  - **Item updated** (price, availability) → notify users who previously requested/booked it.
  - **Booking state changes** → already partially wired; ensure email fires on approve/decline/dispatch/return.
- Each webhook must:
  - Verify `INTERNAL_HOOK_SECRET`.
  - Insert into `notifications` table (drives bell + realtime).
  - Call `sendTemplateEmail(...)` with correct template.
- Add lightweight test route `src/routes/api/public/hooks/_diag.ts` (secret-gated) that emits a synthetic notification+email to the caller so we can verify end-to-end without creating fake data.

## 3. Superadmin role
Enforce role via a dedicated table (never on profiles). Grant `yogitadheerajvarshney@gmail.com` `superadmin`; everyone else defaults to `user`.

Migration:
```sql
create type public.app_role as enum ('superadmin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create policy "read own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

-- Auto-grant based on verified email
create or replace function public.assign_default_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null then
    if lower(new.email) = 'yogitadheerajvarshney@gmail.com' then
      insert into public.user_roles(user_id, role) values (new.id, 'superadmin')
      on conflict do nothing;
    else
      insert into public.user_roles(user_id, role) values (new.id, 'user')
      on conflict do nothing;
    end if;
  end if;
  return new;
end $$;

create trigger on_user_created_assign_role
  after insert on auth.users for each row execute function public.assign_default_role();
create trigger on_user_confirmed_assign_role
  after update of email_confirmed_at on auth.users for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.assign_default_role();

-- Backfill existing user
insert into public.user_roles(user_id, role)
select id, 'superadmin' from auth.users where lower(email)='yogitadheerajvarshney@gmail.com'
on conflict do nothing;

insert into public.user_roles(user_id, role)
select id, 'user' from auth.users
where lower(email) <> 'yogitadheerajvarshney@gmail.com'
  and email_confirmed_at is not null
on conflict do nothing;
```

- Add RLS policies to allow `has_role(auth.uid(),'superadmin')` to `select` all rows on `requests`, `items`, `bookings`, `request_offers`, `notifications` (in addition to existing owner policies).

Frontend:
- `src/hooks/useRole.ts` returns `{ isSuperadmin }`.
- `src/routes/requests.tsx` and `src/routes/items.tsx`: when superadmin, drop owner-scoped filter and show an "Admin view" badge on rows they don't own.
- New route `src/routes/admin.tsx` (superadmin-only): tabbed view of all requests / items / bookings / users with basic search + delete.
- `SiteHeader.tsx`: show "Admin" link when `isSuperadmin`.

## Technical notes
- No changes to auto-generated Supabase files.
- All new webhook routes under `src/routes/api/public/hooks/` reuse `INTERNAL_HOOK_SECRET` HMAC pattern already in `notify-request.ts`.
- Frontend role check is UX only; RLS enforces access.
- Item/booking triggers go through `pg_net` posting to the internal hook URL, same pattern as existing request triggers.
