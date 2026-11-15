import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { HandArt } from '../assets/EndingArt';
import type { Trial } from '../types/trial';
import { FallbackCharacter } from './FallbackCharacter';
import '../styles/animations.css';

type KeepEndingProps = {
  trial: Trial;
  /** 사용자가 엔딩 카드의 버튼을 누르면 한 번만 불린다 */
  onDone: () => void;
};

// swap: 캐릭터 → 원래 물건 / return: 손으로 귀환 / done: 안내 카드
type Phase = 'swap' | 'return' | 'done';

interface CSSVars extends CSSProperties {
  [name: `--${string}`]: string;
}

const SPARKS: CSSVars[] = [
  { '--x': '18%', '--y': '58%', '--delay': '0.3s' },
  { '--x': '30%', '--y': '40%', '--delay': '0.55s' },
  { '--x': '46%', '--y': '30%', '--delay': '0.8s' },
  { '--x': '62%', '--y': '36%', '--delay': '0.45s' },
  { '--x': '78%', '--y': '52%', '--delay': '0.7s' },
  { '--x': '24%', '--y': '74%', '--delay': '0.9s' },
  { '--x': '72%', '--y': '72%', '--delay': '0.6s' },
  { '--x': '52%', '--y': '48%', '--delay': '1.05s' },
];

const DEFAULT_KEEP_TIP = '상태를 한 번 점검하고 깨끗이 닦아 다시 사용해 보세요.';

const STATUS_TEXT: Record<Phase, string> = {
  swap: '피고인이 원래 물건의 모습으로 돌아갑니다.',
  return: '물건이 판사님 손으로 돌아오고 있습니다.',
  done: '무죄 판결에 따라 물건이 돌아왔습니다.',
};

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

/** 무죄 엔딩: 캐릭터가 원래 물건으로 돌아가 사람 손에 안긴다. */
export function KeepEnding({ trial, onDone }: KeepEndingProps) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('swap');
  const doneCalled = useRef(false);

  useEffect(() => {
    if (phase === 'done') return;
    const next: Phase = phase === 'swap' ? 'return' : 'done';
    const normalDelay = phase === 'swap' ? 800 : 1700;
    const reducedDelay = phase === 'swap' ? 350 : 450;
    const timer = window.setTimeout(() => setPhase(next), reduced ? reducedDelay : normalDelay);
    return () => window.clearTimeout(timer);
  }, [phase, reduced]);

  const finish = () => {
    if (doneCalled.current) return;
    doneCalled.current = true;
    onDone();
  };

  const objectName = trial.analysis?.objectName ?? '물건';
  const keepTip = trial.analysis?.keepTip || DEFAULT_KEEP_TIP;
  const returning = phase !== 'swap';

  return (
    <section
      className={`oc-ending oc-ending--keep${reduced ? ' oc-reduced' : ''}`}
      aria-label="무죄 엔딩"
    >
      <div className="oc-ending__heading"><p className="eyebrow">CASE CLOSED · 무죄</p><h1>다시 함께하기로 했습니다.</h1><p>익숙한 자리에서, 새로운 이야기를.</p></div>
      <div className="oc-stage">
        <div className={`oc-glow${returning ? ' oc-glow--on' : ''}`} aria-hidden="true" />
        <HandArt className={`oc-hand${returning ? ' oc-hand--rise' : ''}`} />

        <div className={`oc-object${returning ? ' oc-object--return' : ''}`}>
          <img
            className={`oc-photo${phase === 'swap' ? ' oc-swap-in' : ''}`}
            src={trial.sourceImage}
            alt={`원래 모습으로 돌아온 ${objectName}`}
            draggable={false}
          />
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

        {returning &&
          !reduced &&
          SPARKS.map((style) => (
            <span key={style['--x']} className="oc-spark" style={style} aria-hidden="true" />
          ))}
      </div>

      <p className="oc-status" role="status">
        {STATUS_TEXT[phase]}
      </p>

      {phase === 'done' && (
        <div className="oc-card oc-card--keep">
          <h2 className="oc-card__title">함께하기 전, 한 번만 확인해 주세요.</h2>
          <dl className="oc-card__list">
            <div>
              <dt>계속 쓰기 전에</dt>
              <dd>{keepTip}</dd>
            </div>
          </dl>
          <p className="oc-card__note">
            AI가 사진을 보고 낸 참고 의견입니다. 실제 상태는 직접 확인해 주세요.
          </p>
          <button type="button" className="oc-button" onClick={finish}>
            판결문 확인하기
          </button>
        </div>
      )}
    </section>
  );
}
