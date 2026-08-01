import { createFileRoute } from '@tanstack/react-router'

// Fires when a new item is listed. Notifies nearby neighbors by email (opt-in).
// The in-app notification fan-out is done directly by the Postgres trigger.
export const Route = createFileRoute('/api/public/hooks/notify-item')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = (await request.json().catch(() => ({}))) as { item_id?: string }
        return Response.json({ ok: true, disabled: true, item_id: payload.item_id ?? null }, { status: 202 })
      },
    },
  },
})
