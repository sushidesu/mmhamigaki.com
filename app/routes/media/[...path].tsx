import { createRoute } from "honox/factory";
import type { Context } from "hono";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};

export default createRoute(async (c: Context<{ Bindings: CloudflareBindings }>) => {
  const path = c.req.param("path");

  if (!path) {
    return c.notFound();
  }

  const object = await c.env.CONTENT_BUCKET.get(`media/${path}`);

  if (!object) {
    return c.notFound();
  }

  const extIndex = path.lastIndexOf(".");
  const ext = extIndex >= 0 ? path.substring(extIndex).toLowerCase() : "";
  const contentType =
    CONTENT_TYPES[ext] || object.httpMetadata?.contentType || "application/octet-stream";

  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
      ETag: object.etag,
    },
  });
});
