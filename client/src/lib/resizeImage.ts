// 업로드 전에 사진을 줄이고 JPEG 로 다시 인코딩한다(TRD §9).
// 큰 휴대폰 사진도 받을 수 있고, 다시 그리는 과정에서 위치 등 촬영 메타데이터(EXIF)가 빠진다.

/** 사진을 쓸 수 없을 때 던진다. message 는 화면에 그대로 보여 줄 안내다. */
export class ImageInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageInputError';
  }
}

const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_SIDE = 1536;
// 품질을 차례로 낮춰 가며 업로드 상한 안에 들어오는 첫 결과를 쓴다
const JPEG_QUALITIES = [0.85, 0.7, 0.55];
// 서버 상한은 4MB, 배포 플랫폼의 요청 본문 상한은 4.5MB 다. 폼 필드까지 넉넉히 들어가게 잡는다
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MESSAGE_TYPE = 'JPEG, PNG, WebP 사진만 올릴 수 있어요.';
const MESSAGE_SIZE = '사진이 너무 커요. 20MB 이하 사진을 올려 주세요.';
const MESSAGE_OPEN = '사진을 열지 못했어요. 다른 사진으로 다시 시도해 주세요.';

type Drawable = { source: CanvasImageSource; width: number; height: number; release: () => void };

/** 촬영 방향(EXIF)을 반영해 디코딩한다. */
async function decode(file: File): Promise<Drawable> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // 아래 <img> 경로로 다시 시도한다
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new ImageInputError(MESSAGE_OPEN);
  }
}

/**
 * 긴 변이 1536px 을 넘지 않는 JPEG Blob 을 돌려준다.
 * 형식이 다르거나 20MB 를 넘거나 브라우저가 열지 못하면 ImageInputError 를 던진다.
 */
export async function resizeImage(file: File): Promise<Blob> {
  // 형식을 알려 주지 않는 기기가 있어 type 이 비어 있으면 디코딩을 시도해 본다
  if (file.type && !ACCEPTED_TYPES.includes(file.type)) throw new ImageInputError(MESSAGE_TYPE);
  if (file.size > MAX_SOURCE_BYTES) throw new ImageInputError(MESSAGE_SIZE);
  if (file.size === 0) throw new ImageInputError(MESSAGE_OPEN);

  const drawable = await decode(file);
  try {
    if (drawable.width === 0 || drawable.height === 0) throw new ImageInputError(MESSAGE_OPEN);
    const scale = Math.min(1, MAX_SIDE / Math.max(drawable.width, drawable.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(drawable.width * scale));
    canvas.height = Math.max(1, Math.round(drawable.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new ImageInputError(MESSAGE_OPEN);
    // JPEG 는 투명을 담지 못한다. 투명 PNG 가 검게 나오지 않도록 흰 바탕을 깐다
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingQuality = 'high';
    context.drawImage(drawable.source, 0, 0, canvas.width, canvas.height);

    for (const quality of JPEG_QUALITIES) {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', quality);
      });
      if (!blob || blob.size === 0) throw new ImageInputError(MESSAGE_OPEN);
      if (blob.size <= MAX_UPLOAD_BYTES) return blob;
    }
    // 1536px JPEG 가 품질을 낮춰도 상한을 넘는 경우는 사실상 없다. 넘으면 보내지 않는다
    throw new ImageInputError(MESSAGE_SIZE);
  } finally {
    drawable.release();
  }
}
