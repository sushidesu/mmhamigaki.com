export function AdminLayout({ children }: { children: any }) {
  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Admin - mmhamigaki.com</title>
        <script type="module" src="/admin-bundle.js"></script>
      </head>
      <body class="min-h-screen bg-gray-50">
        <header class="bg-white shadow">
          <div class="max-w-7xl mx-auto px-4 py-4">
            <h1 class="text-2xl font-bold">mmhamigaki.com Admin</h1>
          </div>
        </header>
        <main class="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
