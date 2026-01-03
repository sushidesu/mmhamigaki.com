import { createRoute } from "honox/factory";
import type { Context } from "hono";
import { AdminLayout } from "../../../components/AdminLayout";
import PostList from "../../../islands/PostList";
import { listContent } from "../../../lib/db/content";

export default createRoute(async (c: Context<{ Bindings: CloudflareBindings }>) => {
  const allPosts = await listContent(c.env.DB);

  const html = `<!DOCTYPE html>${AdminLayout({
    children: <PostList posts={allPosts} />,
  })}`;

  return c.html(html);
});
