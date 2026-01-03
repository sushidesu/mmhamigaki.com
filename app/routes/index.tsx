import { createRoute } from "honox/factory";
import type { Context } from "hono";
import { parseMarkdown } from "../lib/markdown";
import { renderHomepage } from "../lib/templates";

export default createRoute(async (c: Context<{ Bindings: CloudflareBindings }>) => {
  const list = await c.env.CONTENT_BUCKET.list({
    prefix: "posts/",
    limit: 20,
  });

  const posts = await Promise.all(
    list.objects.map(async (obj: R2Object) => {
      const slug = obj.key.replace("posts/", "").replace(".md", "");
      const object = await c.env.CONTENT_BUCKET.get(obj.key);
      if (!object) return null;

      const content = await object.text();
      const { metadata } = await parseMarkdown(content);

      return { ...metadata, slug };
    }),
  );

  const publishedPosts = posts
    .filter((p): p is NonNullable<typeof p> => p !== null && (p as any).published)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const html = renderHomepage(publishedPosts as any);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
