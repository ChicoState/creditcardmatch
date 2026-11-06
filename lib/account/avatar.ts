import sharp from 'sharp';
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from './validation';

export async function prepareAvatar(input: Buffer, contentType: string) {
  if (
    !input.length ||
    input.length > AVATAR_MAX_BYTES ||
    !AVATAR_TYPES.includes(contentType)
  ) {
    throw new Error('Choose a JPEG, PNG, or WebP photo up to 2 MB.');
  }
  const image = sharp(input, {
    limitInputPixels: 16_000_000,
    failOn: 'warning',
  });
  const metadata = await image.metadata();
  if (
    !['jpeg', 'png', 'webp'].includes(metadata.format ?? '') ||
    `image/${metadata.format}` !== contentType ||
    (metadata.pages ?? 1) > 1
  ) {
    throw new Error('Choose a still JPEG, PNG, or WebP photo.');
  }
  return image
    .rotate()
    .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
    .webp()
    .toBuffer();
}
