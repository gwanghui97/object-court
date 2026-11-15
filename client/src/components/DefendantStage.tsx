// 법정의 피고인석. 생성된 캐릭터가 준비되기 전과 실패했을 때는 폴백 캐릭터를 세운다.
import type { ImageStatus } from '../types/trial';
import { FallbackCharacter } from './FallbackCharacter';

type Props = {
  name: string;
  sourceImage: string;
  characterImage?: string;
  imageStatus: ImageStatus;
  /** 변론 음성이 재생 중이면 말하는 모션을 붙인다 */
  speaking: boolean;
};

export function DefendantStage({ name, sourceImage, characterImage, imageStatus, speaking }: Props) {
  const showCharacter = imageStatus === 'ready' && Boolean(characterImage);

  return (
    <figure className="court-spotlight defendant-stage">
      <div className="defendant-stage__scene">
        <div className="defendant-stage__topline">
          <span>피고인석</span>
          <span className={`defendant-stage__presence${speaking ? ' defendant-stage__presence--speaking' : ''}`}>
            <span aria-hidden="true" />
            {speaking ? '변론 중' : '출석 완료'}
          </span>
        </div>
        <div className={`defendant-stage__portrait ${speaking ? 'defendant-speaking' : ''}`}>
          {showCharacter ? (
            <img
              key="character"
              src={characterImage}
              alt={`피고인 ${name}의 의인화 캐릭터`}
              className="defendant-enter defendant-art"
              draggable={false}
            />
          ) : (
            <FallbackCharacter src={sourceImage} alt={`피고인 ${name}`} />
          )}
        </div>
        <div className="defendant-stage__bench" aria-hidden="true" />
      </div>
      <figcaption className="defendant-stage__caption">
        <span>피고인</span>
        <strong>{name}</strong>
      </figcaption>
      {imageStatus === 'loading' && (
        <p role="status" className="px-5 pb-4 text-center text-xs text-court-300">
          캐릭터가 출석을 준비하고 있어요. 먼저 변론을 들어보세요.
        </p>
      )}
    </figure>
  );
}
