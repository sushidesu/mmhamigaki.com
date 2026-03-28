import { Hono } from "hono";
import { getBlogPostBySlug, listPublishedBlogPosts } from "../db/blog";
import { BlogDetail } from "../views/blog/Detail";
import { BlogList } from "../views/blog/List";

export const blogRoutes = new Hono<{ Bindings: CloudflareBindings }>();

blogRoutes.get("/", async (c) => {
  const posts = await listPublishedBlogPosts(c.env.DB);
  return c.render(<BlogList posts={posts} />);
});

blogRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const post = await getBlogPostBySlug(c.env.DB, slug);

  if (!post) {
    return c.notFound();
  }

  return c.render(<BlogDetail post={post} />);
});
