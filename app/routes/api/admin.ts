import { Hono } from "hono";
import { RpcTarget, newHttpBatchRpcResponse } from "capnweb";
import type { CreateContentInput, UpdateContentInput, ContentRecord } from "../../types/admin";
import {
  createContent,
  updateContent,
  deleteContent,
  getContentById,
  listContent,
} from "../../lib/db/content";

interface Env {
  CONTENT_BUCKET: R2Bucket;
  CACHE_KV: KVNamespace;
  DB: D1Database;
}

class AdminApiServer extends RpcTarget {
  constructor(private env: Env) {
    super();
  }

  async createContent(data: CreateContentInput): Promise<ContentRecord> {
    // Create content record with attachments in D1
    // Text content (markdown) is stored in attachment.body in D1
    // Media files will be uploaded to R2 in Phase 2
    const record = await createContent(this.env.DB, data);
    return record;
  }

  async updateContent(id: string, data: UpdateContentInput): Promise<ContentRecord> {
    // Update content record in D1
    const record = await updateContent(this.env.DB, id, data);

    if (!record) {
      throw new Error("Content not found");
    }

    return record;
  }

  async deleteContent(id: string): Promise<void> {
    // Delete from D1
    // Attachments are deleted automatically via ON DELETE CASCADE
    await deleteContent(this.env.DB, id);
  }

  async listContents(): Promise<ContentRecord[]> {
    return listContent(this.env.DB);
  }

  async getContentById(id: string): Promise<ContentRecord | null> {
    return getContentById(this.env.DB, id);
  }
}

const api = new Hono<{ Bindings: Env }>();

// File upload endpoint (not RPC - handles multipart/form-data)
api.post("/upload-media", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const contentId = formData.get("contentId") as string | null;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Generate storage key
    const fileExtension = file.name.split(".").pop() || "bin";
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const storageKey = contentId
      ? `media/${contentId}/${timestamp}-${randomId}.${fileExtension}`
      : `media/temp/${timestamp}-${randomId}.${fileExtension}`;

    // Upload to R2
    await c.env.CONTENT_BUCKET.put(storageKey, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Extract basic metadata
    const metadata = {
      mimeType: file.type,
    };

    return c.json({
      storageKey,
      metadata,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Upload failed", message: String(error) }, 500);
  }
});

// RPC endpoints (Cap'n Web HTTP batch handler)
api.all("/*", async (c) => {
  const server = new AdminApiServer(c.env);

  try {
    return await newHttpBatchRpcResponse(c.req.raw, server);
  } catch (error) {
    console.error("Admin RPC error:", error);
    return c.json({ error: "Admin RPC error", message: String(error) }, 500);
  }
});

export default api;
