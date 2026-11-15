// 서버 API 4개를 부르는 함수(TRD §5). 실패는 ApiRequestError 로 던진다.
// 중단(AbortSignal)은 감싸지 않고 그대로 던진다.
import type { ApiErrorBody, CharacterResponse, CrossExamineResponse, TrialAnalysis } from '../types/trial';

/**
 * API 호출 실패. message 는 화면에 그대로 보여 줄 한국어 문장이다.
 * code 는 서버의 오류 코드(TRD §5.5)이거나, 서버에 닿지 못했으면 'NETWORK',
 * 응답을 읽지 못했으면 'UNEXPECTED' 다.
 */
export class ApiRequestError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

const NETWORK_MESSAGE = '서버에 연결하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.';
const UNEXPECTED_MESSAGE = '서버 응답을 읽지 못했어요. 다시 시도해 주세요.';

async function toRequestError(response: Response): Promise<ApiRequestError> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    if (body.error && typeof body.error.code === 'string' && typeof body.error.message === 'string') {
      return new ApiRequestError(response.status, body.error.code, body.error.message);
    }
  } catch {
    // JSON 이 아닌 오류 응답
  }
  return platformError(response.status);
}

/**
 * 서버 코드에 닿기 전에 배포 플랫폼이 직접 돌려준 오류(본문이 우리 형식이 아님)를
 * 상태 코드로 풀이한다. 화면이 서버 오류와 같은 폴백을 타도록 같은 코드 이름을 쓴다.
 */
function platformError(status: number): ApiRequestError {
  if (status === 413) {
    return new ApiRequestError(status, 'INVALID_IMAGE', '사진이 너무 커요. 다른 사진으로 다시 시도해 주세요.');
  }
  if (status === 429) {
    return new ApiRequestError(status, 'RATE_LIMITED', '요청이 많아요. 잠시 뒤 다시 시도해 주세요.');
  }
  if (status === 408 || status === 504) {
    return new ApiRequestError(status, 'AI_TIMEOUT', 'AI 응답이 늦어지고 있어요. 다시 시도하거나 샘플 재판으로 계속할 수 있습니다.');
  }
  if (status >= 500) {
    return new ApiRequestError(status, 'AI_UNAVAILABLE', 'AI 연결이 지연되고 있어요. 샘플 재판으로 계속할 수 있습니다.');
  }
  return new ApiRequestError(status, 'UNEXPECTED', UNEXPECTED_MESSAGE);
}

/** 요청을 보내고 2xx 응답만 돌려준다. */
async function send(path: string, init: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch (err) {
    if (init.signal?.aborted) throw err;
    throw new ApiRequestError(0, 'NETWORK', NETWORK_MESSAGE);
  }
  if (!response.ok) throw await toRequestError(response);
  return response;
}

async function readJson(response: Response, signal?: AbortSignal): Promise<unknown> {
  try {
    return await response.json();
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiRequestError(response.status, 'UNEXPECTED', UNEXPECTED_MESSAGE);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function postJson(path: string, body: unknown, signal?: AbortSignal): Promise<Response> {
  return send(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
}

/** POST /api/analyze — 축소한 사진과 버리는 이유를 보내 분석과 최후 변론을 받는다. */
export async function requestAnalysis(image: Blob, reason: string, signal?: AbortSignal): Promise<TrialAnalysis> {
  const form = new FormData();
  form.append('image', image, 'object.jpg');
  form.append('reason', reason);
  const response = await send('/api/analyze', { method: 'POST', body: form, signal });
  const data = await readJson(response, signal);
  if (!isRecord(data) || typeof data.defenseSpeech !== 'string' || typeof data.objectName !== 'string') {
    throw new ApiRequestError(response.status, 'UNEXPECTED', UNEXPECTED_MESSAGE);
  }
  return data as TrialAnalysis;
}

/** POST /api/character — 사진을 의인화 캐릭터로 바꾼 data URL 을 받는다. 수십 초가 걸릴 수 있다. */
export async function requestCharacter(
  image: Blob,
  brief: { objectName: string; characterBrief: string },
  signal?: AbortSignal,
): Promise<string> {
  const form = new FormData();
  form.append('image', image, 'object.jpg');
  form.append('objectName', brief.objectName);
  form.append('characterBrief', brief.characterBrief);
  const response = await send('/api/character', { method: 'POST', body: form, signal });
  const data = (await readJson(response, signal)) as Partial<CharacterResponse> | null;
  if (!data || typeof data.imageDataUrl !== 'string' || !data.imageDataUrl.startsWith('data:image/')) {
    throw new ApiRequestError(response.status, 'UNEXPECTED', UNEXPECTED_MESSAGE);
  }
  return data.imageDataUrl;
}

/** POST /api/speech — 변론 텍스트를 합성한 MP3 를 받는다. 유료 호출이므로 같은 텍스트로 다시 부르지 않는다. */
export async function requestSpeech(text: string, voiceDirection?: string, signal?: AbortSignal): Promise<Blob> {
  const response = await postJson('/api/speech', voiceDirection ? { text, voiceDirection } : { text }, signal);
  if (!response.headers.get('Content-Type')?.startsWith('audio/')) {
    throw new ApiRequestError(response.status, 'UNEXPECTED', UNEXPECTED_MESSAGE);
  }
  let audio: Blob;
  try {
    audio = await response.blob();
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiRequestError(response.status, 'UNEXPECTED', UNEXPECTED_MESSAGE);
  }
  if (audio.size === 0) {
    throw new ApiRequestError(response.status, 'UNEXPECTED', UNEXPECTED_MESSAGE);
  }
  return audio;
}

/** POST /api/cross-examine — 질문 하나에 대한 피고인의 답을 받는다(P1). */
export async function requestCrossExamine(
  analysis: TrialAnalysis,
  question: string,
  signal?: AbortSignal,
): Promise<CrossExamineResponse> {
  const response = await postJson('/api/cross-examine', { analysis, question }, signal);
  const data = (await readJson(response, signal)) as Partial<CrossExamineResponse> | null;
  if (!data || typeof data.answer !== 'string') {
    throw new ApiRequestError(response.status, 'UNEXPECTED', UNEXPECTED_MESSAGE);
  }
  return typeof data.caution === 'string' && data.caution ? { answer: data.answer, caution: data.caution } : { answer: data.answer };
}
