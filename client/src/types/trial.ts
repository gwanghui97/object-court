// 재판 상태 타입(TRD §4). 서버와 주고받는 형식은 server/lib/schema.ts 가 단일 정의다.
// 여기서는 타입만 다시 내보낸다. 런타임 import 가 아니므로 서버 코드가 번들에 들어가지 않는다.
import type { TrialAnalysis } from '../../../server/lib/schema';

export type {
  ApiErrorBody,
  CharacterResponse,
  CrossExamineResponse,
  ErrorCode,
  PlausibleOption,
  TrialAnalysis,
} from '../../../server/lib/schema';

export type Stage =
  | 'home'
  | 'analyzing'
  | 'courtroom'
  | 'examination'
  | 'verdict'
  | 'keep-ending'
  | 'discard-ending'
  | 'tool-select'
  | 'action'
  | 'result';

/** 사용자가 판결 버튼을 누르기 전에는 null 이다. 서버 응답으로 정하지 않는다. */
export type Verdict = 'keep' | 'discard' | null;

/** 가상 집행 도구. hammer·trash 는 P0, flame·stomp 는 P1. */
export type VirtualTool = 'hammer' | 'trash' | 'flame' | 'stomp';

/** loading 동안과 fallback 에서는 원본 사진에 얼굴·팔·다리를 합성한 폴백 캐릭터를 보여 준다. */
export type ImageStatus = 'idle' | 'loading' | 'ready' | 'fallback';

/** ready: OpenAI 음성 준비됨 / fallback: 브라우저 음성으로 읽음 / unavailable: 자막만 */
export type SpeechStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'fallback' | 'unavailable';

export type Trial = {
  id: string;
  /** 브라우저에서 축소·재인코딩한 업로드본. /api/analyze 와 /api/character 가 함께 쓴다. 샘플 재판은 null. */
  sourceBlob: Blob | null;
  /** 원본 사진 주소. 업로드한 재판은 sourceBlob 의 object URL, 샘플 재판은 정적 파일 경로. */
  sourceImage: string;
  /** /api/character 가 돌려준 data URL. 샘플 재판은 정적 파일 경로. */
  characterImage?: string;
  reason: string;
  analysis?: TrialAnalysis;
  verdict: Verdict;
  tool?: VirtualTool;
  stage: Stage;
  imageStatus: ImageStatus;
  speechStatus: SpeechStatus;
  /** /api/speech 응답의 object URL. 다시 듣기에 재사용한다. 샘플 재판은 정적 파일 경로. */
  speechAudioUrl?: string;
  questionCount: number;
  /** 샘플 재판 여부. 화면에 데모 모드를 표시한다. */
  isDemo: boolean;
};
