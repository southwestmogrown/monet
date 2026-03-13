const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.7;
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Compresses an image data URL to at most MAX_DIMENSION × MAX_DIMENSION
 * at JPEG_QUALITY quality. Rejects if the compressed size still exceeds 2 MB.
 */
export function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Scale down preserving aspect ratio
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

      // Estimate byte size from base64 portion (4 chars → 3 bytes)
      const base64Data = compressed.split(",")[1] ?? "";
      const byteSize = Math.ceil(base64Data.length * 0.75);

      if (byteSize > MAX_BYTES) {
        reject(
          new Error(
            "Image is still too large after compression (limit: 2 MB). Please use a smaller image."
          )
        );
        return;
      }

      resolve(compressed);
    };

    img.onerror = () => reject(new Error("Failed to load image for compression"));
    img.src = dataUrl;
  });
}
