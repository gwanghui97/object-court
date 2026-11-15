// 인간의 판결: 무죄(계속 사용·수리) 또는 유죄(폐기). AI 는 이 선택을 대신하지 않는다.
import { useEffect, useState } from 'react';

type Props = {
  onVerdict: (verdict: 'keep' | 'discard') => void;
};

export function VerdictButtons({ onVerdict }: Props) {
  const [verdict, setVerdict] = useState<'keep' | 'discard' | null>(null);
  useEffect(() => {
    if (!verdict) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => onVerdict(verdict), reduced ? 0 : 550);
    return () => window.clearTimeout(timer);
  }, [verdict, onVerdict]);

  return (
    <div className="verdict-choices">
      <button type="button" className="verdict-choice verdict-choice--keep" disabled={verdict !== null} onClick={() => setVerdict('keep')}>
        <span className="verdict-choice__number">판결 제 01호</span>
        <strong>무죄</strong>
        <span>다시 사용하기</span>
        <small>우리에게 한 번 더 기회를.</small>
      </button>
      <button type="button" className="verdict-choice verdict-choice--discard" disabled={verdict !== null} onClick={() => setVerdict('discard')}>
        <span className="verdict-choice__number">판결 제 02호</span>
        <strong>유죄</strong>
        <span>이제 보내주기</span>
        <small>마지막까지 올바른 방법으로.</small>
      </button>
      {verdict && <div className={`verdict-seal verdict-seal--${verdict}`} role="status"><span>{verdict === 'keep' ? '무죄' : '유죄'}<small>판 결 선 고</small></span></div>}
    </div>
  );
}
