import { Hono } from "hono";
import { RpcTarget } from "capnweb";
import type { CreatePostInput, UpdatePostInput, ContentRecord } from "../../types/admin";
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

  async createPost(data: CreatePostInput): Promise<ContentRecord> {
    // Create record in D1
    const record = await createContent(this.env.DB, data);

    // Upload markdown to R2
    await this.env.CONTENT_BUCKET.put(record.storageKey, data.markdown, {
      httpMetadata: {
        contentType: "text/markdown",
      },
    });

    return record;
  }

  async updatePost(id: string, data: UpdatePostInput): Promise<ContentRecord> {
    // Update record in D1
    const record = await updateContent(this.env.DB, id, data);

    if (!record) {
      throw new Error("Post not found");
    }

    // Update markdown in R2 if provided
    if (data.markdown !== undefined) {
      await this.env.CONTENT_BUCKET.put(record.storageKey, data.markdown, {
        httpMetadata: {
          contentType: "text/markdown",
        },
      });
    }

    return record;
  }

  async deletePost(id: string): Promise<void> {
    // Get record to find storage key
    const record = await getContentById(this.env.DB, id);

    if (record) {
      // Delete from R2
      await this.env.CONTENT_BUCKET.delete(record.storageKey);

      // Delete from D1
      await deleteContent(this.env.DB, id);
    }
  }

  async listPosts(): Promise<ContentRecord[]> {
    return listContent(this.env.DB);
  }

  async getPostById(id: string): Promise<ContentRecord | null> {
    return getContentById(this.env.DB, id);
  }
}

const api = new Hono<{ Bindings: Env }>();

api.all("/*", async (c) => {
  const server = new AdminApiServer(c.env);

  try {
    const response = await fetch(c.req.raw, {
      async dispatcher(request: Request) {
        if (request.url === c.req.url) {
          return server;
        }
        throw new Error("Invalid RPC target");
      },
    } as any);

    return response;
  } catch (error) {
    return c.json({ error: "Admin RPC error", message: String(error) }, 500);
  }
});

export default api;
