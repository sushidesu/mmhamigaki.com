import type { AttachmentMetadata } from "../types/admin";

/**
 * Extract metadata from media files
 */

export async function extractImageMetadata(file: File | Blob): Promise<AttachmentMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const aspectRatio = calculateAspectRatio(width, height);

      URL.revokeObjectURL(url);

      resolve({
        mimeType: file.type,
        width,
        height,
        aspectRatio,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

export async function extractAudioMetadata(file: File | Blob): Promise<AttachmentMetadata> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);

    audio.onloadedmetadata = () => {
      const duration = Math.floor(audio.duration);

      URL.revokeObjectURL(url);

      resolve({
        mimeType: file.type,
        duration,
      });
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load audio"));
    };

    audio.src = url;
  });
}

export async function extractVideoMetadata(file: File | Blob): Promise<AttachmentMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      const aspectRatio = calculateAspectRatio(width, height);
      const duration = Math.floor(video.duration);

      URL.revokeObjectURL(url);

      resolve({
        mimeType: file.type,
        width,
        height,
        aspectRatio,
        duration,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video"));
    };

    video.src = url;
  });
}

/**
 * Extract metadata from any media file based on its MIME type
 */
export async function extractMediaMetadata(file: File): Promise<AttachmentMetadata> {
  const mimeType = file.type;

  if (mimeType.startsWith("image/")) {
    return extractImageMetadata(file);
  } else if (mimeType.startsWith("audio/")) {
    return extractAudioMetadata(file);
  } else if (mimeType.startsWith("video/")) {
    return extractVideoMetadata(file);
  } else {
    // For other file types, just return basic metadata
    return {
      mimeType: file.type,
    };
  }
}

/**
 * Calculate aspect ratio as a string (e.g., "16:9", "1:1")
 */
function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const ratioW = width / divisor;
  const ratioH = height / divisor;

  // Common aspect ratios
  const commonRatios: Record<string, string> = {
    "16:9": "16:9",
    "1:1": "1:1",
    "4:3": "4:3",
    "3:2": "3:2",
    "21:9": "21:9",
    "9:16": "9:16", // vertical
    "3:4": "3:4", // vertical
  };

  const ratioStr = `${ratioW}:${ratioH}`;
  return commonRatios[ratioStr] || ratioStr;
}
