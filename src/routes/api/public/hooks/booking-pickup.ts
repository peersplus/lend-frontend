import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/hooks/booking-pickup')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = (await request.json().catch(() => ({}))) as { booking_id?: string }
        return Response.json({ ok: true, disabled: true, booking_id: payload.booking_id ?? null }, { status: 202 })
      },
    },
  },
})
