import type { FC } from "hono/jsx";
import { globalStyles } from "../lib/styles";

interface LayoutProps {
  title: string;
  description: string;
  children: any;
  ogImage?: string;
  ogType?: "website" | "article";
}

export const Layout: FC<LayoutProps> = ({
  title,
  description,
  children,
  ogImage,
  ogType = "website",
}) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:type" content={ogType} />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
};
