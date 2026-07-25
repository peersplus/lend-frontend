import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { BrandHeader } from './BrandHeader'
import type { TemplateEntry } from './registry'

interface Props {
  title?: string
  description?: string
  requesterName?: string
  neighborhood?: string
  requestUrl?: string
}

const Email = ({
  title = 'A neighbor needs urgent help',
  description = '',
  requesterName = 'A nearby neighbor',
  neighborhood = 'your area',
  requestUrl = 'https://peers-help.lovable.app/requests',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>🚨 Urgent nearby: {title}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Section style={badge}>
          <Text style={badgeText}>🚨 URGENT NEARBY</Text>
        </Section>
        <Heading style={h1}>{title}</Heading>
        <Text style={meta}>
          From <strong>{requesterName}</strong> in {neighborhood}
        </Text>
        {description && <Text style={text}>{description}</Text>}
        <Button style={button} href={requestUrl}>
          Open the request
        </Button>
        <Text style={footer}>
          You're getting this because you're within your alert radius on Peers+Help.
          Adjust your radius or turn off email alerts in your settings.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `🚨 Urgent nearby: ${d.title ?? 'A neighbor needs help'}`,
  displayName: 'Urgent nearby request',
  previewData: {
    title: 'Wheelchair needed for visiting grandparent',
    description: 'My grandma just arrived and we need one for the weekend. Any help appreciated!',
    requesterName: 'David K.',
    neighborhood: 'Kalyani Nagar',
    requestUrl: 'https://peers-help.lovable.app/requests',
  },
} satisfies TemplateEntry

export default Email

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px' }
const badge = { marginBottom: '20px' }
const badgeText = {
  display: 'inline-block',
  backgroundColor: '#dc2626',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  padding: '6px 12px',
  borderRadius: '999px',
  margin: 0,
}
const h1 = {
  fontFamily: 'Georgia, "Instrument Serif", serif',
  fontStyle: 'italic' as const,
  fontSize: '28px',
  color: '#1c1917',
  margin: '0 0 8px',
  lineHeight: 1.2,
}
const meta = { fontSize: '13px', color: '#78716c', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#292524', lineHeight: 1.6, margin: '0 0 28px' }
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
const footer = { fontSize: '12px', color: '#a8a29e', margin: '32px 0 0', lineHeight: 1.5 }
