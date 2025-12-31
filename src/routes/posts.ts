import { Hono } from 'hono'
import { parseMarkdown } from '../lib/markdown'
import { renderPostPage } from '../lib/templates'

const posts = new Hono<{
  Bindings: {
    CONTENT_BUCKET: R2Bucket
    CACHE_KV: KVNamespace
  }
}>()

posts.get('/:slug', async (c) => {
  const slug = c.req.param('slug')

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
  const response = new Response(renderedHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })

  return response
})

export default posts
