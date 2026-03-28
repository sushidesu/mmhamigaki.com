export type ContentType = "blog" | "audio" | "video" | "stream";
export type ContentStatus = "draft" | "published" | "archived";

export type ContentItem = {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  status: ContentStatus;
  published_at: number | null;
  created_at: number;
  updated_at: number;
};

export type BlogPost = {
  content_id: string;
  body: string;
  excerpt: string | null;
  cover_image_url: string | null;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
};

// Joined types
export type BlogPostWithContent = ContentItem & BlogPost;

export type BlogPostWithTags = BlogPostWithContent & {
  tags: Tag[];
};
