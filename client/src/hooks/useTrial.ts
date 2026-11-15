// 재판 한 번의 상태 머신 (TRD §4). 음성은 useSpeech 가 따로 맡는다.
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { SAMPLE_TRIALS, type SampleKey } from '../data/sampleTrial';
import { ApiRequestError, requestAnalysis, requestCharacter } from '../lib/api';
import { ImageInputError, resizeImage } from '../lib/resizeImage';
import type { Stage, Trial, TrialAnalysis } from '../types/trial';

const REASON_MAX = 300;

// 판결 화면에 들어간 뒤 도착한 캐릭터 이미지는 버린다. 엔딩 연출 도중 그림이 바뀌지 않게 한다.
const ACCEPTS_CHARACTER: ReadonlySet<Stage> = new Set<Stage>(['analyzing', 'courtroom', 'examination']);

type State = { trial: Trial | null; error: string | null };

type Action =
  | { type: 'start'; trial: Trial }
  | { type: 'input-error'; message: string }
  | { type: 'reset' }
  | { type: 'analyze-retry'; id: string }
  | { type: 'analyzed'; id: string; analysis: TrialAnalysis }
  | { type: 'analyze-failed'; id: string; message: string }
  | { type: 'character-ready'; id: string; image: string }
  | { type: 'character-failed'; id: string }
  | { type: 'go'; stage: Stage }
  | { type: 'question-answered' }
  | { type: 'verdict'; verdict: 'keep' | 'discard' };

function reducer(state: State, action: Action): State {
  if (action.type === 'start') return { trial: action.trial, error: null };
  if (action.type === 'input-error') return { trial: null, error: action.message };
  if (action.type === 'reset') return { trial: null, error: null };

  const trial = state.trial;
  if (!trial) return state;
  // 이전 재판에서 늦게 도착한 응답은 버린다
  if ('id' in action && action.id !== trial.id) return state;

  switch (action.type) {
    case 'analyze-retry':
      return { trial, error: null };
    case 'analyzed':
      return { trial: { ...trial, analysis: action.analysis, stage: 'courtroom', imageStatus: 'loading' }, error: null };
    case 'analyze-failed':
      return { trial, error: action.message };
    case 'character-ready':
      if (!ACCEPTS_CHARACTER.has(trial.stage)) return { ...state, trial: { ...trial, imageStatus: 'fallback' } };
      return { ...state, trial: { ...trial, characterImage: action.image, imageStatus: 'ready' } };
    case 'character-failed':
      return trial.imageStatus === 'loading' ? { ...state, trial: { ...trial, imageStatus: 'fallback' } } : state;
    case 'go':
      return { ...state, trial: { ...trial, stage: action.stage } };
    case 'question-answered':
      // 반대 심문은 법정 화면 안에서 진행한다. 판결 뒤에는 단계를 되돌리지 않는다.
      if (trial.stage !== 'courtroom' && trial.stage !== 'examination') return state;
      return { ...state, trial: { ...trial, stage: 'examination', questionCount: trial.questionCount + 1 } };
    case 'verdict':
      // 판결은 사람이 버튼을 눌렀을 때만 정해진다
      return {
        ...state,
        trial: { ...trial, verdict: action.verdict, stage: action.verdict === 'keep' ? 'keep-ending' : 'discard-ending' },
      };
    default:
      return state;
  }
}

function newTrialId(): string {
  // crypto.randomUUID 는 http 로 연 휴대폰 테스트 주소에서 쓸 수 없어 직접 만든다
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useTrial() {
  const [state, dispatch] = useReducer(reducer, { trial: null, error: null });
  const trialRef = useRef<Trial | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    trialRef.current = state.trial;
  }, [state.trial]);

  /** 진행 중인 요청을 끊고 업로드 사진의 object URL 을 해제한다. 샘플 재판의 사진은 정적 파일이라 그대로 둔다. */
  const release = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    const trial = trialRef.current;
    if (trial && !trial.isDemo) URL.revokeObjectURL(trial.sourceImage);
    trialRef.current = null;
  }, []);

  useEffect(() => release, [release]);

  const runAnalysis = useCallback(async (trial: Trial) => {
    const { id, sourceBlob } = trial;
    if (!sourceBlob) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const analysis = await requestAnalysis(sourceBlob, trial.reason, controller.signal);
      if (controller.signal.aborted) return;
      dispatch({ type: 'analyzed', id, analysis });

      // 캐릭터 이미지는 재판당 자동으로 한 번만 요청하고 기다리지 않는다. 도착하면 폴백 캐릭터와 바꾼다.
      requestCharacter(sourceBlob, analysis, controller.signal)
        .then((image) => dispatch({ type: 'character-ready', id, image }))
        .catch(() => dispatch({ type: 'character-failed', id }));
    } catch (err) {
      if (controller.signal.aborted) return;
      dispatch({
        type: 'analyze-failed',
        id,
        message:
          err instanceof ApiRequestError
            ? err.message
            : '분석 요청을 보내지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.',
      });
    }
  }, []);

  const startTrial = useCallback(
    async (file: File, reason: string) => {
      let blob: Blob;
      try {
        blob = await resizeImage(file);
      } catch (err) {
        dispatch({
          type: 'input-error',
          message: err instanceof ImageInputError ? err.message : '사진을 처리하지 못했어요. 다른 사진으로 시도해 주세요.',
        });
        return;
      }

      release();
      const trial: Trial = {
        id: newTrialId(),
        sourceBlob: blob,
        sourceImage: URL.createObjectURL(blob),
        reason: reason.trim().slice(0, REASON_MAX),
        verdict: null,
        stage: 'analyzing',
        imageStatus: 'idle',
        speechStatus: 'idle',
        questionCount: 0,
        isDemo: false,
      };
      trialRef.current = trial;
      dispatch({ type: 'start', trial });
      void runAnalysis(trial);
    },
    [release, runAnalysis],
  );

  /** 샘플 재판: AI 를 호출하지 않고 미리 준비한 분석·이미지·음성으로 법정에 바로 들어간다. */
  const startDemo = useCallback(
    (key: SampleKey) => {
      release();
      const sample = SAMPLE_TRIALS[key];
      const trial: Trial = {
        id: newTrialId(),
        sourceBlob: null,
        sourceImage: sample.sourceImage,
        characterImage: sample.characterImage,
        reason: sample.reason,
        analysis: sample.analysis,
        verdict: null,
        stage: 'courtroom',
        imageStatus: sample.characterImage ? 'ready' : 'fallback',
        speechStatus: 'idle',
        speechAudioUrl: sample.speechAudio,
        questionCount: 0,
        isDemo: true,
      };
      trialRef.current = trial;
      dispatch({ type: 'start', trial });
    },
    [release],
  );

  const retryAnalysis = useCallback(() => {
    const trial = trialRef.current;
    if (!trial || trial.stage !== 'analyzing') return;
    dispatch({ type: 'analyze-retry', id: trial.id });
    void runAnalysis(trial);
  }, [runAnalysis]);

  const go = useCallback((stage: Stage) => dispatch({ type: 'go', stage }), []);

  const giveVerdict = useCallback((verdict: 'keep' | 'discard') => dispatch({ type: 'verdict', verdict }), []);

  const noteQuestionAnswered = useCallback(() => dispatch({ type: 'question-answered' }), []);

  const reset = useCallback(() => {
    release();
    dispatch({ type: 'reset' });
  }, [release]);

  return {
    trial: state.trial,
    error: state.error,
    startTrial,
    startDemo,
    retryAnalysis,
    go,
    giveVerdict,
    noteQuestionAnswered,
    reset,
  };
}
