import { createFileRoute } from '@tanstack/react-router'

// Called daily by pg_cron. For every user with email alerts on, aggregates
// nearby requests from the last 24h and sends a single digest.
export const Route = createFileRoute('/api/public/hooks/daily-digest')({
  server: {
    handlers: {
      POST: async () => {
        return Response.json({ ok: true, disabled: true }, { status: 202 })
      },
    },
  },
})
