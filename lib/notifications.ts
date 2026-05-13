import { getBrevoConfig, isBrevoEmailReady, isBrevoSmsReady, type BrevoRuntimeConfig } from '@/lib/brevo-config'
import nodemailer from 'nodemailer'

export type EmailOptions = {
    to: string
    subject: string
    html: string
    text?: string
}

export type SMSOptions = {
    to: string
    message: string
}

export type WhatsAppOptions = {
    to: string
    message: string
}

type SmtpRuntimeConfig = {
    host: string
    port: number
    user: string
    pass: string
    fromEmail: string
    fromName: string
    secure: boolean
}

function getSmtpConfigFromEnv(): SmtpRuntimeConfig {
    const portRaw = process.env.SMTP_PORT || '587'
    const port = Number.parseInt(portRaw, 10)
    const secureRaw = (process.env.SMTP_SECURE || '').toLowerCase()

    return {
        host: process.env.SMTP_HOST || '',
        port: Number.isFinite(port) ? port : 587,
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        fromEmail: process.env.SMTP_FROM_EMAIL || process.env.BREVO_SENDER_EMAIL || '',
        fromName: process.env.SMTP_FROM_NAME || process.env.BREVO_SENDER_NAME || 'Aigle Royale',
        secure: secureRaw === 'true' || secureRaw === '1' || secureRaw === 'yes',
    }
}

function isSmtpReady(config: SmtpRuntimeConfig) {
    return Boolean(config.host && config.port > 0 && config.user && config.pass && config.fromEmail)
}

function normalizePhoneToE164(value: string) {
    const stripped = value.trim().replace(/[\s().-]/g, '')
    if (stripped.startsWith('+')) {
        return stripped
    }
    if (stripped.startsWith('00')) {
        return `+${stripped.slice(2)}`
    }
    return stripped
}

function isValidE164(value: string) {
    return /^\+[1-9]\d{6,14}$/.test(value)
}

async function sendEmailViaSmtp({ to, subject, html, text }: EmailOptions, cfg: SmtpRuntimeConfig) {
    const transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: {
            user: cfg.user,
            pass: cfg.pass,
        },
    })

    const result = await transporter.sendMail({
        from: `${cfg.fromName} <${cfg.fromEmail}>`,
        to,
        subject,
        html,
        ...(text ? { text } : {}),
    })

    return { success: true as const, messageId: result.messageId }
}

async function sendEmailViaBrevo({ to, subject, html, text }: EmailOptions, cfg: BrevoRuntimeConfig) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': cfg.apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            sender: { name: cfg.senderName, email: cfg.senderEmail },
            to: [{ email: to }],
            subject,
            htmlContent: html,
            ...(text ? { textContent: text } : {}),
        }),
    })

    if (!response.ok) {
        const detail = await response.text()
        throw new Error(`Brevo email HTTP ${response.status}: ${detail}`)
    }

    return { success: true as const }
}

async function sendSmsViaBrevo({ to, message }: SMSOptions, cfg: BrevoRuntimeConfig) {
    const normalizedTo = normalizePhoneToE164(to)
    if (!isValidE164(normalizedTo)) {
        throw new Error(`Numéro SMS invalide (E.164 attendu): ${to}`)
    }

    if (message.length > 160) {
        console.warn(`[SMS] Message tronqué de ${message.length} à 160 caractères pour ${normalizedTo}`)
    }

    const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
        method: 'POST',
        headers: {
            'api-key': cfg.apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            sender: cfg.smsSender.slice(0, 11),
            recipient: normalizedTo,
            content: message.slice(0, 160),
            type: 'transactional',
        }),
    })

    if (!response.ok) {
        const detail = await response.text()
        throw new Error(`Brevo SMS HTTP ${response.status}: ${detail}`)
    }

    return { success: true as const }
}

/**
 * Service d'envoi : mock par défaut.
 * Brevo : paramètres dans l'admin (`/admin/notifications/brevo`) ou variables d'environnement.
 * WhatsApp : mock (autre fournisseur à brancher si besoin).
 */
export const NotificationService = {
    sendEmail: async (options: EmailOptions) => {
        const smtpCfg = getSmtpConfigFromEnv()
        if (isSmtpReady(smtpCfg)) {
            try {
                return await sendEmailViaSmtp(options, smtpCfg)
            } catch (smtpError) {
                console.error('[EMAIL] SMTP failed, attempting Brevo API fallback:', smtpError)
            }
        }

        const cfg = await getBrevoConfig()
        if (isBrevoEmailReady(cfg)) {
            return sendEmailViaBrevo(options, cfg)
        }
        console.log(`
      [MOCK EMAIL]
      To: ${options.to}
      Subject: ${options.subject}
      Body: ${options.html.substring(0, 50)}...
      -----------------------------
    `)
        await new Promise((resolve) => setTimeout(resolve, 100))
        return { success: true }
    },

    sendSMS: async (options: SMSOptions) => {
        const cfg = await getBrevoConfig()
        if (isBrevoSmsReady(cfg)) {
            return sendSmsViaBrevo(options, cfg)
        }
        console.log(`
      [MOCK SMS]
      To: ${options.to}
      Message: ${options.message}
      -----------------------------
    `)
        await new Promise((resolve) => setTimeout(resolve, 100))
        return { success: true }
    },

    sendWhatsApp: async ({ to, message }: WhatsAppOptions) => {
        console.log(`
      [MOCK WHATSAPP]
      To: ${to}
      Message: ${message}
      (Configurez un fournisseur WhatsApp Business si besoin; Brevo ne remplace pas ce canal ici.)
      -----------------------------
    `)
        await new Promise((resolve) => setTimeout(resolve, 100))
        return { success: true }
    },

    /**
     * Helper to format generic templates
     */
    templates: {
        bookingConfirmation: (booking: any, ticketNumber: string) => {
            return {
                subject: `Confirmation réservation - Ticket #${ticketNumber}`,
                html: `<p>Bonjour ${booking.passengerName},</p>
               <p>Votre réservation pour le trajet vers ${booking.trip?.route?.destination} est confirmée.</p>
               <p><strong>Ticket:</strong> ${ticketNumber}</p>
               <p>Veuillez procéder au paiement pour valider votre place.</p>`,
                sms: `Aigle Royal: Réservation confirmée Ticket #${ticketNumber}. Payez pour valider.`,
            }
        },
        paymentConfirmation: (booking: any, ticketNumber: string) => {
            return {
                subject: `Billet Confirmé - Ticket #${ticketNumber}`,
                html: `<p>Paiement reçu !</p>
               <p>Votre billet #${ticketNumber} est validé.</p>
               <p>Bon voyage avec Aigle Royal.</p>`,
                sms: `Aigle Royal: Paiement reçu. Billet #${ticketNumber} validé. Bon voyage !`,
            }
        },
        tripDelay: (trip: any, delayInfo: string) => {
            return {
                subject: `Information importante : Retard sur votre voyage`,
                html: `<p>Votre bus prévu pour ${new Date(trip.departureTime).toLocaleString('fr-FR')} a du retard.</p>
               <p>Info: ${delayInfo}</p>`,
                sms: `Aigle Royal: Retard sur votre bus de ${new Date(trip.departureTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Info: ${delayInfo}`,
            }
        }
    }
}
