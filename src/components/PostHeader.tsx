import type { FC } from "hono/jsx";

interface PostHeaderProps {
  title: string;
  date: string;
  tags: string[];
}

export const PostHeader: FC<PostHeaderProps> = ({ title, date, tags }) => {
  return (
    <header class="mb-6">
      <h1 class="text-4xl font-bold mb-2">{title}</h1>
      <time datetime={date} class="text-text-muted text-sm">
        {date}
      </time>
      {tags.length > 0 && (
        <div class="flex gap-2 mt-4 flex-wrap">
          {tags.map((tag) => (
            <span key={tag} class="bg-tag-bg px-3 py-1 rounded text-sm">
              {tag}
            </span>
          ))}
        </div>
      )}
    </header>
  );
};
