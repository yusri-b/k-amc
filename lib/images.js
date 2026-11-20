/**
 * Deteksi jenis gambar dari magic bytes dan batas ukuran unggahan.
 * Batas 4 MB mengikuti limit body Vercel Functions (4.5 MB).
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function detectImageType(buffer) {
  if (
    buffer.length > 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }
  if (buffer.length > 8 && buffer[0] === 0x89 && buffer.toString("ascii", 1, 4) === "PNG") {
    return "png";
  }
  if (buffer.length > 6 && ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6))) {
    return "gif";
  }
  return null;
}

export function mimeForImage(type) {
  switch (type) {
    case "webp":
      return "image/webp";
    case "jpg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}
