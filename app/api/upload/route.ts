import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/** Allowed MIME types for uploaded files */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
])

/** Maximum allowed file size: 5 MB */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

/** Map allowed MIME types to safe file extensions */
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Enforce size limit before reading full buffer
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Le fichier depasse la taille maximale autorisee (5 Mo)' },
        { status: 413 }
      )
    }

    // Validate MIME type declared by the browser
    const declaredType = file.type.toLowerCase()
    if (!ALLOWED_MIME_TYPES.has(declaredType)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorise. Formats acceptes : JPEG, PNG, GIF, WEBP, PDF' },
        { status: 415 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate magic bytes (file signature) to prevent MIME spoofing
    const magicMime = detectMimeFromBuffer(buffer)
    if (!magicMime || !ALLOWED_MIME_TYPES.has(magicMime)) {
      return NextResponse.json(
        { error: 'Le contenu du fichier ne correspond pas au type declare' },
        { status: 415 }
      )
    }

    // Use the detected extension - never trust the original filename extension
    const safeExt = MIME_TO_EXT[magicMime]
    const fileName = `${randomUUID()}.${safeExt}`
    const uploadsDir = join(process.cwd(), 'public', 'uploads')

    // Ensure the directory exists
    await mkdir(uploadsDir, { recursive: true })

    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    return NextResponse.json({ success: true, url: `/uploads/${fileName}` })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
  }
}

/**
 * Detect MIME type from the first bytes of a buffer (magic bytes check).
 * This prevents MIME type spoofing from malicious clients.
 */
function detectMimeFromBuffer(buf: Buffer): string | null {
  if (buf.length < 4) return null

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'

  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'

  // GIF: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif'

  // WEBP: RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'image/webp'

  // PDF: 25 50 44 46
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return 'application/pdf'

  return null
}
