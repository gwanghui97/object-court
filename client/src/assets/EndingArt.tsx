// 엔딩 연출에 쓰는 그림. 직접 그린 SVG이고 모두 장식이라 스크린리더에서 숨긴다.

type ArtProps = { className?: string };

const INK = '#0d1424';

/** 무죄 엔딩: 물건을 받아 드는 두 손 */
export function HandArt({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 200 130" aria-hidden="true" focusable="false">
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M38 130 L46 86 L88 94 L86 130 Z" fill="#2a3a66" />
        <path d="M162 130 L154 86 L112 94 L114 130 Z" fill="#2a3a66" />
        <path
          d="M12 44 C8 34 20 28 28 36 C44 52 70 60 100 60 C130 60 156 52 172 36 C180 28 192 34 188 44 C176 78 142 98 100 98 C58 98 24 78 12 44 Z"
          fill="#f2d3ae"
        />
        <path
          d="M100 62 V96 M62 74 C66 82 70 88 76 93 M138 74 C134 82 130 88 124 93"
          fill="none"
        />
      </g>
    </svg>
  );
}

/** 유죄 엔딩: 판사봉 모양의 가상 망치 */
export function GavelArt({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <rect x="54" y="40" width="12" height="76" rx="6" fill="#b9793d" />
        <rect x="18" y="8" width="84" height="38" rx="9" fill="#8a5326" />
        <rect x="26" y="8" width="9" height="38" fill="#e2b857" />
        <rect x="85" y="8" width="9" height="38" fill="#e2b857" />
      </g>
    </svg>
  );
}

/** 유죄 엔딩: 가상 쓰레기통. 뚜껑(.oc-bin-lid)은 CSS로 여닫는다 */
export function TrashBinArt({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 120 140" aria-hidden="true" focusable="false">
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M22 40 H98 L91 132 a6 6 0 0 1 -6 5 H35 a6 6 0 0 1 -6 -5 Z" fill="#5b6b8f" />
        <path d="M44 56 L47 120 M60 56 V120 M76 56 L73 120" fill="none" stroke="#c8d0e6" />
        <g className="oc-bin-lid">
          <rect x="47" y="14" width="26" height="14" rx="5" fill="none" />
          <rect x="14" y="26" width="92" height="13" rx="6.5" fill="#7384ad" />
        </g>
      </g>
    </svg>
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
