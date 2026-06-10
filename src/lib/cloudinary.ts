import { v2 as cloudinary } from "cloudinary";

const configured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const isCloudinaryConfigured = configured;

/**
 * Upload a base64 / data-uri / remote URL to Cloudinary.
 * Falls back to returning the input when Cloudinary isn't configured
 * (useful in dev before credentials are added).
 */
export async function uploadToCloudinary(
  file: string,
  folder = "kvai-lms",
  resourceType: "image" | "video" | "raw" | "auto" = "auto"
): Promise<{ url: string; publicId: string | null }> {
  if (!configured) {
    return { url: file, publicId: null };
  }
  const res = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: resourceType,
  });
  return { url: res.secure_url, publicId: res.public_id };
}

export async function deleteFromCloudinary(publicId: string) {
  if (!configured) return;
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
