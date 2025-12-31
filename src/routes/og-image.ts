import { Hono } from 'hono'
import { parseMarkdown } from '../lib/markdown'

const ogImage = new Hono<{
  Bindings: {
    CONTENT_BUCKET: R2Bucket
    CACHE_KV: KVNamespace
  }
}>()

function generateOGImageSVG(title: string, description: string): string {
  const titleLines = wrapText(title, 35)
  const descLines = wrapText(description, 60)

  return `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#grad)" />
      <text x="60" y="150" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="white">
        ${titleLines.map((line, i) => `<tspan x="60" dy="${i === 0 ? 0 : 80}">${escapeXml(line)}</tspan>`).join('')}
      </text>
      <text x="60" y="${200 + titleLines.length * 80}" font-family="Arial, sans-serif" font-size="32" fill="rgba(255,255,255,0.9)">
        ${descLines.slice(0, 2).map((line, i) => `<tspan x="60" dy="${i === 0 ? 0 : 40}">${escapeXml(line)}</tspan>`).join('')}
      </text>
      <text x="60" y="580" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.8)">
        mmhamigaki.com
      </text>
    </svg>
  `.trim()
}

function wrapText(text: string, maxLength: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if ((currentLine + word).length <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)

  return lines
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

ogImage.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const cacheKey = `og:${slug}`

  const cache = caches.default
  const request = new Request(`https://cache/${cacheKey}`)
  const cached = await cache.match(request)

  if (cached) {
    return cached
  }

  const metadataKey = `metadata:${slug}`
  let metadata = await c.env.CACHE_KV.get(metadataKey)

  if (!metadata) {
    const object = await c.env.CONTENT_BUCKET.get(`posts/${slug}.md`)
    if (!object) {
      return c.notFound()
    }

    const content = await object.text()
    const parsed = await parseMarkdown(content)
    metadata = JSON.stringify(parsed.metadata)

    await c.env.CACHE_KV.put(metadataKey, metadata, { expirationTtl: 86400 })
  }

  const { title, description } = JSON.parse(metadata)
  const svg = generateOGImageSVG(title, description || '')

  const response = new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  })

  c.executionCtx.waitUntil(cache.put(request, response.clone()))

  return response
})

export default ogImage
