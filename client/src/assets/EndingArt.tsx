// imagegen으로 제작한 무광 3D 소품. 균열 효과만 코드 기반 SVG를 쓴다.

type ArtProps = { className?: string };

const INK = '#0d1424';

/** 무죄 엔딩: 물건을 받아 드는 두 손 */
export function HandArt({ className }: ArtProps) {
  return (
    <img className={className} src="/art/ending/hands.png" width="1536" height="1024" alt="" aria-hidden="true" draggable={false} />
  );
}

/** 유죄 엔딩: 판사봉 모양의 가상 망치 */
export function GavelArt({ className }: ArtProps) {
  return (
    <img className={className} src="/art/ending/gavel.png" width="1254" height="1254" alt="" aria-hidden="true" draggable={false} />
  );
}

/** 유죄 엔딩: 투입구가 보이도록 뚜껑이 열린 가상 쓰레기통 */
export function TrashBinArt({ className }: ArtProps) {
  return (
    <img className={className} src="/art/ending/bin.png" width="1254" height="1254" alt="" aria-hidden="true" draggable={false} />
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
