import { createFileRoute } from '@tanstack/react-router'
import { sendTemplateEmail } from '@/lib/email-templates/send-email'

// Sends an email to the request owner when a neighbor offers help.
// Auth: same anon-key check as other public hooks.
export const Route = createFileRoute('/api/public/hooks/offer-created')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get('apikey') ?? ''
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? ''
        if (!expected || apikey !== expected) return new Response('Unauthorized', { status: 401 })

        let payload: { offer_id?: string }
        try { payload = await request.json() } catch { return new Response('Invalid JSON', { status: 400 }) }
        if (!payload.offer_id) return new Response('offer_id required', { status: 400 })

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        const { data: offer } = await supabaseAdmin
          .from('request_offers')
          .select('id, request_id, helper_id, note')
          .eq('id', payload.offer_id)
          .maybeSingle()
        if (!offer) return new Response('not found', { status: 404 })

        const [{ data: req }, { data: helperProfile }] = await Promise.all([
          supabaseAdmin.from('requests').select('id, title, owner_id, status').eq('id', offer.request_id).maybeSingle(),
          supabaseAdmin.from('profiles').select('display_name').eq('id', offer.helper_id).maybeSingle(),
        ])
        if (!req) return new Response('request not found', { status: 404 })

        const { data: ownerAuth } = await supabaseAdmin.auth.admin.getUserById(req.owner_id)
        const email = ownerAuth?.user?.email
        if (!email) return Response.json({ ok: true, skipped: 'no_email' })

        const chatUrl = new URL(
          `/chat/request/${req.id}/${offer.helper_id}`,
          new URL(request.url).origin,
        ).toString()

        // In-app inbox notification for the requester
        try {
          await supabaseAdmin.from('notifications').insert({
            recipient_id: req.owner_id,
            request_id: req.id,
            kind: 'offer_received',
            title: `🤝 ${helperProfile?.display_name ?? 'A neighbor'} offered to help`,
            body: `On your request: ${req.title}`,
          })
        } catch (e) {
          console.error('offer notification insert failed', e)
        }

        try {
          await sendTemplateEmail('offer-received', email, {
            idempotencyKey: `offer-${offer.id}`,
            templateData: {
              requestTitle: req.title,
              helperName: helperProfile?.display_name ?? 'A neighbor',
              helperNote: offer.note ?? '',
              chatUrl,
            },
          })
        } catch (e) {
          console.error('offer-received email failed', e)
        }
        return Response.json({ ok: true })
      },
    },
  },
})
