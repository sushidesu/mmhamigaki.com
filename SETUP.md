# Media Service Setup Guide

## Infrastructure Setup

### 1. Create R2 Buckets

```bash
# Create production buckets
wrangler r2 bucket create mmhamigaki-content
wrangler r2 bucket create mmhamigaki-media

# Create preview buckets for development
wrangler r2 bucket create mmhamigaki-content-preview
wrangler r2 bucket create mmhamigaki-media-preview
```

### 2. Create KV Namespace

```bash
# Create production KV
wrangler kv:namespace create CACHE_KV

# Create preview KV for development
wrangler kv:namespace create CACHE_KV --preview
```

### 3. Update wrangler.jsonc

Replace the placeholder IDs in `wrangler.jsonc` with the actual IDs from the commands above:

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "CACHE_KV",
      "id": "YOUR_KV_ID_HERE",              // From step 2
      "preview_id": "YOUR_PREVIEW_KV_ID"    // From step 2
    }
  ]
}
```

Note: R2 bucket names are already configured and don't need IDs.

## Upload Sample Content

### Upload the sample blog post

```bash
wrangler r2 object put mmhamigaki-content/posts/welcome.md --file=sample-post.md
```

### Upload media files (optional)

```bash
# Example: Upload an image
wrangler r2 object put mmhamigaki-media/images/sample.jpg --file=path/to/image.jpg

# Example: Upload audio
wrangler r2 object put mmhamigaki-media/audio/podcast.mp3 --file=path/to/audio.mp3
```

## Development

### Start local development server

```bash
npm run dev
```

The server will start at http://localhost:8787 (or similar port).

### Test the routes

1. **Homepage**: http://localhost:8787/
2. **Blog post**: http://localhost:8787/posts/welcome
3. **OG image**: http://localhost:8787/og-image/welcome
4. **API**: Use Cap'n Web client to connect to http://localhost:8787/api

## Deployment

```bash
npm run deploy
```

## Route Overview

### `/` - Homepage

- Lists recent blog posts
- Cached for 1 hour
- Shows titles, dates, and descriptions

### `/posts/:slug` - Blog Posts

- Fetches markdown from R2
- Parses frontmatter and renders HTML
- 3-tier caching (Cache API → KV → R2)
- Cache TTL: 1 hour

### `/og-image/:slug` - OG Images

- Generates SVG OG images dynamically
- Based on post title and description
- Cache TTL: 24 hours
- Size: 1200x630px

### `/images/*` - Image Serving

- Serves from MEDIA_BUCKET R2
- Supports: JPG, PNG, GIF, WebP, SVG
- Cache TTL: 1 year (immutable)

### `/audio/*` - Audio Serving

- Serves from MEDIA_BUCKET R2
- Supports: MP3, WAV, OGG, M4A
- Cache TTL: 24 hours
- Supports range requests

### `/api` - Cap'n Web RPC

- Methods:
  - `getPosts()` - Get all post slugs
  - `getPost(slug)` - Get post metadata
  - `getPostWithContent(slug)` - Get full post with HTML

## Blog Post Format

Create markdown files with frontmatter:

```yaml
---
title: "Your Post Title"
description: "Brief description for SEO"
date: "2025-12-31"
tags: ["tag1", "tag2"]
slug: "your-post-slug"
published: true
---

# Your Content Here

Write your blog post in markdown...
```

## Caching Strategy

### 3-Tier Approach

1. **Cache API** (fastest)
   - Rendered HTML, OG images, media
   - Automatic HTTP caching
   - TTL: 1-24 hours depending on content type

2. **KV Store** (persistent)
   - Parsed metadata, processed posts
   - TTL: 24 hours
   - Reduces R2 reads

3. **Response Headers**
   - Cache-Control for CDN/browser
   - ETag for conditional requests

## Cap'n Web RPC Usage

### Example Client Code

```typescript
import { connect } from 'capnweb/client'

const api = await connect('https://mmhamigaki.com/api')

// Get all posts
const posts = await api.getPosts()

// Get specific post metadata
const post = await api.getPost('welcome')

// Get post with full content
const fullPost = await api.getPostWithContent('welcome')
```

## Troubleshooting

### KV namespace not found

Make sure you've created the KV namespace and updated the IDs in `wrangler.jsonc`.

### R2 bucket not found

Run `wrangler r2 bucket list` to verify your buckets exist.

### Type errors

Run `npm run cf-typegen` to regenerate TypeScript bindings after changing `wrangler.jsonc`.

### Posts not showing

- Verify markdown file is uploaded to R2
- Check `published: true` in frontmatter
- Clear cache: delete KV keys or wait for TTL expiration

## Performance Tips

1. **Upload optimization**: Compress images before uploading to R2
2. **Cache warming**: Pre-generate popular pages after deployment
3. **Minimize R2 reads**: Keep KV TTLs appropriate for your update frequency
4. **Bundle size**: Keep dependencies minimal for fast cold starts

## Next Steps

- Set up automated content uploads via CI/CD
- Add full-text search using KV or D1
- Implement admin panel for content management
- Add RSS feed generation
- Create sitemap.xml for SEO
