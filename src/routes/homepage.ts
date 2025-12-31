import { Hono } from 'hono'
import { parseMarkdown } from '../lib/markdown'
import { renderHomepage } from '../lib/templates'

const homepage = new Hono<{
  Bindings: {
    CONTENT_BUCKET: R2Bucket
    CACHE_KV: KVNamespace
  }
}>()

homepage.get('/', async (c) => {
  const cacheKey = 'homepage:index'
  const cached = await c.env.CACHE_KV.get(cacheKey)

  if (cached) {
    return c.html(cached, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  const list = await c.env.CONTENT_BUCKET.list({
    prefix: 'posts/',
    limit: 20,
  })

  const posts = await Promise.all(
    list.objects.map(async (obj) => {
      const slug = obj.key.replace('posts/', '').replace('.md', '')
      const metadataKey = `metadata:${slug}`
      const cachedMetadata = await c.env.CACHE_KV.get(metadataKey)

      if (cachedMetadata) {
        return JSON.parse(cachedMetadata)
      }

      const object = await c.env.CONTENT_BUCKET.get(obj.key)
      if (!object) return null

      const content = await object.text()
      const { metadata } = await parseMarkdown(content)

      await c.env.CACHE_KV.put(
        metadataKey,
        JSON.stringify({ ...metadata, slug }),
        { expirationTtl: 86400 }
      )

      return { ...metadata, slug }
    })
  )

  const publishedPosts = posts
    .filter((p) => p && p.published)
    .sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime())
    .slice(0, 10)

  const html = renderHomepage(publishedPosts as any)

  await c.env.CACHE_KV.put(cacheKey, html, { expirationTtl: 3600 })

  return c.html(html, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })
})

export default homepage
