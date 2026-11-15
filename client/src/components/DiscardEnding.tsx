import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { CrackArt, GavelArt, TrashBinArt } from '../assets/EndingArt';
import type { Trial, VirtualTool } from '../types/trial';
import { FallbackCharacter } from './FallbackCharacter';
import '../styles/animations.css';

type DiscardEndingProps = {
  trial: Trial;
  /** 사용자가 엔딩 카드의 버튼을 누르면 한 번만 불린다 */
  onDone: () => void;
};

// swap: 캐릭터 → 원래 물건 / select: 도구 고르기 / action: 가상 연출 / done: 안내 카드
type Phase = 'swap' | 'select' | 'action' | 'done';
// 지금 구현된 도구(P0). flame·stomp(P1)를 넣을 때 여기를 넓힌다.
type Tool = Extract<VirtualTool, 'hammer' | 'trash'>;
type HammerStep = 'swing' | 'impact' | 'shatter';

interface CSSVars extends CSSProperties {
  [name: `--${string}`]: string;
}

// 망치 연출 시각(ms). animations.css 의 oc-strike 타격 지점(0.62s × 78%)과 맞춘다.
const HAMMER_IMPACT_AT = 480;
const HAMMER_SHATTER_AT = 980;
const HAMMER_DONE_AT = 1950;
const TRASH_DONE_AT = 1650;
const REDUCED_DONE_AT = 600;

// 3×3 파편이 날아가는 방향(물건 크기 대비 %)과 회전(deg).
// 무대(.oc-stage) 밖으로 나가 잘리지 않도록 이동 거리를 물건 크기의 절반 안쪽으로 둔다.
const PIECE_MOTION: ReadonlyArray<readonly [dx: number, dy: number, rot: number]> = [
  [-40, -32, -38],
  [-4, -44, 16],
  [38, -30, 42],
  [-48, -4, -24],
  [6, 20, 14],
  [46, 2, 30],
  [-36, 36, -46],
  [4, 48, 22],
  [40, 38, 54],
];

const PIECES: CSSVars[] = PIECE_MOTION.map(([dx, dy, rot], index) => {
  const row = Math.floor(index / 3);
  const col = index % 3;
  return {
    '--t': `${row * 33.3}%`,
    '--b': `${(2 - row) * 33.3}%`,
    '--l': `${col * 33.3}%`,
    '--r': `${(2 - col) * 33.3}%`,
    '--ox': `${col * 33.3 + 16.7}%`,
    '--oy': `${row * 33.3 + 16.7}%`,
    '--dx': `${dx}%`,
    '--dy': `${dy}%`,
    '--rot': `${rot}deg`,
  };
});

const VIRTUAL_NOTICE = '가상 연출입니다. 실제로 물건을 부수거나 태우지 마세요.';
const DEFAULT_DISCARD_TIP = '재질과 지역 배출 지침을 확인해 알맞은 방법으로 분리배출하세요.';
const DEFAULT_SAFETY_NOTE = '사진만으로는 안전한 처리 방법을 확정할 수 없습니다.';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

function statusText(phase: Phase, tool: Tool | null): string {
  if (phase === 'swap') return '피고인이 원래 물건의 모습으로 돌아갑니다.';
  if (phase === 'select') return '가상 집행 도구를 골라 주세요.';
  if (phase === 'done') return '가상 집행이 끝났습니다.';
  return tool === 'hammer' ? '가상 망치로 집행하는 중입니다.' : '가상 쓰레기통에 넣는 중입니다.';
}

/** 유죄 엔딩: 원래 물건으로 돌아간 뒤 가상 도구로 집행하고 실제 배출 안내를 보여 준다. */
export function DiscardEnding({ trial, onDone }: DiscardEndingProps) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('swap');
  const [tool, setTool] = useState<Tool | null>(null);
  const [hammerStep, setHammerStep] = useState<HammerStep>('swing');
  const doneCalled = useRef(false);

  // 캐릭터 → 원래 물건 전환이 끝나면 도구 선택으로 넘어간다
  useEffect(() => {
    if (phase !== 'swap') return;
    const timer = window.setTimeout(() => setPhase('select'), reduced ? 350 : 800);
    return () => window.clearTimeout(timer);
  }, [phase, reduced]);

  // 고른 도구의 연출을 시간 순서대로 진행한다
  useEffect(() => {
    if (phase !== 'action' || tool === null) return;
    const timers: number[] = [];
    const at = (ms: number, run: () => void) => timers.push(window.setTimeout(run, ms));

    if (reduced) {
      at(REDUCED_DONE_AT, () => setPhase('done'));
    } else if (tool === 'hammer') {
      at(HAMMER_IMPACT_AT, () => setHammerStep('impact'));
      at(HAMMER_SHATTER_AT, () => setHammerStep('shatter'));
      at(HAMMER_DONE_AT, () => setPhase('done'));
    } else {
      at(TRASH_DONE_AT, () => setPhase('done'));
    }

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [phase, tool, reduced]);

  const start = (picked: Tool) => {
    if (phase !== 'select') return;
    setTool(picked);
    setHammerStep('swing');
    setPhase('action');
  };

  const finish = () => {
    if (doneCalled.current) return;
    doneCalled.current = true;
    onDone();
  };

  const objectName = trial.analysis?.objectName ?? '물건';
  const discardTip = trial.analysis?.discardTip || DEFAULT_DISCARD_TIP;
  const safetyNote = trial.analysis?.safetyNote || DEFAULT_SAFETY_NOTE;

  const acting = phase === 'action';
  const hammerActing = acting && tool === 'hammer' && !reduced;
  const shattered = hammerActing && hammerStep === 'shatter';
  const cracked = hammerActing && hammerStep === 'impact';

  let objectClass = 'oc-object';
  if (acting && reduced) objectClass += ' oc-object--fade';
  else if (shattered) objectClass += ' oc-object--pieces';
  else if (cracked) objectClass += ' oc-object--hit';
  else if (acting && tool === 'trash') objectClass += ' oc-object--toss';

  return (
    <section
      className={`oc-ending oc-ending--discard${reduced ? ' oc-reduced' : ''}`}
      aria-label="유죄 엔딩"
    >
      <div className="oc-stage">
        {phase !== 'done' && (
          <div className={objectClass}>
            {shattered ? (
              PIECES.map((style) => (
                <div key={`${style['--t']}-${style['--l']}`} className="oc-piece" style={style}>
                  <img className="oc-photo" src={trial.sourceImage} alt="" draggable={false} />
                </div>
              ))
            ) : (
              <img
                className={`oc-photo${phase === 'swap' ? ' oc-swap-in' : ''}`}
                src={trial.sourceImage}
                alt={`원래 모습으로 돌아온 ${objectName}`}
                draggable={false}
              />
            )}
            {cracked && <CrackArt className="oc-crack" />}
            {phase === 'swap' && (
              <div className="oc-layer oc-swap-out" aria-hidden="true">
                {trial.characterImage ? (
                  <img className="oc-photo oc-character-art" src={trial.characterImage} alt="" draggable={false} />
                ) : (
                  <FallbackCharacter src={trial.sourceImage} alt="" />
                )}
              </div>
            )}
          </div>
        )}

        {tool === 'hammer' && (acting || phase === 'done') && (
          <GavelArt className="oc-gavel oc-gavel--strike" />
        )}
        {hammerActing && hammerStep !== 'swing' && <span className="oc-flash" aria-hidden="true" />}
        {tool === 'trash' && (acting || phase === 'done') && <TrashBinArt className="oc-bin" />}
      </div>

      <p className="oc-status" role="status">
        {statusText(phase, tool)}
      </p>

      {phase === 'select' && (
        <>
          <div className="oc-tools" role="group" aria-label="가상 집행 도구">
            <button type="button" className="oc-tool" onClick={() => start('hammer')}>
              <GavelArt className="oc-tool__icon" />
              <span>망치</span>
            </button>
            <button type="button" className="oc-tool" onClick={() => start('trash')}>
              <TrashBinArt className="oc-tool__icon" />
              <span>쓰레기통</span>
            </button>
          </div>
          <p className="oc-card__note">게임 속 가상 연출입니다. 실제 물건에는 아무 일도 일어나지 않습니다.</p>
        </>
      )}

      {phase === 'done' && (
        <div className="oc-card oc-card--discard">
          <h2 className="oc-card__title">가상 집행이 끝났습니다</h2>
          <p className="oc-card__warning">{VIRTUAL_NOTICE}</p>
          <dl className="oc-card__list">
            <div>
              <dt>실제로 버릴 때</dt>
              <dd>{discardTip}</dd>
            </div>
            <div>
              <dt>확인할 점</dt>
              <dd>{safetyNote}</dd>
            </div>
          </dl>
          <p className="oc-card__note">
            배출 안내는 일반 참고 정보입니다. 지역과 품목에 따라 다르니 따로 확인해 주세요.
          </p>
          <button type="button" className="oc-button" onClick={finish}>
            결과 보기
          </button>
        </div>
      )}
    </section>
  );
}
