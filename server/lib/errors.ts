import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import type { z } from 'zod';

import type { ErrorCode } from './schema.js';

export type { ErrorCode } from './schema.js';

export class ApiError extends Error {
  status: number;
  code: ErrorCode;

  constructor(status: number, code: ErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const UPSTREAM_MESSAGE: Record<'AI_UNAVAILABLE' | 'TTS_UNAVAILABLE', string> = {
  AI_UNAVAILABLE: 'AI 연결이 지연되고 있어요. 샘플 재판으로 계속할 수 있습니다.',
  TTS_UNAVAILABLE: '음성을 만들지 못했어요. 자막으로 계속 진행합니다.',
};

/** 요청 본문을 zod 로 검증한다. 길이 초과는 TEXT_TOO_LONG, 그 밖은 BAD_REQUEST. */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const tooLong = result.error.issues.some((issue) => issue.code === 'too_big');
  throw new ApiError(
    400,
    tooLong ? 'TEXT_TOO_LONG' : 'BAD_REQUEST',
    tooLong ? '입력이 너무 깁니다. 줄여서 다시 시도해 주세요.' : '요청 형식이 올바르지 않습니다.',
  );
}

function isBodyParserError(err: unknown): err is { type: string } {
  return typeof err === 'object' && err !== null && typeof (err as { type?: unknown }).type === 'string';
}

/** 어떤 오류든 규약에 맞는 ApiError 로 바꾼다. upstreamCode 는 OpenAI 호출 실패에 붙일 코드다. */
export function toApiError(
  err: unknown,
  upstreamCode: 'AI_UNAVAILABLE' | 'TTS_UNAVAILABLE' = 'AI_UNAVAILABLE',
): ApiError {
  if (err instanceof ApiError) {
    // 키가 없을 때도 음성 라우트는 TTS 코드로 답한다. 클라이언트가 기기 음성으로 내려가는 신호다.
    if (err.code === 'AI_UNAVAILABLE' && upstreamCode === 'TTS_UNAVAILABLE') {
      return new ApiError(err.status, 'TTS_UNAVAILABLE', UPSTREAM_MESSAGE.TTS_UNAVAILABLE);
    }
    return err;
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FIELD_VALUE') {
      return new ApiError(400, 'TEXT_TOO_LONG', '입력이 너무 깁니다. 줄여서 다시 시도해 주세요.');
    }
    return new ApiError(
      400,
      'INVALID_IMAGE',
      err.code === 'LIMIT_FILE_SIZE' ? '사진이 너무 큽니다. 4MB 이하로 올려 주세요.' : '사진 1장만 올릴 수 있어요.',
    );
  }

  if (err instanceof OpenAI.APIConnectionTimeoutError) {
    return new ApiError(504, 'AI_TIMEOUT', 'AI 응답이 늦어지고 있어요. 잠시 뒤 다시 시도해 주세요.');
  }
  if (err instanceof OpenAI.APIError) {
    if (err.status === 429) {
      return new ApiError(429, 'RATE_LIMITED', '요청이 많아요. 잠시 뒤 다시 시도해 주세요.');
    }
    return new ApiError(502, upstreamCode, UPSTREAM_MESSAGE[upstreamCode]);
  }

  if (isBodyParserError(err)) {
    if (err.type === 'entity.too.large') {
      return new ApiError(400, 'TEXT_TOO_LONG', '입력이 너무 깁니다. 줄여서 다시 시도해 주세요.');
    }
    if (err.type === 'entity.parse.failed') {
      return new ApiError(400, 'BAD_REQUEST', '요청 형식이 올바르지 않습니다.');
    }
  }

  return new ApiError(500, 'INTERNAL', '서버에서 문제가 생겼어요. 다시 시도해 주세요.');
}

function describeForLog(err: unknown): string {
  // 원본 이미지·API 키·사용자 입력은 로그에 남기지 않는다. 오류의 종류만 적는다.
  if (err instanceof OpenAI.APIError) {
    const summary = `openai status=${err.status ?? '-'} code=${err.code ?? '-'} type=${err.type ?? '-'} param=${err.param ?? '-'}`;
    // 모델 권한·파라미터 같은 설정 오류는 OpenAI 가 준 설명을 남긴다. 어떤 설정을 고칠지 알기 위해서다.
    const isConfigError = err.status === 400 || err.status === 401 || err.status === 403 || err.status === 404;
    return isConfigError ? `${summary} message=${err.message.slice(0, 240)}` : summary;
  }
  if (err instanceof ApiError) return '';
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  return 'unknown error';
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const apiError = toApiError(err);
  console.error(`[api] ${req.method} ${req.baseUrl}${req.path} -> ${apiError.status} ${apiError.code} ${describeForLog(err)}`);
  if (res.headersSent) return;
  res.status(apiError.status).json({ error: { code: apiError.code, message: apiError.message } });
};
