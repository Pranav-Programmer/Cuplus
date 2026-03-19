// ─── Cloudinary Upload Utility ────────────────────────────────────────────────
// Add to your .env.local:
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset

/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 * Returns the secure CDN URL of the uploaded image.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Missing Cloudinary env vars: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'cuplus/thumbnails');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message ?? 'Failed to upload image to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url as string;
}

/**
 * Validates a file is an image and under maxMB size.
 */
export function validateImageFile(
  file: File,
  maxMB = 5
): { valid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image (PNG, JPG, WebP, GIF).' };
  }
  if (file.size > maxMB * 1024 * 1024) {
    return { valid: false, error: `File size must be under ${maxMB}MB.` };
  }
  return { valid: true };
}
