import { createRoute } from "honox/factory";
import type { Context } from "hono";
import { AdminLayout } from "../../../../components/AdminLayout";
import PostForm from "../../../../islands/PostForm";
import { getContentById } from "../../../../lib/db/content";

export default createRoute(async (c: Context<{ Bindings: CloudflareBindings }>) => {
  const id = c.req.param("id")!;
  const post = await getContentById(c.env.DB, id);

  if (!post) {
    return c.notFound();
  }

  // Fetch markdown from R2
  const object = await c.env.CONTENT_BUCKET.get(post.storageKey);
  const markdown = object ? await object.text() : "";

  const html = `<!DOCTYPE html>${AdminLayout({
    children: <PostForm post={post} markdown={markdown} />,
  })}`;

  return c.html(html);
});
