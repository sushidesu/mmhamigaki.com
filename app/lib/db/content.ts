import type { ContentRecord, CreatePostInput, UpdatePostInput } from "../../types/admin";

interface DBContentRow {
  id: string;
  type: string;
  slug: string;
  title: string;
  description: string;
  published: number; // SQLite stores boolean as 0/1
  created_at: number;
  updated_at: number;
  published_at: number | null;
  tags: string; // JSON string
  storage_key: string;
}

function rowToRecord(row: DBContentRow): ContentRecord {
  return {
    id: row.id,
    type: row.type,
    slug: row.slug,
    title: row.title,
    description: row.description,
    published: Boolean(row.published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    tags: JSON.parse(row.tags),
    storageKey: row.storage_key,
  };
}

export async function createContent(db: D1Database, data: CreatePostInput): Promise<ContentRecord> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const publishedAt = data.published ? now : null;
  const storageKey = `posts/${id}.md`;

  const stmt = db.prepare(`
    INSERT INTO content (
      id, type, slug, title, description, published,
      created_at, updated_at, published_at, tags, storage_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  await stmt
    .bind(
      id,
      "post",
      data.slug,
      data.title,
      data.description,
      data.published ? 1 : 0,
      now,
      now,
      publishedAt,
      JSON.stringify(data.tags),
      storageKey,
    )
    .run();

  return {
    id,
    type: "post",
    slug: data.slug,
    title: data.title,
    description: data.description,
    published: data.published,
    createdAt: now,
    updatedAt: now,
    publishedAt,
    tags: data.tags,
    storageKey,
  };
}

export async function updateContent(
  db: D1Database,
  id: string,
  data: UpdatePostInput,
): Promise<ContentRecord | null> {
  const now = Math.floor(Date.now() / 1000);

  // Build dynamic update query
  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.slug !== undefined) {
    updates.push("slug = ?");
    values.push(data.slug);
  }
  if (data.title !== undefined) {
    updates.push("title = ?");
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    values.push(data.description);
  }
  if (data.published !== undefined) {
    updates.push("published = ?");
    values.push(data.published ? 1 : 0);
    if (data.published) {
      updates.push("published_at = ?");
      values.push(now);
    }
  }
  if (data.tags !== undefined) {
    updates.push("tags = ?");
    values.push(JSON.stringify(data.tags));
  }

  updates.push("updated_at = ?");
  values.push(now);

  if (updates.length === 1) {
    // Only updated_at changed, still proceed
  }

  values.push(id);

  const stmt = db.prepare(`
    UPDATE content
    SET ${updates.join(", ")}
    WHERE id = ?
  `);

  await stmt.bind(...values).run();

  return getContentById(db, id);
}

export async function deleteContent(db: D1Database, id: string): Promise<void> {
  const stmt = db.prepare("DELETE FROM content WHERE id = ?");
  await stmt.bind(id).run();
}

export async function getContentById(db: D1Database, id: string): Promise<ContentRecord | null> {
  const stmt = db.prepare("SELECT * FROM content WHERE id = ?");
  const row = await stmt.bind(id).first<DBContentRow>();

  if (!row) {
    return null;
  }

  return rowToRecord(row);
}

export async function listContent(db: D1Database): Promise<ContentRecord[]> {
  const stmt = db.prepare(`
    SELECT * FROM content
    ORDER BY created_at DESC
  `);

  const result = await stmt.all<DBContentRow>();

  return result.results.map(rowToRecord);
}
