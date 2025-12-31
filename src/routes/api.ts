import { Hono } from "hono";
import { RpcTarget } from "capnweb";
import { parseMarkdown } from "../lib/markdown";
import type { PostMetadata } from "../types/post";

interface Env {
  CONTENT_BUCKET: R2Bucket;
  CACHE_KV: KVNamespace;
}

class BlogApiServer extends RpcTarget {
  constructor(private env: Env) {
    super();
  }

  async getPosts(): Promise<string[]> {
    const list = await this.env.CONTENT_BUCKET.list({ prefix: "posts/" });
    return list.objects
      .map((obj) => obj.key.replace("posts/", "").replace(".md", ""))
      .filter((slug) => slug);
  }

  async getPost(slug: string): Promise<PostMetadata | null> {
    const metadataKey = `metadata:${slug}`;
    const cached = await this.env.CACHE_KV.get(metadataKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const object = await this.env.CONTENT_BUCKET.get(`posts/${slug}.md`);
    if (!object) {
      return null;
    }

    const content = await object.text();
    const { metadata } = await parseMarkdown(content);

    await this.env.CACHE_KV.put(metadataKey, JSON.stringify(metadata), {
      expirationTtl: 86400,
    });

    return metadata;
  }

  async getPostWithContent(slug: string) {
    const object = await this.env.CONTENT_BUCKET.get(`posts/${slug}.md`);
    if (!object) {
      return null;
    }

    const content = await object.text();
    const post = await parseMarkdown(content);

    return post;
  }
}

const api = new Hono<{ Bindings: Env }>();

api.all("/*", async (c) => {
  const server = new BlogApiServer(c.env);

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
    return c.json({ error: "RPC error", message: String(error) }, 500);
  }
});

export default api;
