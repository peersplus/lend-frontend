import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute("/lovable/email/auth/webhook")({
  server: {
    handlers: {
      POST: async () =>
        new Response(
          JSON.stringify({ error: 'Lovable auth email webhook disabled' }),
          {
            status: 404,
            headers: { 'content-type': 'application/json' },
          },
        ),
    },
  },
})
