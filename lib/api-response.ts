import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

/**
 * Standard API response helpers.
 * Provides consistent JSON response shape across all API routes.
 */

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function apiError(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { error: message, ...(details !== undefined && { details }) },
    { status }
  )
}

export function apiUnauthorized(message = 'Non authentifié') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function apiForbidden(message = 'Accès non autorisé') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function apiNotFound(message = 'Ressource introuvable') {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function apiValidationError(err: ZodError) {
  const details = err.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }))
  return NextResponse.json(
    { error: 'Données invalides', details },
    { status: 422 }
  )
}

export function apiServerError(error: unknown) {
  const message =
    error instanceof Error ? error.message : 'Une erreur technique est survenue'
  console.error('[API Error]', error)
  return NextResponse.json({ error: message }, { status: 500 })
}
