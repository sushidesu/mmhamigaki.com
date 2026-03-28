import type { BlogPostWithContent } from "../db/schema";

type Props = {
  recentPosts: BlogPostWithContent[];
};

export function Home({ recentPosts }: Props) {
  return (
    <div>
      <section>
        <h1>mmhamigaki</h1>
        <p>プロフィールテキスト</p>
      </section>

      <section>
        <h2>最新の記事</h2>
        {recentPosts.length === 0 ? (
          <p>記事はまだありません。</p>
        ) : (
          <ul>
            {recentPosts.map((post) => (
              <li key={post.id}>
                <a href={`/blog/${post.slug}`}>{post.title}</a>
                {post.published_at && (
                  <time dateTime={new Date(post.published_at).toISOString()}>
                    {new Date(post.published_at).toLocaleDateString("ja-JP")}
                  </time>
                )}
              </li>
            ))}
          </ul>
        )}
        <a href="/blog">すべての記事を見る</a>
      </section>
    </div>
  );
}
