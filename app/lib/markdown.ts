import { marked } from "marked";
import { parseFrontmatter } from "./frontmatter";
import type { Post, PostMetadata } from "../types/post";

export async function parseMarkdown(content: string): Promise<Post> {
  const { data, content: markdown } = parseFrontmatter(content);

  const metadata: PostMetadata = {
    title: data.title || "Untitled",
    description: data.description || "",
    date: data.date || new Date().toISOString().split("T")[0],
    tags: data.tags || [],
    slug: data.slug || "",
    published: data.published ?? true,
  };

  const html = await marked.parse(markdown);

  return {
    metadata,
    content: markdown,
    html,
  };
}
