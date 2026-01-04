// Content types
export type ContentType = "post" | "music" | "illustration" | "video" | "live";

// Attachment metadata structure
export interface AttachmentMetadata {
  mimeType?: string;
  aspectRatio?: string; // e.g., "16:9", "1:1", "4:3"
  width?: number;
  height?: number;
  duration?: number; // for audio/video in seconds
  alt?: string;
}

// Attachment record (from database)
export interface AttachmentRecord {
  id: string;
  contentId: string;
  type: ContentType;
  storageKey: string | null; // R2 path for media files
  body: string | null; // Text content (markdown)
  metadata: AttachmentMetadata;
  orderIndex: number;
  createdAt: number;
}

// Content record (from database, includes attachments via JOIN)
export interface ContentRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  published: boolean;
  createdAt: number;
  updatedAt: number;
  publishedAt: number | null;
  tags: string[];
  attachments: AttachmentRecord[];
}

// Input for creating an attachment
export interface CreateAttachmentInput {
  type: ContentType;
  storageKey?: string;
  body?: string;
  metadata?: AttachmentMetadata;
  orderIndex: number;
}

// Input for creating content
export interface CreateContentInput {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  published: boolean;
  attachments: CreateAttachmentInput[];
}

// Input for updating content
export interface UpdateContentInput {
  slug?: string;
  title?: string;
  description?: string;
  tags?: string[];
  published?: boolean;
}

// Helper function to get content type from attachments
export function getContentType(content: ContentRecord): ContentType {
  if (!content.attachments || content.attachments.length === 0) {
    return "post"; // Default to post if no attachments
  }
  // Content type is determined by the first attachment (orderIndex = 0)
  const firstAttachment =
    content.attachments.find((a) => a.orderIndex === 0) || content.attachments[0];
  return firstAttachment.type;
}

// Helper function to get body content from attachments
export function getContentBody(content: ContentRecord): string | null {
  const bodyAttachment = content.attachments.find((a) => a.body !== null);
  return bodyAttachment?.body || null;
}
