// 최후 변론: 자막은 음성 상태와 무관하게 항상 전부 보여 준다 (TRD §7 음성 재생)
import { card, eyebrow } from '../lib/ui';
import { SpeechPlayer } from './SpeechPlayer';

type Props = {
  defendantName: string;
  text: string;
  voiceDirection?: string;
  /** 샘플 재판의 미리 만든 음성. 있으면 음성 합성 API 를 부르지 않는다 */
  presetAudioUrl?: string;
  /** 샘플 재판이면 음성 합성 API 를 부르지 않는다 */
  disableRemote?: boolean;
  muted: boolean;
  silenced?: boolean;
  onSpeakingChange?: (speaking: boolean) => void;
};

export function DefenseSpeech({
  defendantName,
  text,
  voiceDirection,
  presetAudioUrl,
  disableRemote,
  muted,
  silenced,
  onSpeakingChange,
}: Props) {
  return (
    <section className={card}>
      <h2 className={eyebrow}>최후 변론</h2>
      <blockquote className="mt-2">
        <p className="font-display text-lg leading-relaxed">“{text}”</p>
        <footer className="mt-2 text-sm text-court-300">— {defendantName}</footer>
      </blockquote>

      <div className="mt-4">
        <SpeechPlayer
          text={text}
          voiceDirection={voiceDirection}
          presetAudioUrl={presetAudioUrl}
          disableRemote={disableRemote}
          idleLabel="변론 듣기"
          muted={muted}
          silenced={silenced}
          onSpeakingChange={onSpeakingChange}
        />
      </div>
    </section>
  );
}
