export interface CreatePostInput {
  slug: string;
  title: string;
  description: string;
  markdown: string;
  tags: string[];
  published: boolean;
}

export interface UpdatePostInput {
  slug?: string;
  title?: string;
  description?: string;
  markdown?: string;
  tags?: string[];
  published?: boolean;
}

export interface ContentRecord {
  id: string;
  type: string;
  slug: string;
  title: string;
  description: string;
  published: boolean;
  createdAt: number;
  updatedAt: number;
  publishedAt: number | null;
  tags: string[];
  storageKey: string;
}
