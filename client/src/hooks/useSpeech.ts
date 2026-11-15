// 변론 음성의 준비·재생·폴백·정리를 맡는 훅(TRD §7 음성 재생).
// 순서는 OpenAI 음성 → 기기 음성(speechSynthesis) → 자막만.
import { useCallback, useEffect, useRef, useState } from 'react';
import { requestSpeech } from '../lib/api';
import type { SpeechStatus } from '../types/trial';

export type UseSpeechOptions = {
  text: string;
  voiceDirection?: string;
  /** 샘플 재판의 미리 만든 mp3. 있으면 /api/speech 를 부르지 않는다. */
  presetAudioUrl?: string;
  /** true 면 /api/speech 를 부르지 않고 기기 음성부터 쓴다(mp3 가 없는 샘플 재판). */
  disableRemote?: boolean;
};

export type UseSpeechResult = {
  /** 재생 중이면 'playing'. 기기 음성으로 읽는 중도 포함한다. */
  status: SpeechStatus;
  /** 한 번이라도 재생했다. 버튼 문구를 '다시 듣기'로 바꿀 때 쓴다. */
  hasPlayed: boolean;
  /** 기기 음성 경로다. 라벨을 '기기 음성으로 읽는 중'으로 바꿀 때 쓴다. */
  usingDeviceVoice: boolean;
  /** 탭 핸들러 안에서 바로 부른다. 재생 중에 부르면 정지한다. */
  listen: () => void;
  stop: () => void;
};

/** 이 시간 안에 OpenAI 음성이 오지 않으면 기기 음성으로 내려간다(TRD §5.6). */
const REMOTE_WAIT_MS = 10_000;

// 같은 텍스트의 합성 요청을 재사용한다. 유료 호출이라 StrictMode 의 이중 실행이나
// 화면 재진입 때 다시 부르지 않게 한다. 실패한 요청은 지워서 다시 시도할 수 있게 둔다.
const speechCache = new Map<string, Promise<Blob>>();
const CACHE_LIMIT = 4;

function loadSpeech(text: string, voiceDirection?: string): Promise<Blob> {
  const key = `${voiceDirection ?? ''}\n${text}`;
  const cached = speechCache.get(key);
  if (cached) return cached;

  const pending = requestSpeech(text, voiceDirection);
  speechCache.set(key, pending);
  pending.catch(() => {
    if (speechCache.get(key) === pending) speechCache.delete(key);
  });
  while (speechCache.size > CACHE_LIMIT) {
    const oldest = speechCache.keys().next().value;
    if (oldest === undefined) break;
    speechCache.delete(oldest);
  }
  return pending;
}

function getSynth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

function findKoreanVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | undefined {
  return synth.getVoices().find((voice) => voice.lang.toLowerCase().startsWith('ko'));
}

/**
 * 기기 음성으로 한국어를 읽을 수 있는지 본다. 목소리 목록이 아직 비어 있는 브라우저가
 * 있어서, 비어 있으면 일단 가능하다고 보고 읽다가 오류가 나면 자막으로 내려간다.
 */
function canUseDeviceVoice(synth: SpeechSynthesis | null): synth is SpeechSynthesis {
  if (!synth) return false;
  return synth.getVoices().length === 0 || findKoreanVoice(synth) !== undefined;
}

export function useSpeech({ text, voiceDirection, presetAudioUrl, disableRemote }: UseSpeechOptions): UseSpeechResult {
  const [status, setStatusState] = useState<SpeechStatus>('idle');
  const [hasPlayed, setHasPlayedState] = useState(false);
  const [usingDeviceVoice, setUsingDeviceVoice] = useState(false);

  const statusRef = useRef<SpeechStatus>('idle');
  const hasPlayedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** 재생할 오디오(OpenAI 음성이나 샘플 mp3)가 준비됐는지 */
  const audioReadyRef = useRef(false);
  const textRef = useRef(text);
  /** text 가 바뀌거나 언마운트되면 올라간다. 지난 재판의 콜백을 걸러 낸다. */
  const sessionRef = useRef(0);

  const setStatus = useCallback((next: SpeechStatus) => {
    statusRef.current = next;
    setStatusState(next);
  }, []);

  const markPlayed = useCallback(() => {
    hasPlayedRef.current = true;
    setHasPlayedState(true);
  }, []);

  useEffect(() => {
    const session = ++sessionRef.current;
    const alive = () => sessionRef.current === session;
    const synth = getSynth();
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;
    audioReadyRef.current = false;
    textRef.current = text;
    hasPlayedRef.current = false;
    setHasPlayedState(false);

    let objectUrl: string | undefined;
    let waitTimer: number | undefined;

    const switchToDeviceVoice = () => {
      if (!alive()) return;
      audioReadyRef.current = false;
      if (canUseDeviceVoice(synth)) {
        setUsingDeviceVoice(true);
        setStatus('fallback');
      } else {
        setUsingDeviceVoice(false);
        setStatus('unavailable');
      }
    };

    const switchToAudio = (src: string) => {
      audio.src = src;
      audioReadyRef.current = true;
      setUsingDeviceVoice(false);
      setStatus('ready');
    };

    const onPlay = () => {
      if (alive()) setStatus('playing');
    };
    const onStop = () => {
      if (alive() && audioReadyRef.current) setStatus('ready');
    };
    // 샘플 mp3 가 없거나 받은 오디오를 재생할 수 없으면 기기 음성으로 내려간다
    const onError = () => {
      if (alive() && audioReadyRef.current) switchToDeviceVoice();
    };
    // 목소리 목록이 늦게 채워지는 브라우저에서 한국어 목소리 유무를 다시 본다
    const onVoicesChanged = () => {
      if (!alive() || audioReadyRef.current) return;
      if (statusRef.current === 'fallback' || statusRef.current === 'unavailable') switchToDeviceVoice();
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onStop);
    audio.addEventListener('ended', onStop);
    audio.addEventListener('error', onError);
    synth?.addEventListener?.('voiceschanged', onVoicesChanged);

    if (!text) {
      setUsingDeviceVoice(false);
      setStatus('idle');
    } else if (presetAudioUrl) {
      switchToAudio(presetAudioUrl);
    } else if (disableRemote) {
      switchToDeviceVoice();
    } else {
      // 탭한 뒤에 받기 시작하면 모바일 브라우저가 재생을 막을 수 있어 미리 받아 둔다
      setUsingDeviceVoice(false);
      setStatus('loading');
      waitTimer = window.setTimeout(() => {
        if (!audioReadyRef.current) switchToDeviceVoice();
      }, REMOTE_WAIT_MS);
      loadSpeech(text, voiceDirection).then(
        (blob) => {
          window.clearTimeout(waitTimer);
          // 늦게 도착한 오디오는 아직 한 번도 재생하지 않았을 때만 쓴다
          if (!alive() || hasPlayedRef.current || statusRef.current === 'playing') return;
          objectUrl = URL.createObjectURL(blob);
          switchToAudio(objectUrl);
        },
        () => {
          window.clearTimeout(waitTimer);
          if (!audioReadyRef.current) switchToDeviceVoice();
        },
      );
    }

    return () => {
      sessionRef.current += 1;
      window.clearTimeout(waitTimer);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onStop);
      audio.removeEventListener('ended', onStop);
      audio.removeEventListener('error', onError);
      synth?.removeEventListener?.('voiceschanged', onVoicesChanged);
      audio.pause();
      audio.removeAttribute('src');
      synth?.cancel();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      audioRef.current = null;
      audioReadyRef.current = false;
    };
  }, [text, voiceDirection, presetAudioUrl, disableRemote, setStatus]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audioReadyRef.current) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }
    const synth = getSynth();
    if (synth && statusRef.current === 'playing') {
      synth.cancel();
      setStatus('fallback');
    }
  }, [setStatus]);

  const listen = useCallback(() => {
    if (statusRef.current === 'playing') {
      stop();
      return;
    }
    const session = sessionRef.current;
    const alive = () => sessionRef.current === session;

    // 1순위: 받아 둔 오디오. 탭 핸들러 안에서 곧바로 play() 를 불러야 모바일에서 막히지 않는다
    const audio = audioRef.current;
    if (audio && audioReadyRef.current) {
      audio.currentTime = 0;
      audio.play().then(
        () => {
          if (alive()) markPlayed();
        },
        () => {
          // 브라우저가 재생을 막았다. 버튼을 되돌려 다시 누르게 한다
          if (alive() && audioReadyRef.current) setStatus('ready');
        },
      );
      return;
    }

    // 2순위: 기기 음성
    const synth = getSynth();
    if (canUseDeviceVoice(synth) && textRef.current) {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(textRef.current);
      const voice = findKoreanVoice(synth);
      if (voice) utterance.voice = voice;
      utterance.lang = 'ko-KR';
      utterance.onend = () => {
        if (alive() && statusRef.current === 'playing') setStatus('fallback');
      };
      utterance.onerror = (event) => {
        if (!alive()) return;
        // 정지 버튼으로 끊긴 것은 오류가 아니다
        const stopped = event.error === 'interrupted' || event.error === 'canceled';
        if (stopped) {
          setStatus('fallback');
        } else {
          setUsingDeviceVoice(false);
          setStatus('unavailable');
        }
      };
      setUsingDeviceVoice(true);
      setStatus('playing');
      markPlayed();
      synth.speak(utterance);
      return;
    }

    // 3순위: 자막만
    setUsingDeviceVoice(false);
    setStatus('unavailable');
  }, [markPlayed, setStatus, stop]);

  return { status, hasPlayed, usingDeviceVoice, listen, stop };
}
