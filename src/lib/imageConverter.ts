async function drawAndConvert(img: HTMLImageElement, objectUrl?: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    throw new Error('Could not get canvas context');
  }
  ctx.drawImage(img, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob returned null'));
    }, 'image/webp', 0.85);
  });
}

export async function convertToPng(source: File | string | ArrayBuffer): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    if (source instanceof File) {
      const objectUrl = URL.createObjectURL(source);
      img.onload = () => drawAndConvert(img, objectUrl).then(resolve).catch(reject);
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image for conversion'));
      };
      img.src = objectUrl;
    } else if (typeof source === 'string') {
      img.crossOrigin = 'anonymous';
      img.onload = () => drawAndConvert(img).then(resolve).catch(reject);
      img.onerror = () => reject(new Error('Failed to load image for conversion'));
      img.src = source;
    } else {
      const objectUrl = URL.createObjectURL(new Blob([source]));
      img.onload = () => drawAndConvert(img, objectUrl).then(resolve).catch(reject);
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image for conversion'));
      };
      img.src = objectUrl;
    }
  });
}
