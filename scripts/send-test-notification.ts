import { NotificationService } from '@/lib/notifications'

type Args = {
  email?: string
  phone?: string
  subject: string
  message: string
  channels: Array<'EMAIL' | 'SMS' | 'WHATSAPP'>
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    subject: 'Test notification Aigle Royale',
    message: 'Ceci est une notification de test.',
    channels: ['EMAIL'],
  }

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    const next = argv[i + 1]

    if (token === '--email' && next) {
      args.email = next.trim()
      i++
      continue
    }

    if (token === '--phone' && next) {
      args.phone = next.trim()
      i++
      continue
    }

    if (token === '--subject' && next) {
      args.subject = next.trim()
      i++
      continue
    }

    if (token === '--message' && next) {
      args.message = next.trim()
      i++
      continue
    }

    if (token === '--channels' && next) {
      const parsed = next
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter((c): c is 'EMAIL' | 'SMS' | 'WHATSAPP' => c === 'EMAIL' || c === 'SMS' || c === 'WHATSAPP')
      if (parsed.length > 0) {
        args.channels = parsed
      }
      i++
      continue
    }
  }

  return args
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!args.email && !args.phone) {
    console.error('Usage: npm run notify:test -- --email user@example.com [--phone +243...] [--channels EMAIL,SMS] [--subject "..."] [--message "..."]')
    process.exit(1)
  }

  const results: string[] = []

  if (args.channels.includes('EMAIL')) {
    if (!args.email) {
      results.push('EMAIL_SKIPPED=no --email provided')
    } else {
      try {
        await NotificationService.sendEmail({
          to: args.email,
          subject: args.subject,
          html: `<p>${args.message}</p>`,
          text: args.message,
        })
        results.push('EMAIL_OK=true')
      } catch (error) {
        results.push(`EMAIL_OK=false reason=${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  if (args.channels.includes('SMS')) {
    if (!args.phone) {
      results.push('SMS_SKIPPED=no --phone provided')
    } else {
      try {
        await NotificationService.sendSMS({
          to: args.phone,
          message: `${args.subject}: ${args.message}`.slice(0, 300),
        })
        results.push('SMS_OK=true')
      } catch (error) {
        results.push(`SMS_OK=false reason=${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  if (args.channels.includes('WHATSAPP')) {
    if (!args.phone) {
      results.push('WHATSAPP_SKIPPED=no --phone provided')
    } else {
      try {
        await NotificationService.sendWhatsApp({
          to: args.phone,
          message: `${args.subject}\n${args.message}`,
        })
        results.push('WHATSAPP_OK=true')
      } catch (error) {
        results.push(`WHATSAPP_OK=false reason=${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  console.log('NOTIFY_TEST_RESULT')
  for (const line of results) {
    console.log(line)
  }
}

main().catch((error) => {
  console.error('NOTIFY_TEST_ERROR', error)
  process.exit(1)
})
