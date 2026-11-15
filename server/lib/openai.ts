import OpenAI from 'openai';
import { ApiError } from './errors.js';

let client: OpenAI | undefined;

/** 키가 없어도 서버는 뜬다. AI 라우트만 AI_UNAVAILABLE 을 돌려주고 샘플 재판은 계속된다. */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ApiError(502, 'AI_UNAVAILABLE', 'AI 연결이 설정되지 않았어요. 샘플 재판으로 계속할 수 있습니다.');
  }
  client ??= new OpenAI({ apiKey, maxRetries: 0 });
  return client;
}

// 모델 ID 는 환경변수에서 읽는다 (TRD §1-6, §2.1).
// 텍스트·이미지 기본값은 이 프로젝트의 키가 쓸 수 있는 모델이다 (2026-11-15, GET /v1/models 로 확인).
// TRD 표의 gpt-6.1-terra·gpt-image-2.5-flare 는 이 키로 403 model_not_found 가 난다.
export const models = {
  text: () => process.env.OPENAI_TEXT_MODEL || 'gpt-5.6-luna',
  image: () => process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1-mini',
  tts: () => process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
  voice: () => process.env.OPENAI_TTS_VOICE || 'marin',
};

/**
 * 모델이 받지 않는 선택 파라미터 때문에 400 이 왔는지 본다.
 * 그런 경우 호출한 쪽이 그 파라미터를 빼고 한 번만 다시 부른다. 거절된 400 은 과금되지 않는다.
 * 모델을 환경변수로 바꿔도 코드 수정 없이 돌아가게 하려는 것이다 (TRD §1-6).
 */
export function rejectsParam(err: unknown, param: string): boolean {
  if (!(err instanceof OpenAI.APIError) || err.status !== 400) return false;
  if (typeof err.param === 'string' && err.param.startsWith(param)) return true;
  return err.message.includes(`'${param}`);
}

// 업스트림 타임아웃과 SDK 자동 재시도 (TRD §5.6). 출발값이며 리허설에서 조정한다.
export const upstream = {
  analyze: { timeout: 25_000, maxRetries: 1 }, // 재시도 포함 50초 안쪽: 서버리스 함수 실행 한도(60초)보다 먼저 끝나게 한다
  character: { timeout: 50_000, maxRetries: 0 }, // 재판당 자동 1회라는 비용 규칙. 함수 실행 한도(60초)보다 먼저 끝나게 한다
  speech: { timeout: 20_000, maxRetries: 0 },
  crossExamine: { timeout: 20_000, maxRetries: 0 },
} as const;
