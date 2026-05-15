export async function onRequestError(
  err: Error,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string }
) {
  console.error('[Server error]', {
    message: err.message,
    digest: (err as Error & { digest?: string }).digest,
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routerKind: context.routerKind,
  })
}
