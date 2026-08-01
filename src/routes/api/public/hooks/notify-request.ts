import { createFileRoute } from '@tanstack/react-router'

// Called after a request row is inserted.
// Supabase integration has been removed; endpoint currently acts as a no-op.
export const Route = createFileRoute('/api/public/hooks/notify-request')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = (await request.json().catch(() => ({}))) as { request_id?: string }
        return Response.json({ ok: true, disabled: true, request_id: payload.request_id ?? null }, { status: 202 })
      },
    },
  },
})
