// imagegen으로 제작한 무광 3D 소품. 균열 효과만 코드 기반 SVG를 쓴다.
//
// 화면에는 축소 사본(hands-768, gavel-512, bin-512)을 쓴다. 원본 3장은 합쳐 2.7MB 라
// 느린 망에서 연출이 그림 없이 지나갔다(느린 4G 에서 손 그림이 10초 뒤에 떴다).
// 사본은 합쳐 0.45MB 이고, 가장 크게 보이는 폭(약 320px)의 2배 이상이다.

type ArtProps = { className?: string };

const INK = '#0d1424';

const HANDS_SRC = '/art/ending/hands-768.png';
const GAVEL_SRC = '/art/ending/gavel-512.png';
const BIN_SRC = '/art/ending/bin-512.png';

// 판결 직후 연출이 그림 없이 시작되지 않도록, 앱이 뜨고 잠시 뒤에 미리 받아 둔다.
if (typeof window !== 'undefined') {
  window.setTimeout(() => {
    for (const src of [HANDS_SRC, GAVEL_SRC, BIN_SRC]) {
      const image = new Image();
      image.decoding = 'async';
      image.src = src;
    }
  }, 1200);
}

/** 무죄 엔딩: 물건을 받아 드는 두 손 */
export function HandArt({ className }: ArtProps) {
  return (
    <img className={className} src={HANDS_SRC} width="768" height="512" alt="" aria-hidden="true" draggable={false} />
  );
}

/** 유죄 엔딩: 판사봉 모양의 가상 망치 */
export function GavelArt({ className }: ArtProps) {
  return (
    <img className={className} src={GAVEL_SRC} width="512" height="512" alt="" aria-hidden="true" draggable={false} />
  );
}

/** 유죄 엔딩: 투입구가 보이도록 뚜껑이 열린 가상 쓰레기통 */
export function TrashBinArt({ className }: ArtProps) {
  return (
    <img className={className} src={BIN_SRC} width="512" height="512" alt="" aria-hidden="true" draggable={false} />
  );
}

const CRACK_PATHS = [
  'M58 28 L50 44 L60 56 L46 72 L52 92',
  'M58 28 L74 40 L70 58 L88 70',
  'M58 28 L40 34 L26 28 L10 40',
  'M50 44 L34 52 L24 68',
  'M60 56 L76 76 L72 94',
];

/** 망치 타격 직후 물건 위에 잠깐 겹치는 균열 */
export function CrackArt({ className }: ArtProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" strokeLinejoin="round" strokeLinecap="round">
        {CRACK_PATHS.map((d) => (
          <path key={`shadow-${d}`} d={d} stroke={INK} strokeWidth="4.5" opacity="0.7" />
        ))}
        {CRACK_PATHS.map((d) => (
          <path key={d} d={d} stroke="#ffffff" strokeWidth="2" />
        ))}
      </g>
    </svg>
  );
}
