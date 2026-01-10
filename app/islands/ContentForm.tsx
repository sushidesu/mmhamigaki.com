import { useState } from "hono/jsx";
import type { ContentRecord, CreateAttachmentInput } from "../types/admin";
import { getAdminApi } from "../lib/admin-client";
import AttachmentUploader from "./AttachmentUploader";

interface ContentFormProps {
  content?: ContentRecord;
}

export default function ContentForm({ content }: ContentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<CreateAttachmentInput[]>(
    content
      ? content.attachments.map((att) => ({
          type: att.type,
          storageKey: att.storageKey ?? undefined,
          body: att.body ?? undefined,
          metadata: att.metadata,
          orderIndex: att.orderIndex,
        }))
      : [],
  );
  const isEdit = !!content;

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const tags = (formData.get("tags") as string)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const published = formData.get("published") === "on";
    const finalAttachments = attachments.map((att, index) => ({
      type: att.type,
      storageKey: att.storageKey,
      body: att.body,
      metadata: att.metadata,
      orderIndex: att.orderIndex ?? index,
    }));

    // Validate attachments
    if (finalAttachments.length === 0) {
      alert("Please add at least one attachment");
      setIsSubmitting(false);
      return;
    }

    try {
      const api = getAdminApi();
      if (isEdit && content) {
        // For update, only update metadata (attachments are not updated yet in Phase 2)
        await api.updateContent(content.id, {
          title,
          slug,
          description,
          tags,
          published,
        });
      } else {
        // For create, use attachments defined via the builder
        await api.createContent({
          title,
          slug,
          description,
          tags,
          published,
          attachments: finalAttachments,
        });
      }
      window.location.href = "/admin/posts";
    } catch (error) {
      console.error("Failed to save content:", error);
      alert("Failed to save content: " + error);
      setIsSubmitting(false);
    }
  };

  return (
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:px-6">
        <h2 class="text-lg font-medium">{isEdit ? "Edit Content" : "New Content"}</h2>
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
            value={content?.title || ""}
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
            value={content?.slug || ""}
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
            value={content?.description || ""}
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
            value={content?.tags.join(", ") || ""}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div class="border rounded-lg p-4 space-y-4">
          <div>
            <h3 class="text-sm font-medium text-gray-700">Attachments</h3>
            <p class="text-sm text-gray-500">
              1つ目のアタッチメントがコンテンツタイプを決定します。テキストやメディアを必要なだけ追加してください。
            </p>
          </div>
          <AttachmentUploader initialAttachments={attachments} onChange={setAttachments} />
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            name="published"
            id="published"
            checked={content?.published || false}
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
            {isSubmitting ? "保存中..." : (isEdit ? "Update" : "Create") + " Content"}
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
