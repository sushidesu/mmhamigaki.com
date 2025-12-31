import { Hono } from 'hono'

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
}

const assets = new Hono<{ Bindings: { MEDIA_BUCKET: R2Bucket } }>()

assets.get('/images/*', async (c) => {
  const path = c.req.path.replace('/images/', '')
  const object = await c.env.MEDIA_BUCKET.get(`images/${path}`)

  if (!object) {
    return c.notFound()
  }

  const ext = path.substring(path.lastIndexOf('.')).toLowerCase()
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'

  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': object.etag,
    },
  })
})

assets.get('/audio/*', async (c) => {
  const path = c.req.path.replace('/audio/', '')
  const object = await c.env.MEDIA_BUCKET.get(`audio/${path}`)

  if (!object) {
    return c.notFound()
  }

  const ext = path.substring(path.lastIndexOf('.')).toLowerCase()
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'

  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      'Accept-Ranges': 'bytes',
      'ETag': object.etag,
    },
  })
})

export default assets
