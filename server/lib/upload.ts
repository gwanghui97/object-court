import type { Request } from 'express';
import multer from 'multer';
import { ApiError } from './errors.js';

// Vercel 함수는 요청 본문이 4.5MB 를 넘으면 서버 코드에 닿기 전에 413 으로 거절한다.
// 그보다 낮게 잡아 규약대로의 오류(INVALID_IMAGE)를 돌려준다. 클라이언트는 더 작게 줄여서 보낸다.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

// 파일은 메모리로만 다루고 디스크에 쓰지 않는다 (TRD §9)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 8, fieldSize: 4 * 1024 },
});

export const uploadImage = upload.single('image');

export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp';
export type UploadedImage = { buffer: Buffer; mime: ImageMime };

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** 클라이언트가 보낸 MIME 을 믿지 않고 파일 시그니처로 형식을 정한다. */
function sniffImageMime(buffer: Buffer): ImageMime | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return 'image/png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

export function requireImage(req: Request): UploadedImage {
  const file = req.file;
  const mime = file ? sniffImageMime(file.buffer) : null;
  if (!file || !mime) {
    throw new ApiError(400, 'INVALID_IMAGE', 'JPEG·PNG·WebP 사진 1장을 올려 주세요.');
  }
  return { buffer: file.buffer, mime };
}

export const IMAGE_EXTENSION: Record<ImageMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
