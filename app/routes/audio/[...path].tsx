import { createRoute } from "honox/factory";
import type { Context } from "hono";

const CONTENT_TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
};

export default createRoute(async (c: Context<{ Bindings: CloudflareBindings }>) => {
  const path = c.req.param("path")!;
  const object = await c.env.MEDIA_BUCKET.get(`audio/${path}`);

  if (!object) {
    return c.notFound();
  }

  const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
      "Accept-Ranges": "bytes",
      ETag: object.etag,
    },
  });
});
