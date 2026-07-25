import { createFileRoute } from '@tanstack/react-router'
import { sendTemplateEmail } from '@/lib/email-templates/send-email'

// Fires when a new item is listed. Notifies nearby neighbors by email (opt-in).
// The in-app notification fan-out is done directly by the Postgres trigger.
export const Route = createFileRoute('/api/public/hooks/notify-item')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get('apikey') ?? ''
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? ''
        if (!expected || apikey !== expected) {
          return new Response('Unauthorized', { status: 401 })
        }

        let payload: { item_id?: string }
        try {
          payload = await request.json()
        } catch {
          return new Response('Invalid JSON', { status: 400 })
        }
        if (!payload.item_id) return new Response('item_id required', { status: 400 })

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        const { data: item, error } = await supabaseAdmin
          .from('items')
          .select('id, owner_id, title, description, category, lat, lng, price_mode')
          .eq('id', payload.item_id)
          .maybeSingle()
        if (error || !item) return new Response('Not found', { status: 404 })

        const { data: owner } = await supabaseAdmin
          .from('profiles')
          .select('display_name')
          .eq('id', item.owner_id)
          .maybeSingle()

        const { data: recipients } = await supabaseAdmin
          .from('profiles')
          .select('id, email_enabled, lat, lng, radius_km')
          .neq('id', item.owner_id)
          .eq('email_enabled', true)
          .limit(2000)

        const inRadius = (recipients ?? []).filter((p) => {
          if (item.lat == null || item.lng == null || p.lat == null || p.lng == null) return true
          const r = p.radius_km ?? 5
          const km =
            6371 *
            Math.sqrt(
              Math.pow(((p.lat - item.lat) * Math.PI) / 180, 2) +
                Math.pow(
                  (((p.lng - item.lng) * Math.PI) / 180) *
                    Math.cos((((p.lat + item.lat) / 2) * Math.PI) / 180),
                  2,
                ),
            )
          return km <= r
        })

        const itemsUrl = new URL('/items', new URL(request.url).origin).toString()

        let sent = 0
        for (const p of inRadius) {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(p.id)
          const email = authUser?.user?.email
          if (!email) continue
          try {
            const res = await sendTemplateEmail('request-updated', email, {
              idempotencyKey: `new-item-${item.id}-${p.id}`,
              templateData: {
                requestTitle: item.title,
                statusLabel: 'newly listed',
                ownerName: owner?.display_name ?? 'A nearby neighbor',
                requestUrl: itemsUrl,
              },
            })
            if (res.sent) sent++
          } catch (e) {
            console.error('notify-item send failed', p.id, e)
          }
        }

        return Response.json({ ok: true, sent, considered: inRadius.length })
      },
    },
  },
})
