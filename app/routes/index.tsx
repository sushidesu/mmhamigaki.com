import { createRoute } from "honox/factory";
import type { Context } from "hono";
import { listContent, contentRecordToPostMetadata } from "../lib/db/content";
import { renderHomepage } from "../lib/templates";

export default createRoute(async (c: Context<{ Bindings: CloudflareBindings }>) => {
  const allPosts = await listContent(c.env.DB);
  const publishedPosts = allPosts
    .filter((p) => p.published)
    .sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))
    .slice(0, 10)
    .map(contentRecordToPostMetadata);

  const html = renderHomepage(publishedPosts as any);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
