import type { BlogPostWithContent } from "../../db/schema";

type Props = {
  posts: BlogPostWithContent[];
};

export function BlogList({ posts }: Props) {
  return (
    <div>
      <h1>Blog</h1>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <a href={`/blog/${post.slug}`}>
                <h2>{post.title}</h2>
              </a>
              {post.excerpt && <p>{post.excerpt}</p>}
              {post.published_at && (
                <time dateTime={new Date(post.published_at).toISOString()}>
                  {new Date(post.published_at).toLocaleDateString("ja-JP")}
                </time>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
