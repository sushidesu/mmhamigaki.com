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

  const getAcceptTypes = (type: ContentType): string => {
    switch (type) {
      case "post":
      case "illustration":
        return "image/*";
      case "music":
        return "image/*,audio/*";
      case "video":
      case "live":
        return "video/*,image/*";
      default:
        return "*/*";
    }
  };

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <label class="block text-sm font-medium text-gray-700">
          Attachments
          {attachments.length > 0 && (
            <span class="ml-2 text-xs text-gray-500">
              (Content type: {attachments[0]?.type || "none"})
            </span>
          )}
        </label>
        <div class="flex gap-2">
          <select id="attachment-type" class="text-sm rounded-md border-gray-300">
            <option value="post">Post</option>
            <option value="music">Music</option>
            <option value="illustration">Illustration</option>
            <option value="video">Video</option>
            <option value="live">LIVE</option>
          </select>
          <button
            type="button"
            onClick={() => {
              const select = document.getElementById("attachment-type");
              if (select instanceof HTMLSelectElement) {
                const type = select.value as ContentType;
                addTextAttachment(type);
              }
            }}
            class="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
          >
            + Text
          </button>
          <label class="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 cursor-pointer">
            + Media
            <input
              type="file"
              class="hidden"
              onChange={(e) => {
                const select = document.getElementById("attachment-type");
                if (select instanceof HTMLSelectElement) {
                  const type = select.value as ContentType;
                  handleFileChange(e, type);
                }
              }}
              accept={getAcceptTypes("post")}
            />
          </label>
        </div>
      </div>

      {attachments.length === 0 && (
        <div class="text-sm text-gray-500 italic p-4 border border-dashed rounded">
          No attachments yet. Add text or media attachments above.
        </div>
      )}

      {attachments.map((attachment, index) => (
        <div
          key={attachment.id}
          class={`border rounded-lg p-4 ${attachment.uploading ? "bg-yellow-50 border-yellow-300" : "bg-gray-50"}`}
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-medium text-gray-600">
                  #{index} - {attachment.type}
                </span>
                {index === 0 && (
                  <span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Determines content type
                  </span>
                )}
                {attachment.uploading && (
                  <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded animate-pulse">
                    Uploading...
                  </span>
                )}
              </div>

              {attachment.body !== undefined && attachment.body !== null ? (
                <textarea
                  value={attachment.body}
                  onInput={(e) => {
                    const newAttachments = [...attachments];
                    newAttachments[index] = {
                      ...newAttachments[index],
                      body: (e.target as HTMLTextAreaElement).value,
                    };
                    updateAttachments(newAttachments);
                  }}
                  rows={4}
                  placeholder="Markdown content..."
                  class="w-full rounded border-gray-300 font-mono text-sm"
                />
              ) : (
                <div class="flex items-center gap-2">
                  {attachment.previewUrl && (
                    <img
                      src={attachment.previewUrl}
                      alt="Preview"
                      class="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div class="text-sm">
                    <div class="font-medium">{attachment.storageKey}</div>
                    <div class="text-gray-500">{attachment.metadata?.mimeType}</div>
                  </div>
                </div>
              )}
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
