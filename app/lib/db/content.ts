import type {
  ContentRecord,
  CreateContentInput,
  UpdateContentInput,
  AttachmentRecord,
  ContentType,
} from "../../types/admin";
import type { PostMetadata } from "../../types/post";
import { createAttachment, getAttachmentsByContentId } from "./attachment";

interface DBContentRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  published: number; // SQLite stores boolean as 0/1
  created_at: number;
  updated_at: number;
  published_at: number | null;
  tags: string; // JSON string
}

function rowToRecord(row: DBContentRow, attachments: AttachmentRecord[]): ContentRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    published: Boolean(row.published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    tags: JSON.parse(row.tags),
    attachments,
  };
}

export async function createContent(
  db: D1Database,
  data: CreateContentInput,
): Promise<ContentRecord> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const publishedAt = data.published ? now : null;

  // Create content record
  const stmt = db.prepare(`
    INSERT INTO content (
      id, slug, title, description, published,
      created_at, updated_at, published_at, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  await stmt
    .bind(
      id,
      data.slug,
      data.title,
      data.description,
      data.published ? 1 : 0,
      now,
      now,
      publishedAt,
      JSON.stringify(data.tags),
    )
    .run();

  // Create attachments
  const attachments: AttachmentRecord[] = [];
  for (const attachmentData of data.attachments) {
    const attachment = await createAttachment(db, id, attachmentData);
    attachments.push(attachment);
  }

  return {
    id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    published: data.published,
    createdAt: now,
    updatedAt: now,
    publishedAt,
    tags: data.tags,
    attachments,
  };
}

export async function updateContent(
  db: D1Database,
  id: string,
  data: UpdateContentInput,
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

  // Get attachments for this content
  const attachments = await getAttachmentsByContentId(db, id);

  return rowToRecord(row, attachments);
}

export async function listContent(db: D1Database): Promise<ContentRecord[]> {
  const stmt = db.prepare(`
    SELECT * FROM content
    ORDER BY created_at DESC
  `);

  const result = await stmt.all<DBContentRow>();

  // Get attachments for each content
  const records = await Promise.all(
    result.results.map(async (row) => {
      const attachments = await getAttachmentsByContentId(db, row.id);
      return rowToRecord(row, attachments);
    }),
  );

  return records;
}

export async function getContentBySlug(
  db: D1Database,
  slug: string,
): Promise<ContentRecord | null> {
  const stmt = db.prepare("SELECT * FROM content WHERE slug = ?");
  const row = await stmt.bind(slug).first<DBContentRow>();

  if (!row) {
    return null;
  }

  // Get attachments for this content
  const attachments = await getAttachmentsByContentId(db, row.id);

  return rowToRecord(row, attachments);
}

/**
 * Get contents filtered by type
 */
export async function getContentsByType(
  db: D1Database,
  type: ContentType,
): Promise<ContentRecord[]> {
  // Get content IDs that have the specified type as their first attachment
  const stmt = db.prepare(`
    SELECT DISTINCT c.*
    FROM content c
    INNER JOIN attachment a ON c.id = a.content_id
    WHERE a.order_index = 0 AND a.type = ?
    ORDER BY c.created_at DESC
  `);

  const result = await stmt.bind(type).all<DBContentRow>();

  // Get attachments for each content
  const records = await Promise.all(
    result.results.map(async (row) => {
      const attachments = await getAttachmentsByContentId(db, row.id);
      return rowToRecord(row, attachments);
    }),
  );

  return records;
}

/**
 * Get published contents (for public display)
 */
export async function getPublishedContents(db: D1Database): Promise<ContentRecord[]> {
  const stmt = db.prepare(`
    SELECT * FROM content
    WHERE published = 1
    ORDER BY published_at DESC, created_at DESC
  `);

  const result = await stmt.all<DBContentRow>();

  // Get attachments for each content
  const records = await Promise.all(
    result.results.map(async (row) => {
      const attachments = await getAttachmentsByContentId(db, row.id);
      return rowToRecord(row, attachments);
    }),
  );

  return records;
}

export function contentRecordToPostMetadata(record: ContentRecord): PostMetadata {
  return {
    title: record.title,
    description: record.description,
    date: new Date((record.publishedAt || record.createdAt) * 1000).toISOString().split("T")[0],
    tags: record.tags,
    slug: record.slug,
    published: record.published,
  };
}
