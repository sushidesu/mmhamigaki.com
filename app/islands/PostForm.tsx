import { useState } from "hono/jsx";
import type { ContentRecord } from "../types/admin";
import { getAdminApi } from "../lib/admin-client";

interface PostFormProps {
  post?: ContentRecord;
  markdown?: string;
}

export default function PostForm({ post, markdown }: PostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!post;

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const data = {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
      markdown: formData.get("markdown") as string,
      tags: (formData.get("tags") as string)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      published: formData.get("published") === "on",
    };

    try {
      const api = getAdminApi();
      if (isEdit && post) {
        // @ts-expect-error - Cap'n Web RPC type inference limitation
        await api.updatePost(post.id, data);
      } else {
        await api.createPost(data);
      }
      window.location.href = "/admin/posts";
    } catch (error) {
      console.error("Failed to save post:", error);
      alert("Failed to save post: " + error);
      setIsSubmitting(false);
    }
  };

  return (
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:px-6">
        <h2 class="text-lg font-medium">{isEdit ? "Edit Post" : "New Post"}</h2>
      </div>
      <form onSubmit={handleSubmit} class="px-4 py-5 sm:p-6 space-y-6">
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            value={post?.title || ""}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label for="slug" class="block text-sm font-medium text-gray-700">
            Slug
          </label>
          <input
            type="text"
            name="slug"
            id="slug"
            required
            value={post?.slug || ""}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            rows={3}
            value={post?.description || ""}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label for="tags" class="block text-sm font-medium text-gray-700">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            name="tags"
            id="tags"
            value={post?.tags.join(", ") || ""}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label for="markdown" class="block text-sm font-medium text-gray-700">
            Markdown Content
          </label>
          <textarea
            name="markdown"
            id="markdown"
            rows={20}
            required={!isEdit}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm font-mono text-sm"
          >
            {markdown || ""}
          </textarea>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            name="published"
            id="published"
            checked={post?.published || false}
            class="h-4 w-4 text-blue-600 rounded"
          />
          <label for="published" class="ml-2 block text-sm text-gray-900">
            Published
          </label>
        </div>

        <div class="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "保存中..." : (isEdit ? "Update" : "Create") + " Post"}
          </button>
          <a
            href="/admin/posts"
            class="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
