export interface PostMetadata {
  title: string;
  description: string;
  date: string;
  tags: string[];
  slug: string;
  published: boolean;
}

export interface Post {
  metadata: PostMetadata;
  content: string;
  html: string;
}
