import { createFileRoute } from '@tanstack/react-router'
import { sendTemplateEmail } from '@/lib/email-templates/send-email'

export const Route = createFileRoute('/api/public/hooks/booking-pickup')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { booking_id } = (await request.json()) as { booking_id?: string }
          if (!booking_id) return new Response('booking_id required', { status: 400 })

          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

          const { data: booking, error } = await supabaseAdmin
            .from('bookings')
            .select('id, item_id, borrower_id, owner_id, agreed_deposit, agreed_rent_per_day, agreed_days, pickup_at')
            .eq('id', booking_id)
            .single()
          if (error || !booking) return new Response('not found', { status: 404 })

          const [{ data: item }, { data: borrowerAuth }, { data: ownerProfile }] = await Promise.all([
            supabaseAdmin.from('items').select('title').eq('id', booking.item_id).single(),
            supabaseAdmin.auth.admin.getUserById(booking.borrower_id),
            supabaseAdmin.from('profiles').select('display_name').eq('id', booking.owner_id).single(),
          ])

          const email = borrowerAuth?.user?.email
          if (!email) return new Response('no email', { status: 200 })

          await sendTemplateEmail('booking-pickup', email, {
            templateData: {
              itemTitle: item?.title ?? 'the item',
              ownerName: ownerProfile?.display_name ?? 'your neighbor',
              borrowerName: borrowerAuth?.user?.user_metadata?.display_name ?? 'neighbor',
              depositAmount: Number(booking.agreed_deposit ?? 0),
              rentPerDay: Number(booking.agreed_rent_per_day ?? 0),
              days: booking.agreed_days ?? 1,
              pickupAt: booking.pickup_at ? new Date(booking.pickup_at).toLocaleString() : 'today',
            },
            idempotencyKey: `booking-pickup-${booking.id}`,
          })

          return Response.json({ ok: true })
        } catch (e) {
          return new Response(`error: ${(e as Error).message}`, { status: 500 })
        }
      },
    },
  },
})
