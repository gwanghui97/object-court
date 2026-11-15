// 요청·응답 스키마의 단일 정의. 클라이언트는 여기서 타입만 가져간다 (client/src/types/trial.ts).
// express 등 서버 전용 모듈을 import 하지 않는다.
import { z } from 'zod';

export const PLAUSIBLE_OPTIONS = ['keep', 'repair', 'donate', 'discard'] as const;
export type PlausibleOption = (typeof PLAUSIBLE_OPTIONS)[number];

// TRD §9 입력 길이 제한
export const LIMITS = {
  reason: 300,
  question: 200,
  speechText: 600,
  voiceDirection: 200,
  characterBrief: 300,
  objectName: 40,
  defendantName: 40,
  listItem: 200,
  listItems: 8,
  tip: 300,
  answer: 300,
} as const;

// strict=false: 모델에 넘기는 구조화 출력용. 모든 필드 필수, 길이 제한 없음 (TRD §5.1).
// strict=true: 서버 검증용. 프롬프트에는 더 짧게 요청하고, 여기서는 뒤 단계 라우트의 상한에 맞춰 확인한다.
const text = (max: number, strict: boolean) => (strict ? z.string().trim().min(1).max(max) : z.string());

function analysisShape(strict: boolean) {
  return {
    objectName: text(LIMITS.objectName, strict),
    visibleObservations: z.array(text(LIMITS.listItem, strict)), // 사진에서 확인한 내용만
    unknowns: z.array(text(LIMITS.listItem, strict)), // 사진만으로 알 수 없는 점
    plausibleOptions: z.array(z.enum(PLAUSIBLE_OPTIONS)),
    defendantName: text(LIMITS.defendantName, strict), // 예: 물통 씨
    defenseSpeech: text(LIMITS.speechText, strict), // 한국어 1인칭 2~3문장 (프롬프트는 150자 이내로 요청)
    keepTip: text(LIMITS.tip, strict), // 실제 관리·점검 행동 1개
    discardTip: text(LIMITS.tip, strict), // 안전·품목별 처리 참고 안내 1개
    safetyNote: text(LIMITS.tip, strict), // 불확실성, 실제 파괴 금지 등
    characterBrief: text(LIMITS.characterBrief, strict), // 캐릭터 생성 프롬프트용 외형 설명
    voiceDirection: text(LIMITS.voiceDirection, strict), // TTS 연기 지시 1문장
  };
}

export const TrialAnalysisWireSchema = z.object(analysisShape(false));
export const TrialAnalysisSchema = z.object(analysisShape(true));
export type TrialAnalysis = z.infer<typeof TrialAnalysisSchema>;

/** 문장 끝에서 자른다. 마땅한 끝이 없으면 말줄임표를 붙인다. */
export function clampText(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  const lastEnd = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'), cut.lastIndexOf('…'));
  if (lastEnd >= max / 2) return cut.slice(0, lastEnd + 1);
  return `${cut.slice(0, max - 1).trimEnd()}…`;
}

function clampList(items: string[]): string[] {
  return items
    .map((item) => clampText(item, LIMITS.listItem))
    .filter((item) => item.length > 0)
    .slice(0, LIMITS.listItems);
}

/**
 * 모델 응답을 검증 스키마의 길이에 맞춘다. 길이를 넘겼다고 재판을 실패시키지 않는다.
 * 화면 진행에 꼭 필요하지 않은 값이 비어 있으면 기본값으로 채우고,
 * 물건 이름·변론·안내가 비어 있으면 그대로 두어 검증에서 걸리게 한다.
 */
export function fitAnalysis(raw: z.infer<typeof TrialAnalysisWireSchema>): z.infer<typeof TrialAnalysisWireSchema> {
  const objectName = clampText(raw.objectName, LIMITS.objectName);
  return {
    objectName,
    visibleObservations: clampList(raw.visibleObservations),
    unknowns: clampList(raw.unknowns),
    plausibleOptions: [...new Set(raw.plausibleOptions)],
    defendantName: clampText(raw.defendantName, LIMITS.defendantName) || clampText(`${objectName} 씨`, LIMITS.defendantName),
    defenseSpeech: clampText(raw.defenseSpeech, LIMITS.speechText),
    keepTip: clampText(raw.keepTip, LIMITS.tip),
    discardTip: clampText(raw.discardTip, LIMITS.tip),
    safetyNote: clampText(raw.safetyNote, LIMITS.tip) || '사진만으로는 계속 써도 안전한지 판정할 수 없습니다.',
    characterBrief: clampText(raw.characterBrief, LIMITS.characterBrief) || objectName,
    voiceDirection: clampText(raw.voiceDirection, LIMITS.voiceDirection) || '간절하고 조금 과장된 목소리로, 또렷하게',
  };
}

// POST /api/analyze (multipart 의 텍스트 필드)
export const AnalyzeFieldsSchema = z.object({
  reason: z.string().trim().max(LIMITS.reason).default(''),
});

// POST /api/character (multipart 의 텍스트 필드)
export const CharacterFieldsSchema = z.object({
  objectName: z.string().trim().min(1).max(LIMITS.objectName),
  characterBrief: z.string().trim().min(1).max(LIMITS.characterBrief),
});

// POST /api/speech
export const SpeechRequestSchema = z.object({
  text: z.string().trim().min(1).max(LIMITS.speechText),
  voiceDirection: z.string().trim().max(LIMITS.voiceDirection).optional(),
});
export type SpeechRequest = z.infer<typeof SpeechRequestSchema>;

// POST /api/cross-examine
export const CrossExamineRequestSchema = z.object({
  analysis: TrialAnalysisSchema,
  question: z.string().trim().min(1).max(LIMITS.question),
});
export type CrossExamineRequest = z.infer<typeof CrossExamineRequestSchema>;

// 구조화 출력은 선택 필드를 두지 않는다. caution 이 없으면 빈 문자열로 받고 응답에서 뺀다.
export const CrossExamineWireSchema = z.object({
  answer: z.string(),
  caution: z.string(),
});
export type CrossExamineResponse = { answer: string; caution?: string };

export type CharacterResponse = { imageDataUrl: string };

// TRD §5.5 오류 응답 규약. BAD_REQUEST·NOT_FOUND·INTERNAL 은 규약 표에 없는 경우를 위한 보조 코드다.
// 클라이언트도 이 타입을 쓰므로 서버 전용 모듈이 없는 이 파일에 둔다.
export type ErrorCode =
  | 'INVALID_IMAGE'
  | 'TEXT_TOO_LONG'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'AI_UNAVAILABLE'
  | 'IMAGE_BLOCKED'
  | 'TTS_UNAVAILABLE'
  | 'AI_TIMEOUT'
  | 'INTERNAL';

export type ApiErrorBody = { error: { code: ErrorCode; message: string } };
