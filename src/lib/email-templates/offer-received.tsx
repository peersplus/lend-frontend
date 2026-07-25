import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import { BrandHeader } from './BrandHeader'
import type { TemplateEntry } from './registry'

interface Props {
  requestTitle?: string
  helperName?: string
  helperNote?: string
  chatUrl?: string
}

const Email = ({
  requestTitle = 'your request',
  helperName = 'A neighbor',
  helperNote = '',
  chatUrl = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{helperName} offered to help with {requestTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>🤝 A neighbor stepped up</Heading>
        <Text style={text}>
          <strong>{helperName}</strong> just offered to help with <strong>{requestTitle}</strong>.
        </Text>
        {helperNote && (
          <Section style={box}><Text style={row}>"{helperNote}"</Text></Section>
        )}
        {chatUrl && (
          <Text style={text}>
            Open the chat to coordinate: <a href={chatUrl} style={{ color: '#2f855a' }}>{chatUrl}</a>
          </Text>
        )}
        <Text style={footer}>
          Peers+Help is a free community platform — we help you connect, but all communication and exchange happen directly between neighbors.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `${d.helperName ?? 'A neighbor'} can help with ${d.requestTitle ?? 'your request'}`,
  displayName: 'Offer received',
  previewData: { requestTitle: 'Wheelchair for the weekend', helperName: 'Priya S.', helperNote: 'I have one you can borrow!', chatUrl: 'https://example.com/chat' },
} satisfies TemplateEntry

export default Email

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', color: '#1c1917', margin: '0 0 12px', fontWeight: 700 }
const text = { fontSize: '15px', color: '#292524', lineHeight: 1.6, margin: '0 0 16px' }
const box = { backgroundColor: '#f5f4f0', borderRadius: '12px', padding: '14px 18px', margin: '12px 0' }
const row = { fontSize: '14px', color: '#292524', margin: 0, fontStyle: 'italic' as const }
const footer = { fontSize: '12px', color: '#a8a29e', margin: '28px 0 0' }
