import { useState } from "hono/jsx";
import type { ContentType, AttachmentMetadata, CreateAttachmentInput } from "../types/admin";
import { extractMediaMetadata } from "../lib/media-metadata";

interface AttachmentUploaderProps {
  initialAttachments?: CreateAttachmentInput[];
  onChange?: (attachments: CreateAttachmentInput[]) => void;
}

interface AttachmentItem extends CreateAttachmentInput {
  id: string; // Temporary ID for UI management
  previewUrl?: string; // For image preview
  uploading?: boolean; // Upload in progress
}

interface UploadResponse {
  storageKey: string;
  metadata: AttachmentMetadata;
  size: number;
}

const TYPE_OPTIONS: Array<{
  value: ContentType;
  label: string;
  description: string;
  accept: string;
}> = [
  {
    value: "post",
    label: "Post",
    description: "テキスト主体の記事。markdown と画像の組み合わせを扱います。",
    accept: "image/*",
  },
  {
    value: "music",
    label: "Music",
    description: "音源とカバービジュアル。音声 + 説明文を追加できます。",
    accept: "audio/*,image/*",
  },
  {
    value: "illustration",
    label: "Illustration",
    description: "イラストや漫画ページなどの静止画。",
    accept: "image/*",
  },
  {
    value: "video",
    label: "Video",
    description: "動画コンテンツ。必要に応じてサムネイルや説明を記載します。",
    accept: "video/*,image/*",
  },
  {
    value: "live",
    label: "LIVE",
    description: "ライブ配信アーカイブや告知。",
    accept: "video/*,image/*",
  },
];

export default function AttachmentUploader({
  initialAttachments = [],
  onChange,
}: AttachmentUploaderProps) {
  const [attachments, setAttachments] = useState<AttachmentItem[]>(
    initialAttachments.map((att, idx) => ({
      ...att,
      id: `att-${idx}`,
    })),
  );
  const [selectedType, setSelectedType] = useState<ContentType>("post");

  const updateAttachments = (newAttachments: AttachmentItem[]) => {
    // Update order indices
    const updated = newAttachments.map((att, idx) => ({
      ...att,
      orderIndex: idx,
    }));
    setAttachments(updated);
    onChange?.(updated);
  };

  const addTextAttachment = (type: ContentType) => {
    const newAttachment: AttachmentItem = {
      id: `att-${Date.now()}`,
      type,
      body: "",
      metadata: { mimeType: "text/markdown" },
      orderIndex: attachments.length,
    };
    updateAttachments([...attachments, newAttachment]);
  };

  const addMediaAttachment = async (type: ContentType, file: File) => {
    // Create a temporary attachment to show upload progress
    const tempId = `att-${Date.now()}`;
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;

    const tempAttachment: AttachmentItem = {
      id: tempId,
      type,
      metadata: {
        mimeType: file.type,
      },
      orderIndex: attachments.length,
      previewUrl,
      uploading: true,
    };

    updateAttachments([...attachments, tempAttachment]);

    try {
      // Extract metadata from the file
      const metadata = await extractMediaMetadata(file);

      // Upload file to R2
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload-media", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = (await response.json()) as UploadResponse;

      // Update the attachment with the actual storage key
      const updatedAttachments = attachments.map((att) =>
        att.id === tempId
          ? {
              ...att,
              storageKey: result.storageKey,
              metadata: { ...metadata, ...result.metadata },
              uploading: false,
            }
          : att,
      );

      // Add the newly uploaded attachment if it's not already in the list
      const uploadedAttachment: AttachmentItem = {
        id: tempId,
        type,
        storageKey: result.storageKey,
        metadata: { ...metadata, ...result.metadata },
        orderIndex: attachments.findIndex((a) => a.id === tempId),
        previewUrl,
        uploading: false,
      };

      const finalAttachments = updatedAttachments.some((a) => a.id === tempId)
        ? updatedAttachments
        : [...attachments.filter((a) => a.id !== tempId), uploadedAttachment];

      updateAttachments(finalAttachments);
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Failed to upload file: ${error}`);
      // Remove the failed attachment
      updateAttachments(attachments.filter((att) => att.id !== tempId));
    }
  };

  const removeAttachment = (id: string) => {
    updateAttachments(attachments.filter((att) => att.id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newAttachments = [...attachments];
    [newAttachments[index - 1], newAttachments[index]] = [
      newAttachments[index],
      newAttachments[index - 1],
    ];
    updateAttachments(newAttachments);
  };

  const moveDown = (index: number) => {
    if (index === attachments.length - 1) return;
    const newAttachments = [...attachments];
    [newAttachments[index], newAttachments[index + 1]] = [
      newAttachments[index + 1],
      newAttachments[index],
    ];
    updateAttachments(newAttachments);
  };

  const handleFileChange = async (e: Event, type: ContentType) => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    await addMediaAttachment(type, file);
    input.value = ""; // Reset input
  };

  const selectedTypeInfo =
    TYPE_OPTIONS.find((opt) => opt.value === selectedType) ?? TYPE_OPTIONS[0];

  return (
    <div class="space-y-4">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-700">Content type</p>
            <p class="text-xs text-gray-500">1つ目のアタッチメントがページのタイプを決定します。</p>
          </div>
          {attachments.length > 0 && (
            <span class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
              Current: {attachments[0].type}
            </span>
          )}
        </div>
        <div class="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => setSelectedType(opt.value)}
              class={`px-3 py-1 rounded border text-sm ${
                selectedType === opt.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p class="text-xs text-gray-500">{selectedTypeInfo.description}</p>
        <button
          type="button"
          onClick={() => addTextAttachment(selectedType)}
          class="text-sm bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          選択中のタイプでアタッチメントを追加
        </button>
      </div>

      {attachments.length === 0 && (
        <div class="text-sm text-gray-500 italic p-4 border border-dashed rounded">
          アタッチメントがまだありません。上のボタンから追加してください。
        </div>
      )}

      {attachments.map((attachment, index) => (
        <div
          key={attachment.id}
          class={`border rounded-lg p-4 ${attachment.uploading ? "bg-yellow-50 border-yellow-300" : "bg-gray-50"}`}
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 space-y-3">
              <div class="flex items-center flex-wrap gap-2">
                <select
                  class="text-xs rounded border-gray-300"
                  value={attachment.type}
                  onChange={(e) => {
                    const target = e.target as HTMLSelectElement;
                    const newAttachments = [...attachments];
                    newAttachments[index] = {
                      ...newAttachments[index],
                      type: target.value as ContentType,
                    };
                    updateAttachments(newAttachments);
                  }}
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span class="text-xs text-gray-500">#{index}</span>
                {index === 0 && (
                  <span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Content type source
                  </span>
                )}
                {attachment.uploading && (
                  <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded animate-pulse">
                    Uploading...
                  </span>
                )}
              </div>

              <div class="space-y-2">
                <label class="text-xs font-medium text-gray-600">Media</label>
                <div class="flex items-center gap-3">
                  {attachment.previewUrl && (
                    <img
                      src={attachment.previewUrl}
                      alt="Preview"
                      class="w-20 h-20 object-cover rounded border"
                    />
                  )}
                  <div class="flex-1 text-sm space-y-1">
                    <div class="font-medium break-all">
                      {attachment.storageKey || "未アップロード"}
                    </div>
                    <div class="text-gray-500">{attachment.metadata?.mimeType || "--"}</div>
                  </div>
                  <label class="text-xs bg-blue-600 text-white px-3 py-1 rounded cursor-pointer hover:bg-blue-700">
                    アップロード
                    <input
                      type="file"
                      class="hidden"
                      onChange={(e) => handleFileChange(e, attachment.type)}
                      accept={TYPE_OPTIONS.find((t) => t.value === attachment.type)?.accept}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">
                  Body / Description (optional)
                </label>
                <textarea
                  value={attachment.body ?? ""}
                  onInput={(e) => {
                    const newAttachments = [...attachments];
                    newAttachments[index] = {
                      ...newAttachments[index],
                      body: (e.target as HTMLTextAreaElement).value,
                    };
                    updateAttachments(newAttachments);
                  }}
                  rows={4}
                  placeholder="Markdown body, captions, lyrics, etc."
                  class="w-full rounded border-gray-300 font-mono text-sm"
                />
              </div>
            </div>

            <div class="flex flex-col gap-1 ml-4">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                class="text-xs px-2 py-1 bg-gray-200 rounded disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === attachments.length - 1}
                class="text-xs px-2 py-1 bg-gray-200 rounded disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                class="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
