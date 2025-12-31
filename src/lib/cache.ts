interface CacheOptions {
  ttl?: number
  cacheControl?: string
}

export async function getCachedResponse(
  cacheKey: string,
  kvNamespace?: KVNamespace,
  kvKey?: string
): Promise<Response | null> {
  const cache = caches.default
  const request = new Request(`https://cache/${cacheKey}`)

  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  if (kvNamespace && kvKey) {
    const kvCached = await kvNamespace.get(kvKey)
    if (kvCached) {
      const response = new Response(kvCached, {
        headers: { 'Content-Type': 'text/html' },
      })
      await cache.put(request, response.clone())
      return response
    }
  }

  return null
}

export async function setCachedResponse(
  cacheKey: string,
  response: Response,
  options: CacheOptions = {},
  kvNamespace?: KVNamespace,
  kvKey?: string
): Promise<void> {
  const cache = caches.default
  const request = new Request(`https://cache/${cacheKey}`)

  const cacheControl = options.cacheControl || `public, max-age=${options.ttl || 3600}`
  const clonedResponse = new Response(response.body, {
    ...response,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'Cache-Control': cacheControl,
    },
  })

  await cache.put(request, clonedResponse.clone())

  if (kvNamespace && kvKey && options.ttl) {
    const body = await response.clone().text()
    await kvNamespace.put(kvKey, body, { expirationTtl: options.ttl })
  }
}
