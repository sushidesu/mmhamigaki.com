import type { FC } from "hono/jsx";

export const Navigation: FC = () => {
  return (
    <nav class="mb-8">
      <a href="/" class="text-link-blue hover:underline inline-flex items-center gap-2">
        <span>←</span>
        <span>Home</span>
      </a>
    </nav>
  );
};
