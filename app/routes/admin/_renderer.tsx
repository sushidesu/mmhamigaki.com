import { jsxRenderer } from "hono/jsx-renderer";
import { Link, Script } from "honox/server";

export default jsxRenderer(({ children }) => {
  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Admin - mmhamigaki.com</title>
        <Link rel="stylesheet" href="/app/styles/input.css" />
        <Script src="/app/client.ts" />
      </head>
      <body class="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
});
