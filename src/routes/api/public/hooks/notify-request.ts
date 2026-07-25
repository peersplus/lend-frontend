import { createFileRoute } from '@tanstack/react-router'
import { sendTemplateEmail } from '@/lib/email-templates/send-email'

// Called by the postgres trigger (pg_net) after a request row is inserted.
// Fans out email alerts to nearby neighbors. Requires either the Supabase
// anon key (apikey header) or an internal bearer to prevent abuse.
export const Route = createFileRoute('/api/public/hooks/notify-request')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get('apikey') ?? ''
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? ''
        if (!expected || apikey !== expected) {
          return new Response('Unauthorized', { status: 401 })
        }

        let payload: { request_id?: string }
        try {
          payload = await request.json()
        } catch {
          return new Response('Invalid JSON', { status: 400 })
        }
        if (!payload.request_id) return new Response('request_id required', { status: 400 })

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        const { data: req, error: reqErr } = await supabaseAdmin
          .from('requests')
          .select('id, owner_id, title, description, urgency, lat, lng, radius_km, category')
          .eq('id', payload.request_id)
          .maybeSingle()
        if (reqErr || !req) return new Response('Not found', { status: 404 })

        // Only urgent requests trigger immediate email; normal ones roll into digest.
        if (req.urgency !== 'urgent') {
          return Response.json({ ok: true, sent: 0, reason: 'not_urgent' })
        }

        const { data: owner } = await supabaseAdmin
          .from('profiles')
          .select('display_name, neighborhood')
          .eq('id', req.owner_id)
          .maybeSingle()

        // Everyone with email alerts on. We fetch a bounded page and filter by
        // radius in JS — good enough for MVP scale.
        const { data: recipients } = await supabaseAdmin
          .from('profiles')
          .select('id, email_enabled, lat, lng, radius_km')
          .neq('id', req.owner_id)
          .eq('email_enabled', true)
          .limit(2000)

        const inRadius = (recipients ?? []).filter((p) => {
          if (req.lat == null || req.lng == null || p.lat == null || p.lng == null) return true
          const r = Math.min(req.radius_km ?? 5, p.radius_km ?? 5)
          const km =
            6371 *
            Math.sqrt(
              Math.pow(((p.lat - req.lat) * Math.PI) / 180, 2) +
                Math.pow(
                  (((p.lng - req.lng) * Math.PI) / 180) *
                    Math.cos((((p.lat + req.lat) / 2) * Math.PI) / 180),
                  2,
                ),
            )
          return km <= r
        })

        // Look up auth emails via admin API in one batch.
        const feedUrl = new URL('/requests', new URL(request.url).origin).toString()

        let sent = 0
        for (const p of inRadius) {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(p.id)
          const email = authUser?.user?.email
          if (!email) continue
          try {
            const res = await sendTemplateEmail('nearby-urgent', email, {
              idempotencyKey: `urgent-${req.id}-${p.id}`,
              templateData: {
                title: req.title,
                description: req.description ?? '',
                requesterName: owner?.display_name ?? 'A nearby neighbor',
                neighborhood: owner?.neighborhood ?? 'your area',
                requestUrl: feedUrl,
              },
            })
            if (res.sent) sent++
          } catch (e) {
            console.error('urgent send failed', p.id, e)
          }
        }

        return Response.json({ ok: true, sent, considered: inRadius.length })
      },
    },
  },
})
