require('dotenv').config()
const nodemailer = require('nodemailer')

function env(name) {
  return (process.env[name] || '').trim()
}

async function testSmtp() {
  const host = env('SMTP_HOST')
  const port = Number.parseInt(env('SMTP_PORT') || '587', 10)
  const user = env('SMTP_USER')
  const pass = env('SMTP_PASS')
  const fromEmail = env('SMTP_FROM_EMAIL') || env('BREVO_SENDER_EMAIL')
  const secureRaw = env('SMTP_SECURE').toLowerCase()
  const secure = secureRaw === 'true' || secureRaw === '1' || secureRaw === 'yes'

  if (!host || !port || !user || !pass || !fromEmail) {
    return {
      ready: false,
      ok: false,
      message: 'Missing SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM_EMAIL',
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    })

    await transporter.verify()
    return { ready: true, ok: true, message: 'SMTP authentication verified' }
  } catch (error) {
    return {
      ready: true,
      ok: false,
      message: error && error.message ? error.message : String(error),
    }
  }
}

async function testBrevoApi() {
  const apiKey = env('BREVO_API_KEY')
  if (!apiKey) {
    return {
      ready: false,
      ok: false,
      status: 0,
      message: 'BREVO_API_KEY is empty',
    }
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/account', {
      headers: {
        'api-key': apiKey,
        Accept: 'application/json',
      },
    })

    const raw = await response.text()
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = { raw: raw.slice(0, 200) }
    }

    const message = parsed.message || parsed.code || 'OK'
    return {
      ready: true,
      ok: response.ok,
      status: response.status,
      message,
    }
  } catch (error) {
    return {
      ready: true,
      ok: false,
      status: 0,
      message: error && error.message ? error.message : String(error),
    }
  }
}

async function main() {
  const smtp = await testSmtp()
  const api = await testBrevoApi()

  console.log('=== Brevo Health Check ===')
  console.log(`SMTP_READY=${smtp.ready}`)
  console.log(`SMTP_OK=${smtp.ok}`)
  console.log(`SMTP_MESSAGE=${smtp.message}`)
  console.log(`BREVO_API_READY=${api.ready}`)
  console.log(`BREVO_API_OK=${api.ok}`)
  console.log(`BREVO_API_STATUS=${api.status}`)
  console.log(`BREVO_API_MESSAGE=${api.message}`)

  if (!smtp.ok) {
    process.exitCode = 1
  }
  if (api.ready && !api.ok) {
    process.exitCode = 1
  }
}

main()
