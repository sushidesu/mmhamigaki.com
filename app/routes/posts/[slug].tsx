import { createRoute } from "honox/factory";
import type { Context } from "hono";
import { getContentBySlug, contentRecordToPostMetadata } from "../../lib/db/content";
import { getContentBody } from "../../types/admin";
import { parseMarkdown } from "../../lib/markdown";
import { renderPostPage } from "../../lib/templates";

export default createRoute(async (c: Context<{ Bindings: CloudflareBindings }>) => {
  const slug = c.req.param("slug")!;

  const post = await getContentBySlug(c.env.DB, slug);

  if (!post || !post.published) {
    return c.notFound();
  }

  // Get markdown from attachments (stored in D1)
  const markdown = getContentBody(post) || "";
  const { html } = await parseMarkdown(markdown);

  const metadata = contentRecordToPostMetadata(post);
  const renderedHtml = renderPostPage(metadata, html);
  const response = new Response(renderedHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });

  return response;
});
