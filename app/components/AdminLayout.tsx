export function AdminLayout({ children }: { children: any }) {
  return (
    <>
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <h1 class="text-2xl font-bold">mmhamigaki.com Admin</h1>
        </div>
      </header>
      <main class="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </>
  );
}
