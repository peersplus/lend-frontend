import * as React from 'react'
import {
  Body,
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
import { BrandHeader } from './BrandHeader'

interface Props {
  itemTitle?: string
  ownerName?: string
  borrowerName?: string
  depositAmount?: number
  rentPerDay?: number
  days?: number
  pickupAt?: string
}

const Email = ({
  itemTitle = 'the item',
  ownerName = 'your neighbor',
  borrowerName = 'you',
  depositAmount = 0,
  rentPerDay = 0,
  days = 1,
  pickupAt = 'today',
}: Props) => {
  const rentTotal = (rentPerDay || 0) * (days || 1)
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Pickup confirmed for {itemTitle} — please read the return terms</Preview>
      <Body style={main}>
        <Container style={container}>
        <BrandHeader />
          <Heading style={h1}>Pickup confirmed</Heading>
          <Text style={text}>
            Hi {borrowerName}, you're picking up <strong>{itemTitle}</strong> from{' '}
            <strong>{ownerName}</strong> on {pickupAt}.
          </Text>

          <Section style={box}>
            <Text style={row}><strong>Rent:</strong> ${rentPerDay}/day × {days} day(s) = <strong>${rentTotal}</strong> (cash on return)</Text>
            <Text style={row}><strong>Replacement value:</strong> ${depositAmount}</Text>
          </Section>

          <Hr style={hr} />

          <Heading style={h2}>Please read carefully</Heading>
          <Text style={text}>
            By accepting this pickup you agree that if the item comes back with any defect,
            damage or missing parts, you will pay the <strong>full replacement value of ${depositAmount}</strong>{' '}
            to the owner in cash at the time of return.
          </Text>
          <Text style={textSmall}>
            You already accepted these terms in the app. Keeping this email as your record.
          </Text>

          <Text style={footer}>
            Peers+Help — neighbors sharing, saving money, reducing waste.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Pickup confirmed: ${d.itemTitle ?? 'your borrowed item'}`,
  displayName: 'Booking pickup confirmation',
  previewData: {
    itemTitle: 'Extension ladder',
    ownerName: 'Priya S.',
    borrowerName: 'Alex',
    depositAmount: 180,
    rentPerDay: 5,
    days: 2,
    pickupAt: 'Sat, 2:00pm',
  },
} satisfies TemplateEntry

export default Email

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px' }
const h1 = { fontSize: '26px', color: '#1c1917', margin: '0 0 12px', fontWeight: 700 }
const h2 = { fontSize: '18px', color: '#1c1917', margin: '0 0 8px', fontWeight: 700 }
const text = { fontSize: '15px', color: '#292524', lineHeight: 1.6, margin: '0 0 16px' }
const textSmall = { fontSize: '13px', color: '#57534e', lineHeight: 1.5, margin: '0 0 20px' }
const box = { backgroundColor: '#f5f4f0', borderRadius: '12px', padding: '16px 20px', margin: '16px 0' }
const row = { fontSize: '14px', color: '#292524', margin: '4px 0' }
const hr = { borderColor: '#e7e5e4', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#a8a29e', margin: '28px 0 0' }
