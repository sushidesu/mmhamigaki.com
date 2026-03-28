import { Hono } from "hono";
import { listPublishedBlogPosts } from "./db/blog";
import { renderer } from "./renderer";
import { adminRoutes } from "./routes/admin";
import { blogRoutes } from "./routes/blog";
import { Home } from "./views/Home";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(renderer);

app.get("/", async (c) => {
  const recentPosts = await listPublishedBlogPosts(c.env.DB, { limit: 5 });
  return c.render(<Home recentPosts={recentPosts} />);
});

app.route("/blog", blogRoutes);
app.route("/admin", adminRoutes);

export default app;
