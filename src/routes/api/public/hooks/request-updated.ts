import { createFileRoute } from '@tanstack/react-router'
import { sendTemplateEmail } from '@/lib/email-templates/send-email'

// Notifies helpers who offered on a request when the request is updated
// (status change: closed / reopened / deleted). In-app + email fan-out.
export const Route = createFileRoute('/api/public/hooks/request-updated')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get('apikey') ?? ''
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? ''
        if (!expected || apikey !== expected) return new Response('Unauthorized', { status: 401 })

        let payload: { request_id?: string; status?: string; title?: string; owner_id?: string }
        try { payload = await request.json() } catch { return new Response('Invalid JSON', { status: 400 }) }
        const { request_id, status } = payload
        if (!request_id || !status) return new Response('request_id and status required', { status: 400 })

        const statusLabel =
          status === 'closed' ? 'closed'
          : status === 'open' ? 'reopened'
          : status === 'deleted' ? 'deleted'
          : status

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        // Resolve title/owner if the request still exists; fall back to payload for deletes.
        let title = payload.title ?? 'a neighbor request'
        let ownerId = payload.owner_id ?? ''
        if (status !== 'deleted') {
          const { data: r } = await supabaseAdmin
            .from('requests').select('title, owner_id').eq('id', request_id).maybeSingle()
          if (r) { title = r.title; ownerId = r.owner_id }
        }
        const { data: ownerProfile } = ownerId
          ? await supabaseAdmin.from('profiles').select('display_name').eq('id', ownerId).maybeSingle()
          : { data: null as { display_name: string | null } | null }

        const { data: offers } = await supabaseAdmin
          .from('request_offers').select('helper_id').eq('request_id', request_id)
        const helperIds = Array.from(new Set((offers ?? []).map((o) => o.helper_id)))
        if (helperIds.length === 0) return Response.json({ ok: true, recipients: 0 })

        // In-app notifications
        try {
          await supabaseAdmin.from('notifications').insert(
            helperIds.map((hid) => ({
              recipient_id: hid,
              request_id,
              kind: 'request_updated',
              title: `📣 Request ${statusLabel}: ${title}`,
              body: `${ownerProfile?.display_name ?? 'A neighbor'} ${statusLabel} their request.`,
            }))
          )
        } catch (e) { console.error('request-updated notif insert failed', e) }

        // Email fan-out
        const requestUrl = new URL('/requests', new URL(request.url).origin).toString()
        for (const hid of helperIds) {
          const { data: auth } = await supabaseAdmin.auth.admin.getUserById(hid)
          const email = auth?.user?.email
          if (!email) continue
          try {
            await sendTemplateEmail('request-updated', email, {
              idempotencyKey: `req-upd-${request_id}-${status}-${hid}`,
              templateData: {
                requestTitle: title,
                statusLabel,
                ownerName: ownerProfile?.display_name ?? 'Your neighbor',
                requestUrl,
              },
            })
          } catch (e) { console.error('request-updated email failed', e) }
        }

        return Response.json({ ok: true, recipients: helperIds.length })
      },
    },
  },
})
