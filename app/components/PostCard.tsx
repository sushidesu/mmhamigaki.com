import type { FC } from "hono/jsx";

interface PostCardProps {
  title: string;
  slug: string;
  date: string;
  description: string;
}

export const PostCard: FC<PostCardProps> = ({ title, slug, date, description }) => {
  return (
    <li class="mb-8 pb-8 border-b border-gray-200 last:border-b-0">
      <h2 class="text-2xl font-semibold mb-2">
        <a href={`/posts/${slug}`} class="text-link-blue hover:underline">
          {title}
        </a>
      </h2>
      <time datetime={date} class="text-text-muted text-sm">
        {date}
      </time>
      <p class="mt-2 text-text-body">{description}</p>
    </li>
  );
};
