import { marked } from "marked";
import type { BlogPostWithTags } from "../../db/schema";

type Props = {
  post: BlogPostWithTags;
};

export function BlogDetail({ post }: Props) {
  const bodyHtml = marked(post.body) as string;

  return (
    <article>
      <h1>{post.title}</h1>
      {post.published_at && (
        <time dateTime={new Date(post.published_at).toISOString()}>
          {new Date(post.published_at).toLocaleDateString("ja-JP")}
        </time>
      )}
      {post.tags.length > 0 && (
        <ul>
          {post.tags.map((tag) => (
            <li key={tag.id}>{tag.name}</li>
          ))}
        </ul>
      )}
      {post.cover_image_url && <img src={post.cover_image_url} alt={post.title} />}
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </article>
  );
}
