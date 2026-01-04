import { useState } from "hono/jsx";
import type { ContentRecord } from "../types/admin";
import { getAdminApi } from "../lib/admin-client";

interface PostListProps {
  posts: ContentRecord[];
}

export default function PostList({ posts: initialPosts }: PostListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;

    setDeletingId(id);
    try {
      const api = getAdminApi();
      await api.deleteContent(id);
      setPosts(posts.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("削除に失敗しました: " + error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h2 class="text-lg font-medium">Posts</h2>
        <a
          href="/admin/posts/new"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          New Post
        </a>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Published
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {posts.map((post) => (
              <tr key={post.id}>
                <td class="px-6 py-4 whitespace-nowrap">{post.title}</td>
                <td class="px-6 py-4 whitespace-nowrap">{post.slug}</td>
                <td class="px-6 py-4 whitespace-nowrap">{post.published ? "✓" : ""}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {new Date(post.createdAt * 1000).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap space-x-2">
                  <a
                    href={`/admin/posts/${post.id}/edit`}
                    class="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </a>
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={deletingId === post.id}
                    class="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {deletingId === post.id ? "削除中..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
