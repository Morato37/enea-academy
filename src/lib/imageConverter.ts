/**
 * Returns the original file as-is for upload.
 * Client-side re-encoding (canvas → WebP) was the primary cause of 2–5 minute
 * upload times because the browser had to decompress and re-compress the full
 * bitmap in JavaScript. Modern cameras already produce well-compressed JPEG/HEIC
 * files; re-encoding gains nothing and costs minutes of CPU time.
 */
export async function convertToPng(source: File | string | ArrayBuffer): Promise<Blob> {
  if (source instanceof File) return source;
  if (source instanceof ArrayBuffer) return new Blob([source]);
  // URL string fallback — fetch and return raw bytes
  const response = await fetch(source);
  return response.blob();
}
