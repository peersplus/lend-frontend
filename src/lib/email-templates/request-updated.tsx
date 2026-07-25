import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BrandHeader } from './BrandHeader'

interface Props {
  requestTitle?: string
  statusLabel?: string
  ownerName?: string
  requestUrl?: string
}

const Email = ({
  requestTitle = 'a neighbor request',
  statusLabel = 'updated',
  ownerName = 'Your neighbor',
  requestUrl = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{requestTitle} was {statusLabel}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>📣 Request update</Heading>
        <Text style={text}>
          <strong>{ownerName}</strong>'s request <strong>{requestTitle}</strong> was <strong>{statusLabel}</strong>.
        </Text>
        {requestUrl && (
          <Text style={text}>
            View it here: <a href={requestUrl} style={{ color: '#2f855a' }}>{requestUrl}</a>
          </Text>
        )}
        <Text style={footer}>
          You're getting this because you offered to help. Peers+Help is a free community platform.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Request ${d.statusLabel ?? 'updated'}: ${d.requestTitle ?? ''}`.trim(),
  displayName: 'Request updated',
  previewData: { requestTitle: 'Wheelchair for the weekend', statusLabel: 'closed', ownerName: 'Asha' },
} satisfies TemplateEntry

export default Email

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', color: '#1c1917', margin: '0 0 12px', fontWeight: 700 }
const text = { fontSize: '15px', color: '#292524', lineHeight: 1.6, margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#a8a29e', margin: '28px 0 0' }
