type FallbackCharacterProps = {
  /** 원본 사진 주소 (object URL, data URL, 정적 파일 경로) */
  src: string;
  /** 캐릭터 설명. 빈 문자열이면 장식으로 보고 스크린리더에서 숨긴다 */
  alt: string;
};

const INK = '#0d1424';
const LIMB = '#f4efe2';
const GOLD = '#e2b857';

const LEGS = 'M78 172 L74 208 M122 172 L126 208';
const LEFT_ARM = 'M30 100 C12 106 8 128 18 142';
const RIGHT_ARM = 'M170 100 C188 94 194 76 186 62';
const BROWS = 'M62 68 Q76 60 90 60 M110 60 Q124 60 138 68';
const MOUTH = 'M88 114 Q100 126 112 114';

/**
 * 이미지 생성이 늦거나 실패했을 때 쓰는 폴백 캐릭터.
 * 원본 사진을 몸통으로 삼고 눈·팔·다리를 얹는다. AI 호출은 없다.
 *
 * 사진은 SVG <image> 가 아니라 <img> 로 넣는다. object URL·SVG 파일·모바일 브라우저에서
 * 똑같이 프레임을 꽉 채우게 하기 위해서다. 두 SVG 레이어의 viewBox(200×230)와
 * animations.css 의 .oc-fallback__photo 위치가 같은 좌표를 가리킨다.
 */
export function FallbackCharacter({ src, alt }: FallbackCharacterProps) {
  return (
    <div className="oc-fallback">
      {/* 뒤 레이어: 팔다리 */}
      <svg className="oc-fallback__layer" viewBox="0 0 200 230" aria-hidden="true" focusable="false">
        <g fill="none" strokeLinecap="round">
          <path d={LEGS} stroke={INK} strokeWidth="13" />
          <path d={LEGS} stroke={LIMB} strokeWidth="8" />
        </g>
        <g fill={GOLD} stroke={INK} strokeWidth="3">
          <ellipse cx="68" cy="214" rx="15" ry="8" />
          <ellipse cx="132" cy="214" rx="15" ry="8" />
        </g>
        <g>
          <path d={LEFT_ARM} fill="none" stroke={INK} strokeWidth="13" strokeLinecap="round" />
          <path d={LEFT_ARM} fill="none" stroke={LIMB} strokeWidth="8" strokeLinecap="round" />
          <circle cx="18" cy="144" r="8" fill={GOLD} stroke={INK} strokeWidth="3" />
        </g>
        {/* 오른팔은 호소하듯 들어 올려 흔든다 */}
        <g className="oc-fallback__arm--right">
          <path d={RIGHT_ARM} fill="none" stroke={INK} strokeWidth="13" strokeLinecap="round" />
          <path d={RIGHT_ARM} fill="none" stroke={LIMB} strokeWidth="8" strokeLinecap="round" />
          <circle cx="186" cy="60" r="8" fill={GOLD} stroke={INK} strokeWidth="3" />
        </g>
      </svg>

      {/* 몸통: 원본 사진 */}
      <img className="oc-fallback__photo" src={src} alt={alt} draggable={false} />

      {/* 앞 레이어: 테두리와 얼굴. 어떤 사진 위에서도 보이도록 흰 테두리를 깐다 */}
      <svg className="oc-fallback__layer" viewBox="0 0 200 230" aria-hidden="true" focusable="false">
        <rect x="28" y="10" width="144" height="168" rx="22" fill="none" stroke={GOLD} strokeWidth="3" />
        <ellipse cx="78" cy="84" rx="13" ry="15" fill="#ffffff" stroke={INK} strokeWidth="3" />
        <ellipse cx="122" cy="84" rx="13" ry="15" fill="#ffffff" stroke={INK} strokeWidth="3" />
        <circle cx="80" cy="88" r="6.5" fill={INK} />
        <circle cx="124" cy="88" r="6.5" fill={INK} />
        <circle cx="83" cy="85" r="2.2" fill="#ffffff" />
        <circle cx="127" cy="85" r="2.2" fill="#ffffff" />
        <path d={BROWS} fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
        <path d={BROWS} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="58" cy="106" r="7" fill="#ff9aa2" opacity="0.75" />
        <circle cx="142" cy="106" r="7" fill="#ff9aa2" opacity="0.75" />
        <path d={MOUTH} fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <path d={MOUTH} fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}
