import type { FC } from "hono/jsx";
import { Layout } from "../components/Layout";
import { Navigation } from "../components/Navigation";
import { PostHeader } from "../components/PostHeader";
import { PostCard } from "../components/PostCard";
import type { PostMetadata } from "../types/post";

interface PostPageProps {
  metadata: PostMetadata;
  content: string;
}

const PostPage: FC<PostPageProps> = ({ metadata, content }) => {
  return (
    <Layout
      title={metadata.title}
      description={metadata.description}
      ogImage={`/og-image/${metadata.slug}`}
      ogType="article"
    >
      <div class="max-w-3xl mx-auto px-8 py-8">
        <Navigation />
        <article>
          <PostHeader title={metadata.title} date={metadata.date} tags={metadata.tags} />
          <div class="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        </article>
      </div>
    </Layout>
  );
};

interface HomePageProps {
  posts: Array<{
    title: string;
    slug: string;
    date: string;
    description: string;
  }>;
}

const HomePage: FC<HomePageProps> = ({ posts }) => {
  return (
    <Layout title="mmhamigaki.com" description="Blog posts and media">
      <div class="max-w-3xl mx-auto px-8 py-8">
        <h1 class="text-4xl font-bold mb-8">mmhamigaki.com</h1>
        <ul class="list-none p-0">
          {posts.map((post) => (
            <PostCard key={post.slug} {...post} />
          ))}
        </ul>
      </div>
    </Layout>
  );
};

// Export render functions for compatibility with existing routes
export function renderPostPage(metadata: PostMetadata, content: string): string {
  return `<!DOCTYPE html>${PostPage({ metadata, content })}`;
}

export function renderHomepage(
  posts: Array<{ title: string; slug: string; date: string; description: string }>,
): string {
  return `<!DOCTYPE html>${HomePage({ posts })}`;
}
