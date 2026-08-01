import { createFileRoute } from '@tanstack/react-router'

// Notifies helpers who offered on a request when the request is updated
// (status change: closed / reopened / deleted). In-app + email fan-out.
export const Route = createFileRoute('/api/public/hooks/request-updated')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = (await request.json().catch(() => ({}))) as { request_id?: string; status?: string }
        return Response.json({ ok: true, disabled: true, request_id: payload.request_id ?? null, status: payload.status ?? null }, { status: 202 })
      },
    },
  },
})
