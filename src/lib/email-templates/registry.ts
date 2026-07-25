import type { ComponentType } from 'react'
import { template as nearbyUrgent } from './nearby-urgent'
import { template as nearbyDigest } from './nearby-digest'
import { template as bookingPickup } from './booking-pickup'
import { template as offerReceived } from './offer-received'
import { template as requestUpdated } from './request-updated'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/** Template registry — maps template names to their React Email components. */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'nearby-urgent': nearbyUrgent,
  'nearby-digest': nearbyDigest,
  'booking-pickup': bookingPickup,
  'offer-received': offerReceived,
  'request-updated': requestUpdated,
}
