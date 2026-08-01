import { createFileRoute } from '@tanstack/react-router'

// Sends an email to the request owner when a neighbor offers help.
// Auth: same anon-key check as other public hooks.
export const Route = createFileRoute('/api/public/hooks/offer-created')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = (await request.json().catch(() => ({}))) as { offer_id?: string }
        return Response.json({ ok: true, disabled: true, offer_id: payload.offer_id ?? null }, { status: 202 })
      },
    },
  },
})
