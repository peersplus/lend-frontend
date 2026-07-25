import * as React from 'react'
import { render } from '@react-email/render'
import nodemailer from 'nodemailer'
import { TEMPLATES } from './registry'

// Configuration baked in at scaffold time
const SITE_NAME = "Peers Plus Lend Locally"
const FROM_DOMAIN = "notify.tottalesapp.com"

export type SendTemplateEmailResult = { sent: true }

export interface SendTemplateEmailOptions {
  templateData?: Record<string, any>
  /** Dedupes retries of the same logical send; defaults to a random UUID (no dedupe). */
  idempotencyKey?: string
  replyTo?: string
}

function getMailtrapTransport() {
  const host = process.env.MAIL_TRAP_SMTP_HOST
  const port = Number(process.env.MAIL_TRAP_SMTP_PORT ?? 2525)
  const user = process.env.MAIL_TRAP_SMTP_USER
  const pass = process.env.MAIL_TRAP_SMTP_PASSWORD

  if (!host || !user || !pass) {
    throw new Error('Mailtrap SMTP configuration is missing')
  }

  return nodemailer.createTransport({
    host,
    port,
    auth: { user, pass },
    secure: false,
  })
}

export async function sendTemplateEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {}
): Promise<SendTemplateEmailResult> {
  
  console.log('sendTemplateEmail called with:', { templateName, to, options })
  const template = TEMPLATES[templateName]
  if (!template) {
    throw new Error(
      `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`
    )
  }

  const recipient = template.to || to
  if (!recipient) {
    throw new Error('Recipient is required (the template defines no fixed recipient)')
  }

  const templateData = options.templateData ?? {}
  const element = React.createElement(template.component, templateData)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject =
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject

  const transporter = getMailtrapTransport()

  await transporter.sendMail({
    to: recipient,
    from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
    subject,
    html,
    text,
    replyTo: options.replyTo,
  })

  return { sent: true }
}
