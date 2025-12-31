import type { Context, Next } from "hono";

interface KVCacheConfig {
  pattern: RegExp;
  keyPrefix: string;
  ttl: number;
  contentType: string;
}

interface CacheAPIConfig {
  pattern: RegExp;
  keyPrefix: string;
}

const kvConfigs: KVCacheConfig[] = [
  {
    pattern: /^\/posts\/[^/]+$/,
    keyPrefix: "post:html:",
    ttl: 3600,
    contentType: "text/html; charset=utf-8",
  },
  {
    pattern: /^\/$/,
    keyPrefix: "homepage:",
    ttl: 3600,
    contentType: "text/html; charset=utf-8",
  },
  {
    pattern: /^\/og-image\/[^/]+$/,
    keyPrefix: "metadata:",
    ttl: 86400,
    contentType: "image/svg+xml",
  },
];

const cacheAPIConfigs: CacheAPIConfig[] = [
  { pattern: /^\/posts\/[^/]+$/, keyPrefix: "post:" },
  { pattern: /^\/$/, keyPrefix: "homepage:" },
  { pattern: /^\/og-image\/[^/]+$/, keyPrefix: "og:" },
];

export function cacheMiddleware() {
  return async (c: Context, next: Next) => {
    // 常にスキップ
    const isDev = true;
    if (isDev) {
      return await next();
    }

    const pathname = new URL(c.req.url).pathname;

    // KVチェック
    const kvConfig = kvConfigs.find((cfg) => cfg.pattern.test(pathname));
    if (kvConfig && c.env.CACHE_KV) {
      const parts = pathname.split("/").filter(Boolean);
      const slug = parts[parts.length - 1] || "index";
      const kvKey = `${kvConfig.keyPrefix}${slug}`;
      const kvCached = await c.env.CACHE_KV.get(kvKey);
      if (kvCached) {
        return new Response(kvCached, {
          headers: { "Content-Type": kvConfig.contentType },
        });
      }
    }

    // Cache APIチェック
    const cacheAPIConfig = cacheAPIConfigs.find((cfg) => cfg.pattern.test(pathname));
    if (cacheAPIConfig) {
      const parts = pathname.split("/").filter(Boolean);
      const slug = parts[parts.length - 1] || "index";
      const cacheKey = `${cacheAPIConfig.keyPrefix}${slug}`;
      const cache = caches.default;
      const request = new Request(`https://cache/${cacheKey}`);
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
    }

    // ハンドラー実行
    await next();

    // レスポンスをキャッシュ
    const response = c.res;
    if (!response || !response.ok) {
      return;
    }

    // KVに保存
    if (kvConfig && c.env.CACHE_KV) {
      const parts = pathname.split("/").filter(Boolean);
      const slug = parts[parts.length - 1] || "index";
      const kvKey = `${kvConfig.keyPrefix}${slug}`;
      c.executionCtx.waitUntil(
        (async () => {
          const body = await response.clone().text();
          await c.env.CACHE_KV.put(kvKey, body, { expirationTtl: kvConfig.ttl });
        })(),
      );
    }

    // Cache APIに保存
    if (cacheAPIConfig) {
      const parts = pathname.split("/").filter(Boolean);
      const slug = parts[parts.length - 1] || "index";
      const cacheKey = `${cacheAPIConfig.keyPrefix}${slug}`;
      c.executionCtx.waitUntil(
        (async () => {
          const cache = caches.default;
          const request = new Request(`https://cache/${cacheKey}`);
          await cache.put(request, response.clone());
        })(),
      );
    }
  };
}
