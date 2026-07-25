import * as React from 'react'
import { Img, Section, Link } from '@react-email/components'
import { LOGO_ABSOLUTE_URL, SITE_URL } from '@/lib/brand'

/** Shared brand header rendered at the top of every email. */
export const BrandHeader = () => (
  <Section style={{ padding: '0 0 20px', textAlign: 'center' as const }}>
    <Link href={SITE_URL}>
      <Img
        src={LOGO_ABSOLUTE_URL}
        alt="Peers Plus"
        width="180"
        height="55"
        style={{ display: 'inline-block', border: 0, outline: 'none', textDecoration: 'none' }}
      />
    </Link>
  </Section>
)

export default BrandHeader
