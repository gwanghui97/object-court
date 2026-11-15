// 음성 재생 버튼과 ‘AI 생성 음성’ 라벨. 변론과 심문 답변이 함께 쓴다 (TRD §7 음성 재생, §8).
import { useEffect } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import { btnPrimary, chip } from '../lib/ui';
import { UiIcon } from './UiIcon';

type Props = {
  text: string;
  voiceDirection?: string;
  /** 샘플 재판의 미리 만든 음성. 있으면 음성 합성 API 를 부르지 않는다 */
  presetAudioUrl?: string;
  /** true 면 음성 합성 API 를 부르지 않고 기기 음성부터 쓴다 */
  disableRemote?: boolean;
  /** 아직 한 번도 듣지 않았을 때의 버튼 문구. 예: 변론 듣기 */
  idleLabel: string;
  muted: boolean;
  /** 다른 음성이 재생을 시작했으면 true. 겹쳐 들리지 않게 이쪽을 멈춘다 */
  silenced?: boolean;
  onSpeakingChange?: (speaking: boolean) => void;
};

export function SpeechPlayer({
  text,
  voiceDirection,
  presetAudioUrl,
  disableRemote,
  idleLabel,
  muted,
  silenced = false,
  onSpeakingChange,
}: Props) {
  const speech = useSpeech({ text, voiceDirection, presetAudioUrl, disableRemote });
  const { status, stop } = speech;
  const playing = status === 'playing';

  useEffect(() => {
    onSpeakingChange?.(playing);
    return () => onSpeakingChange?.(false);
  }, [playing, onSpeakingChange]);

  useEffect(() => {
    if ((muted || silenced) && playing) stop();
  }, [muted, silenced, playing, stop]);

  if (muted) {
    return (
      <p role="status" className="text-sm text-court-300">
        음소거 중입니다. 자막으로 진행합니다.
      </p>
    );
  }

  if (status === 'unavailable') {
    return (
      <p role="status" className="text-sm text-court-300">
        자막으로 진행합니다.
      </p>
    );
  }

  const label = status === 'loading' ? '준비 중…' : playing ? '정지' : speech.hasPlayed ? '다시 듣기' : idleLabel;

  return (
    <div className="speech-player">
      <button type="button" className={`${btnPrimary} speech-player__button`} onClick={speech.listen} disabled={status === 'loading'} aria-pressed={playing}>
        <UiIcon name="sound" />
        {label}
      </button>
      {playing && <span className="speech-bars" aria-hidden="true"><i /><i /><i /><i /></span>}
      <span className={chip}>
        {speech.usingDeviceVoice ? (playing ? '기기 음성으로 읽는 중' : '기기 음성') : 'AI 생성 음성'}
      </span>
    </div>
  );
}
