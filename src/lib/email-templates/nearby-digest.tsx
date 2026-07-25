import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Item {
  title: string
  category?: string
  urgency?: 'normal' | 'urgent'
  neighborhood?: string
  description?: string
}

interface Props {
  recipientName?: string
  count?: number
  items?: Item[]
  feedUrl?: string
}

const Email = ({
  recipientName = 'Neighbor',
  count = 0,
  items = [],
  feedUrl = 'https://peers-help.lovable.app/requests',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{count} nearby request{count === 1 ? '' : 's'} from your neighbors</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your neighborhood, today</Heading>
        <Text style={text}>
          Hi {recipientName}, here's what your neighbors on Peers+Help asked for in the
          last 24 hours.
        </Text>

        {items.length === 0 ? (
          <Text style={muted}>No new requests in your radius today. 🌿</Text>
        ) : (
          items.map((it, i) => (
            <Section key={i} style={card}>
              <Text style={cardTag}>
                {it.urgency === 'urgent' ? '🚨 Urgent' : '•'} {it.category ?? 'Request'}
                {it.neighborhood ? ` — ${it.neighborhood}` : ''}
              </Text>
              <Text style={cardTitle}>{it.title}</Text>
              {it.description && <Text style={cardDesc}>{it.description}</Text>}
            </Section>
          ))
        )}

        <Hr style={hr} />
        <Button style={button} href={feedUrl}>
          Open the request feed
        </Button>
        <Text style={footer}>
          You get this daily digest because email alerts are on. You can turn it
          off any time in your settings.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `${d.count ?? 0} nearby request${(d.count ?? 0) === 1 ? '' : 's'} today on Peers+Help`,
  displayName: 'Daily neighborhood digest',
  previewData: {
    recipientName: 'Priya',
    count: 3,
    items: [
      { title: 'Cordless drill for weekend project', category: 'Tools', neighborhood: 'Kalyani Nagar' },
      { title: 'Wheelchair for visiting grandparent', category: 'Medical', urgency: 'urgent', neighborhood: 'Kalyani Nagar' },
      { title: 'Portable speaker for a birthday party', category: 'Party', neighborhood: 'Koregaon Park' },
    ],
  },
} satisfies TemplateEntry

export default Email

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px' }
const h1 = {
  fontFamily: 'Georgia, "Instrument Serif", serif',
  fontStyle: 'italic' as const,
  fontSize: '28px',
  color: '#1c1917',
  margin: '0 0 8px',
  lineHeight: 1.2,
}
const text = { fontSize: '15px', color: '#292524', lineHeight: 1.6, margin: '0 0 20px' }
const muted = { fontSize: '14px', color: '#78716c', margin: '20px 0' }
const card = {
  border: '1px solid #e7e5e4',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '0 0 12px',
}
const cardTag = { fontSize: '11px', color: '#78716c', margin: '0 0 4px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const cardTitle = { fontSize: '15px', color: '#1c1917', fontWeight: 600, margin: '0 0 4px' }
const cardDesc = { fontSize: '13px', color: '#57534e', margin: 0, lineHeight: 1.5 }
const hr = { borderColor: '#e7e5e4', margin: '24px 0' }
const button = {
  backgroundColor: '#4d7c3a',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600,
  borderRadius: '8px',
  padding: '12px 22px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#a8a29e', margin: '28px 0 0', lineHeight: 1.5 }
