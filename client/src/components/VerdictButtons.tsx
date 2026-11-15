// 인간의 판결: 무죄(계속 사용·수리) 또는 유죄(폐기). AI 는 이 선택을 대신하지 않는다.

type Props = {
  onVerdict: (verdict: 'keep' | 'discard') => void;
};

const base =
  'flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-4 transition ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300';

export function VerdictButtons({ onVerdict }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" className={`${base} bg-keep text-court-950 hover:brightness-110`} onClick={() => onVerdict('keep')}>
        <span className="font-display text-3xl font-bold">무죄</span>
        <span className="text-sm font-semibold">계속 사용 · 수리</span>
      </button>
      <button type="button" className={`${base} bg-discard text-white hover:brightness-110`} onClick={() => onVerdict('discard')}>
        <span className="font-display text-3xl font-bold">유죄</span>
        <span className="text-sm font-semibold">폐기</span>
      </button>
    </div>
  );
}
