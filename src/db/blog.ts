import type { BlogPostWithContent, BlogPostWithTags, Tag } from "./schema";

export async function listPublishedBlogPosts(
  db: D1Database,
  options?: { limit?: number },
): Promise<BlogPostWithContent[]> {
  const limit = options?.limit ?? 100;
  const result = await db
    .prepare(
      `
      SELECT ci.*, bp.body, bp.excerpt, bp.cover_image_url
      FROM content_items ci
      JOIN blog_posts bp ON ci.id = bp.content_id
      WHERE ci.type = 'blog' AND ci.status = 'published'
      ORDER BY ci.published_at DESC
      LIMIT ?
      `,
    )
    .bind(limit)
    .all<BlogPostWithContent>();
  return result.results;
}

export async function getBlogPostBySlug(
  db: D1Database,
  slug: string,
): Promise<BlogPostWithTags | null> {
  const post = await db
    .prepare(
      `
      SELECT ci.*, bp.body, bp.excerpt, bp.cover_image_url
      FROM content_items ci
      JOIN blog_posts bp ON ci.id = bp.content_id
      WHERE ci.type = 'blog' AND ci.slug = ?
      `,
    )
    .bind(slug)
    .first<BlogPostWithContent>();

  if (!post) return null;

  const tagsResult = await db
    .prepare(
      `
      SELECT t.id, t.name, t.slug
      FROM tags t
      JOIN content_tags ct ON t.id = ct.tag_id
      WHERE ct.content_id = ?
      `,
    )
    .bind(post.id)
    .all<Tag>();

  return { ...post, tags: tagsResult.results };
}

export type CreateBlogPostInput = {
  title: string;
  slug: string;
  body: string;
  excerpt?: string;
  cover_image_url?: string;
  status?: "draft" | "published";
  tag_ids?: string[];
};

export async function createBlogPost(db: D1Database, input: CreateBlogPostInput): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const publishedAt = input.status === "published" ? now : null;

  await db.batch([
    db
      .prepare(
        `
        INSERT INTO content_items (id, type, title, slug, status, published_at, created_at, updated_at)
        VALUES (?, 'blog', ?, ?, ?, ?, ?, ?)
        `,
      )
      .bind(id, input.title, input.slug, input.status ?? "draft", publishedAt, now, now),
    db
      .prepare(
        `
        INSERT INTO blog_posts (content_id, body, excerpt, cover_image_url)
        VALUES (?, ?, ?, ?)
        `,
      )
      .bind(id, input.body, input.excerpt ?? null, input.cover_image_url ?? null),
  ]);

  if (input.tag_ids && input.tag_ids.length > 0) {
    const tagInserts = input.tag_ids.map((tagId) =>
      db.prepare("INSERT INTO content_tags (content_id, tag_id) VALUES (?, ?)").bind(id, tagId),
    );
    await db.batch(tagInserts);
  }

  return id;
}

export async function listAllBlogPosts(db: D1Database): Promise<BlogPostWithContent[]> {
  const result = await db
    .prepare(
      `
      SELECT ci.*, bp.body, bp.excerpt, bp.cover_image_url
      FROM content_items ci
      JOIN blog_posts bp ON ci.id = bp.content_id
      WHERE ci.type = 'blog'
      ORDER BY ci.created_at DESC
      `,
    )
    .all<BlogPostWithContent>();
  return result.results;
}

export async function getBlogPostById(
  db: D1Database,
  id: string,
): Promise<BlogPostWithContent | null> {
  return db
    .prepare(
      `
      SELECT ci.*, bp.body, bp.excerpt, bp.cover_image_url
      FROM content_items ci
      JOIN blog_posts bp ON ci.id = bp.content_id
      WHERE ci.id = ?
      `,
    )
    .bind(id)
    .first<BlogPostWithContent>();
}

export type UpdateBlogPostInput = Partial<CreateBlogPostInput>;

export async function updateBlogPost(
  db: D1Database,
  id: string,
  input: UpdateBlogPostInput,
): Promise<void> {
  const now = Date.now();
  const updates: D1PreparedStatement[] = [];

  if (input.title !== undefined || input.slug !== undefined || input.status !== undefined) {
    const sets: string[] = ["updated_at = ?"];
    const binds: unknown[] = [now];

    if (input.title !== undefined) {
      sets.push("title = ?");
      binds.push(input.title);
    }
    if (input.slug !== undefined) {
      sets.push("slug = ?");
      binds.push(input.slug);
    }
    if (input.status !== undefined) {
      sets.push("status = ?");
      binds.push(input.status);
      if (input.status === "published") {
        sets.push("published_at = COALESCE(published_at, ?)");
        binds.push(now);
      }
    }

    binds.push(id);
    updates.push(
      db.prepare(`UPDATE content_items SET ${sets.join(", ")} WHERE id = ?`).bind(...binds),
    );
  }

  if (
    input.body !== undefined ||
    input.excerpt !== undefined ||
    input.cover_image_url !== undefined
  ) {
    const sets: string[] = [];
    const binds: unknown[] = [];

    if (input.body !== undefined) {
      sets.push("body = ?");
      binds.push(input.body);
    }
    if (input.excerpt !== undefined) {
      sets.push("excerpt = ?");
      binds.push(input.excerpt);
    }
    if (input.cover_image_url !== undefined) {
      sets.push("cover_image_url = ?");
      binds.push(input.cover_image_url);
    }

    binds.push(id);
    updates.push(
      db.prepare(`UPDATE blog_posts SET ${sets.join(", ")} WHERE content_id = ?`).bind(...binds),
    );
  }

  if (input.tag_ids !== undefined) {
    updates.push(db.prepare("DELETE FROM content_tags WHERE content_id = ?").bind(id));
    for (const tagId of input.tag_ids) {
      updates.push(
        db.prepare("INSERT INTO content_tags (content_id, tag_id) VALUES (?, ?)").bind(id, tagId),
      );
    }
  }

  if (updates.length > 0) {
    await db.batch(updates);
  }
}
