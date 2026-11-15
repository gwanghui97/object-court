import { UiIcon } from './UiIcon';

type Props = {
  muted: boolean;
  onMute: () => void;
  onReset?: () => void;
  isDemo: boolean;
  step?: number;
};

const STEPS = ['사건 접수', '최후 변론', '판결 선고'];

export function CourtHeader({ muted, onMute, onReset, isDemo, step }: Props) {
  return (
    <>
      <header className="court-header">
        <a className="court-header__brand" href="#main-content" onClick={onReset} aria-label="사물 재판소 처음으로">
          <span><span className="court-header__wordmark">사물재판소<span className="brand-period">.</span></span><span className="court-header__english">OBJECT COURT</span></span>
        </a>
        <nav className="court-header__tools" aria-label="재판 도구">
          <span className="court-header__project">물건에게도, 한 번의 기회를.</span>
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
          <span className="trial-progress__case">A SAIDA PROJECT<span>최후의 변론</span></span>
          <ol aria-label="재판 진행 단계">
            {STEPS.map((label, index) => (
              <li key={label} className={index + 1 <= step ? 'is-reached' : ''} aria-current={index + 1 === step ? 'step' : undefined}>
                <span aria-hidden="true">{index + 1 < step ? <UiIcon name="check" /> : String(index + 1).padStart(2, '0')}</span>{label}
              </li>
            ))}
          </ol>
          {isDemo && <span className="trial-progress__demo">샘플 재판</span>}
        </div>
      )}
    </>
  );
}
