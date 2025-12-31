import { html } from 'hono/html'
import type { PostMetadata } from '../types/post'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderPostPage(metadata: PostMetadata, content: string): string {
  const tagsHtml =
    metadata.tags.length > 0
      ? `<div class="tags">
              ${metadata.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
            </div>`
      : ''

  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(metadata.title)}</title>
        <meta name="description" content="${escapeHtml(metadata.description)}">
        <meta property="og:title" content="${escapeHtml(metadata.title)}">
        <meta property="og:description" content="${escapeHtml(metadata.description)}">
        <meta property="og:image" content="/og-image/${escapeHtml(metadata.slug)}">
        <meta property="og:type" content="article">
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
          }
          article {
            margin-top: 2rem;
          }
          h1 {
            margin-bottom: 0.5rem;
          }
          time {
            color: #666;
            font-size: 0.9rem;
          }
          .tags {
            margin-top: 1rem;
            display: flex;
            gap: 0.5rem;
          }
          .tag {
            background: #f0f0f0;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.85rem;
          }
        </style>
      </head>
      <body>
        <nav>
          <a href="/">← Home</a>
        </nav>
        <article>
          <h1>${escapeHtml(metadata.title)}</h1>
          <time datetime="${escapeHtml(metadata.date)}">${escapeHtml(metadata.date)}</time>
          ${tagsHtml}
          <div class="content">
            ${content}
          </div>
        </article>
      </body>
    </html>
  `
}

export function renderHomepage(posts: { title: string; slug: string; date: string; description: string }[]): string {
  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>mmhamigaki.com</title>
        <meta name="description" content="Blog posts and media">
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
          }
          h1 {
            margin-bottom: 2rem;
          }
          .posts {
            list-style: none;
            padding: 0;
          }
          .post {
            margin-bottom: 2rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid #eee;
          }
          .post h2 {
            margin: 0 0 0.5rem 0;
          }
          .post a {
            color: #0066cc;
            text-decoration: none;
          }
          .post a:hover {
            text-decoration: underline;
          }
          .post time {
            color: #666;
            font-size: 0.9rem;
          }
          .post p {
            margin-top: 0.5rem;
            color: #333;
          }
        </style>
      </head>
      <body>
        <h1>mmhamigaki.com</h1>
        <ul class="posts">
          ${posts.map(post => html`
            <li class="post">
              <h2><a href="/posts/${post.slug}">${post.title}</a></h2>
              <time datetime="${post.date}">${post.date}</time>
              <p>${post.description}</p>
            </li>
          `)}
        </ul>
      </body>
    </html>
  `.toString()
}
