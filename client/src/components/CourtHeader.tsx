import { UiIcon } from './UiIcon';

type Props = {
  muted: boolean;
  onMute: () => void;
  onReset?: () => void;
  isDemo: boolean;
  step?: number;
};

const STEPS = ['증거 제출', '최후 변론', '판결'];

export function CourtHeader({ muted, onMute, onReset, isDemo, step }: Props) {
  return (
    <>
      <header className="court-header">
        <div className="court-header__brand">
          <p>OBJECT COURT</p>
          <h1>사물 재판소</h1>
        </div>
        <nav className="court-header__tools" aria-label="재판 도구">
          <button type="button" className="court-icon-button" aria-label={muted ? '소리 켜기' : '음소거'} title={muted ? '소리 켜기' : '음소거'} aria-pressed={muted} onClick={onMute}>
            <UiIcon name={muted ? 'muted' : 'sound'} />
          </button>
          {onReset && (
            <button type="button" className="court-icon-button" aria-label="처음부터" title="처음부터" onClick={onReset}>
              <UiIcon name="restart" />
            </button>
          )}
        </nav>
      </header>
      {step !== undefined && (
        <div className="trial-progress">
          <ol aria-label="재판 진행 단계">
            {STEPS.map((label, index) => (
              <li key={label} className={index + 1 <= step ? 'is-reached' : ''} aria-current={index + 1 === step ? 'step' : undefined}>
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{label}
              </li>
            ))}
          </ol>
          {isDemo && <span className="trial-progress__demo">데모</span>}
        </div>
      )}
    </>
  );
}
