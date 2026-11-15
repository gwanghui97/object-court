// 화면 전체가 함께 쓰는 Tailwind 클래스 묶음

const btnBase =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

export const btnPrimary = `${btnBase} bg-gold-400 text-court-950 hover:bg-gold-300`;

export const btnGhost = `${btnBase} border border-court-500 text-parchment hover:border-gold-400 hover:text-gold-300`;

// 여러 줄이 될 수 있는 선택지 버튼 (추천 질문 등)
export const btnChoice =
  'flex min-h-12 w-full items-center rounded-xl border border-court-500 px-4 py-3 text-left text-base transition ' +
  'hover:border-gold-400 hover:text-gold-300 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300';

export const btnQuiet =
  'inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-court-300 transition hover:text-gold-300 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300';

export const card = 'rounded-2xl border border-court-700/80 bg-court-900/85 p-4 shadow-lg shadow-black/25 sm:p-5';

export const eyebrow = 'text-xs font-semibold tracking-[0.18em] text-gold-400';

export const chip = 'rounded-full border border-court-500 px-3 py-1 text-xs text-court-300';
