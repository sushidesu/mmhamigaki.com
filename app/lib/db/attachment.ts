import type {
  AttachmentRecord,
  CreateAttachmentInput,
  AttachmentMetadata,
} from "../../types/admin";

interface DBAttachmentRow {
  id: string;
  content_id: string;
  type: string;
  storage_key: string | null;
  body: string | null;
  metadata: string; // JSON string
  order_index: number;
  created_at: number;
}

function rowToAttachment(row: DBAttachmentRow): AttachmentRecord {
  return {
    id: row.id,
    contentId: row.content_id,
    type: row.type as AttachmentRecord["type"],
    storageKey: row.storage_key,
    body: row.body,
    metadata: JSON.parse(row.metadata) as AttachmentMetadata,
    orderIndex: row.order_index,
    createdAt: row.created_at,
  };
}

/**
 * Create a new attachment
 */
export async function createAttachment(
  db: D1Database,
  contentId: string,
  data: CreateAttachmentInput,
): Promise<AttachmentRecord> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  const stmt = db.prepare(`
    INSERT INTO attachment (
      id, content_id, type, storage_key, body, metadata, order_index, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  await stmt
    .bind(
      id,
      contentId,
      data.type,
      data.storageKey || null,
      data.body || null,
      JSON.stringify(data.metadata || {}),
      data.orderIndex,
      now,
    )
    .run();

  return {
    id,
    contentId,
    type: data.type,
    storageKey: data.storageKey || null,
    body: data.body || null,
    metadata: data.metadata || {},
    orderIndex: data.orderIndex,
    createdAt: now,
  };
}

/**
 * Update an attachment
 */
export async function updateAttachment(
  db: D1Database,
  id: string,
  data: Partial<Omit<CreateAttachmentInput, "orderIndex">>,
): Promise<AttachmentRecord | null> {
  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.type !== undefined) {
    updates.push("type = ?");
    values.push(data.type);
  }
  if (data.storageKey !== undefined) {
    updates.push("storage_key = ?");
    values.push(data.storageKey);
  }
  if (data.body !== undefined) {
    updates.push("body = ?");
    values.push(data.body);
  }
  if (data.metadata !== undefined) {
    updates.push("metadata = ?");
    values.push(JSON.stringify(data.metadata));
  }

  if (updates.length === 0) {
    return getAttachmentById(db, id);
  }

  values.push(id);

  const stmt = db.prepare(`
    UPDATE attachment
    SET ${updates.join(", ")}
    WHERE id = ?
  `);

  await stmt.bind(...values).run();

  return getAttachmentById(db, id);
}

/**
 * Delete an attachment
 */
export async function deleteAttachment(db: D1Database, id: string): Promise<void> {
  const stmt = db.prepare("DELETE FROM attachment WHERE id = ?");
  await stmt.bind(id).run();
}

/**
 * Get attachment by ID
 */
export async function getAttachmentById(
  db: D1Database,
  id: string,
): Promise<AttachmentRecord | null> {
  const stmt = db.prepare("SELECT * FROM attachment WHERE id = ?");
  const row = await stmt.bind(id).first<DBAttachmentRow>();

  if (!row) {
    return null;
  }

  return rowToAttachment(row);
}

/**
 * Get all attachments for a content (ordered by order_index)
 */
export async function getAttachmentsByContentId(
  db: D1Database,
  contentId: string,
): Promise<AttachmentRecord[]> {
  const stmt = db.prepare(`
    SELECT * FROM attachment
    WHERE content_id = ?
    ORDER BY order_index ASC
  `);

  const result = await stmt.bind(contentId).all<DBAttachmentRow>();

  return result.results.map(rowToAttachment);
}

/**
 * Reorder attachments for a content
 * @param attachmentIds Array of attachment IDs in the new order
 */
export async function reorderAttachments(
  db: D1Database,
  contentId: string,
  attachmentIds: string[],
): Promise<void> {
  // Update order_index for each attachment
  const batch = db.batch(
    attachmentIds.map((id, index) =>
      db
        .prepare("UPDATE attachment SET order_index = ? WHERE id = ? AND content_id = ?")
        .bind(index, id, contentId),
    ),
  );

  await batch;
}

/**
 * Delete all attachments for a content
 * (Usually not needed due to ON DELETE CASCADE, but useful for manual cleanup)
 */
export async function deleteAttachmentsByContentId(
  db: D1Database,
  contentId: string,
): Promise<void> {
  const stmt = db.prepare("DELETE FROM attachment WHERE content_id = ?");
  await stmt.bind(contentId).run();
}
