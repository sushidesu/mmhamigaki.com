import { Hono } from "hono";
import { createBlogPost, getBlogPostById, listAllBlogPosts, updateBlogPost } from "../db/blog";
import { AdminDashboard } from "../views/admin/Dashboard";
import { BlogForm } from "../views/admin/BlogForm";

export const adminRoutes = new Hono<{ Bindings: CloudflareBindings }>();

adminRoutes.get("/", async (c) => {
  const posts = await listAllBlogPosts(c.env.DB);
  return c.render(<AdminDashboard posts={posts} />);
});

adminRoutes.get("/blog/new", (c) => {
  return c.render(<BlogForm />);
});

adminRoutes.get("/blog/:id/edit", async (c) => {
  const id = c.req.param("id");
  const post = await getBlogPostById(c.env.DB, id);
  if (!post) return c.notFound();
  return c.render(<BlogForm post={post} />);
});

adminRoutes.post("/blog", async (c) => {
  const form = await c.req.formData();
  const id = await createBlogPost(c.env.DB, {
    title: form.get("title") as string,
    slug: form.get("slug") as string,
    body: form.get("body") as string,
    excerpt: (form.get("excerpt") as string) || undefined,
    cover_image_url: (form.get("cover_image_url") as string) || undefined,
    status: (form.get("status") as "draft" | "published") ?? "draft",
  });
  return c.redirect(`/admin/blog/${id}/edit`);
});

adminRoutes.post("/blog/:id", async (c) => {
  const id = c.req.param("id");
  const form = await c.req.formData();
  await updateBlogPost(c.env.DB, id, {
    title: form.get("title") as string,
    slug: form.get("slug") as string,
    body: form.get("body") as string,
    excerpt: (form.get("excerpt") as string) || undefined,
    cover_image_url: (form.get("cover_image_url") as string) || undefined,
    status: (form.get("status") as "draft" | "published") ?? "draft",
  });
  return c.redirect(`/admin/blog/${id}/edit`);
});
