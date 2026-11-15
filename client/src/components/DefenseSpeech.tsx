// 최후 변론: 자막은 음성 상태와 무관하게 항상 전부 보여 준다 (TRD §7 음성 재생)
import { eyebrow } from '../lib/ui';
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
    <section className="defense-speech">
      <div className="defense-speech__heading"><h2 className={eyebrow}>피고인 진술서</h2><span>최후 변론</span></div>
      <blockquote>
        <p>{text}</p>
        <footer><span>이상, 저의 마지막 변론입니다.</span><strong>{defendantName} 올림</strong></footer>
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
