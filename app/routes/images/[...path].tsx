import { createRoute } from "honox/factory";
import type { Context } from "hono";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export default createRoute(async (c: Context<{ Bindings: CloudflareBindings }>) => {
  const path = c.req.param("path")!;
  const object = await c.env.MEDIA_BUCKET.get(`images/${path}`);

  if (!object) {
    return c.notFound();
  }

  const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: object.etag,
    },
  });
});
