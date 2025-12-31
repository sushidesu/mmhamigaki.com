---
title: "Welcome to mmhamigaki.com"
description: "A sample blog post to test the media service"
date: "2025-12-31"
tags: ["cloudflare", "hono", "typescript"]
slug: "welcome"
published: true
---

# Welcome to mmhamigaki.com

This is a sample blog post to demonstrate the media service built with:

- **Cloudflare Workers** - Edge computing platform
- **Hono** - Lightweight web framework
- **R2** - Object storage for content and media
- **Cap'n Web** - RPC framework

## Features

- Markdown blog posts with frontmatter
- Server-side rendering with caching
- OG image generation
- Media file serving from R2
- Cap'n Web RPC API

## Next Steps

1. Create R2 buckets: `wrangler r2 bucket create mmhamigaki-content`
2. Create KV namespace: `wrangler kv:namespace create CACHE_KV`
3. Upload this file to R2: `wrangler r2 object put mmhamigaki-content/posts/welcome.md --file=sample-post.md`
4. Test locally: `npm run dev`

Enjoy your new media service!
