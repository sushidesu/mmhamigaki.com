import { createRoute } from "honox/factory";
import type { Context } from "hono";
import { AdminLayout } from "../../../components/AdminLayout";
import PostList from "../../../islands/PostList";
import { listContent } from "../../../lib/db/content";

export default createRoute(async (c: Context<{ Bindings: CloudflareBindings }>) => {
  const allPosts = await listContent(c.env.DB);

  return c.render(
    <AdminLayout>
      <PostList posts={allPosts} />
    </AdminLayout>,
  );
});
