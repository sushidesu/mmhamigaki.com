import { createRoute } from "honox/factory";
import type { Context } from "hono";
import { AdminLayout } from "../../../../components/AdminLayout";
import ContentForm from "../../../../islands/ContentForm";
import { getContentById } from "../../../../lib/db/content";
import { getContentBody } from "../../../../types/admin";

export default createRoute(async (c: Context<{ Bindings: CloudflareBindings }>) => {
  const id = c.req.param("id")!;
  const content = await getContentById(c.env.DB, id);

  if (!content) {
    return c.notFound();
  }

  // Get markdown from attachments (stored in D1)
  const markdown = getContentBody(content) || "";

  return c.render(
    <AdminLayout>
      <ContentForm content={content} markdown={markdown} />
    </AdminLayout>,
  );
});
