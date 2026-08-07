/**
 * Cloudinary Image Optimization Utility
 *
 * Automatically injects f_auto,q_auto (and optional width) into any
 * Cloudinary image URL. Falls back gracefully for non-Cloudinary URLs
 * (e.g. ImgBB, placeholder images).
 *
 * Usage:
 *   import { cloudImg } from '../../utils/cloudinaryUtils';
 *
 *   // Auto format + quality (no resize)
 *   cloudImg(product.image)
 *
 *   // Auto format + quality + max width
 *   cloudImg(product.image, { width: 400 })
 *
 *   // Thumbnail (small, fill-cropped)
 *   cloudImg(product.image, { width: 80, height: 80, crop: 'fill' })
 */

const CLOUDINARY_REGEX = /res\.cloudinary\.com\/([^/]+)\/image\/upload\//;

/**
 * @param {string} url - Original image URL
 * @param {{ width?: number, height?: number, crop?: string }} [opts]
 * @returns {string} Optimized URL
 */
export const cloudImg = (url, opts = {}) => {
  if (!url || typeof url !== 'string') return url;

  // Only transform Cloudinary URLs
  if (!CLOUDINARY_REGEX.test(url)) return url;

  const { width, height, crop = 'limit' } = opts;

  // Build the transformation string
  const parts = ['f_auto', 'q_auto'];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if ((width || height) && crop) parts.push(`c_${crop}`);

  const transformation = parts.join(',');

  // Inject after /upload/  (handles existing transformations by prepending)
  return url.replace(
    /\/image\/upload\/((?:[^/]+\/)*)/,
    (match, existingTransforms) => {
      // If the existing transforms already include f_auto or q_auto, skip
      if (existingTransforms.includes('f_auto') || existingTransforms.includes('q_auto')) {
        return match;
      }
      return `/image/upload/${transformation}/${existingTransforms}`;
    }
  );
};

/**
 * Convenience wrappers for common sizes used in DemoERP.
 */
export const cloudThumb = (url) => cloudImg(url, { width: 80, height: 80, crop: 'fill' });
export const cloudCard  = (url) => cloudImg(url, { width: 400 });
export const cloudFull  = (url) => cloudImg(url, { width: 1200 });
