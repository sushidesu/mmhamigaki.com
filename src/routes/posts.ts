import { Hono } from 'hono'
import { parseMarkdown } from '../lib/markdown'
import { renderPostPage } from '../lib/templates'
import { getCachedResponse, setCachedResponse } from '../lib/cache'

const posts = new Hono<{
  Bindings: {
    CONTENT_BUCKET: R2Bucket
    CACHE_KV: KVNamespace
  }
}>()

posts.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const cacheKey = `post:${slug}`
  const kvKey = `post:html:${slug}`

  const cached = await getCachedResponse(cacheKey, c.env.CACHE_KV, kvKey)
  if (cached) {
    return cached
  }

  const object = await c.env.CONTENT_BUCKET.get(`posts/${slug}.md`)
  if (!object) {
    return c.notFound()
  }

  const content = await object.text()
  const { metadata, html } = await parseMarkdown(content)

  if (!metadata.published) {
    return c.notFound()
  }

  const renderedHtml = renderPostPage(metadata, html)
  const response = c.html(renderedHtml, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })

  c.executionCtx.waitUntil(
    setCachedResponse(cacheKey, response.clone(), { ttl: 3600 }, c.env.CACHE_KV, kvKey)
  )

  return response
})

export default posts
