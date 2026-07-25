import { createFileRoute } from '@tanstack/react-router'
import { sendTemplateEmail } from '@/lib/email-templates/send-email'

// Called daily by pg_cron. For every user with email alerts on, aggregates
// nearby requests from the last 24h and sends a single digest.
export const Route = createFileRoute('/api/public/hooks/daily-digest')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get('apikey') ?? ''
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? ''
        if (!expected || apikey !== expected) {
          return new Response('Unauthorized', { status: 401 })
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data: recentRequests } = await supabaseAdmin
          .from('requests')
          .select('id, owner_id, title, description, urgency, category, lat, lng, radius_km, created_at')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(500)

        const requests = recentRequests ?? []
        if (requests.length === 0) {
          return Response.json({ ok: true, sent: 0, reason: 'no_recent_requests' })
        }

        // Owner neighborhoods for pretty labels.
        const ownerIds = Array.from(new Set(requests.map((r) => r.owner_id)))
        const { data: owners } = await supabaseAdmin
          .from('profiles')
          .select('id, neighborhood')
          .in('id', ownerIds)
        const ownerMap = new Map((owners ?? []).map((o) => [o.id, o.neighborhood]))

        const { data: recipients } = await supabaseAdmin
          .from('profiles')
          .select('id, display_name, email_enabled, lat, lng, radius_km')
          .eq('email_enabled', true)
          .limit(5000)

        const feedUrl = new URL('/requests', new URL(request.url).origin).toString()
        let sent = 0

        for (const p of recipients ?? []) {
          const nearby = requests.filter((req) => {
            if (req.owner_id === p.id) return false
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
          if (nearby.length === 0) continue

          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(p.id)
          const email = authUser?.user?.email
          if (!email) continue

          try {
            const res = await sendTemplateEmail('nearby-digest', email, {
              idempotencyKey: `digest-${p.id}-${since.slice(0, 10)}`,
              templateData: {
                recipientName: p.display_name ?? 'Neighbor',
                count: nearby.length,
                items: nearby.slice(0, 8).map((n) => ({
                  title: n.title,
                  category: n.category,
                  urgency: n.urgency,
                  neighborhood: ownerMap.get(n.owner_id) ?? '',
                  description: n.description ?? '',
                })),
                feedUrl,
              },
            })
            if (res.sent) sent++
          } catch (e) {
            console.error('digest send failed', p.id, e)
          }
        }

        return Response.json({ ok: true, sent, recipients: recipients?.length ?? 0 })
      },
    },
  },
})
