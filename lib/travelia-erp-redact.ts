/** Masque les secrets dans du texte ou JSON sérialisé (logs, colonnes response). */
export function redactSecrets(text: string): string {
  if (!text) return text
  let out = text
  out = out.replace(/Bearer\s+[^\s"'\\]+/gi, 'Bearer ***')
  out = out.replace(/"authorization"\s*:\s*"Bearer[^"]*"/gi, '"authorization":"Bearer ***"')
  out = out.replace(/ERP_API_KEY[=:]\s*[^\s&]+/gi, 'ERP_API_KEY=***')
  out = out.replace(/"ERP_API_KEY"\s*:\s*"[^"]*"/gi, '"ERP_API_KEY":"***"')
  out = out.replace(/TRAVELIA_INTERNAL_SYNC_API_KEY[=:]\s*[^\s&]+/gi, 'TRAVELIA_INTERNAL_SYNC_API_KEY=***')
  out = out.replace(/"apiKey"\s*:\s*"[^"]*"/gi, '"apiKey":"***"')
  return out
}

export function redactObjectForLog(value: unknown): string {
  try {
    return redactSecrets(JSON.stringify(value))
  } catch {
    return redactSecrets(String(value))
  }
}
