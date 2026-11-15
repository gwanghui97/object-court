import { useCallback, useEffect, useState } from 'react';
import { CrossExamination } from './components/CrossExamination';
import { CourtHeader } from './components/CourtHeader';
import { DefendantStage } from './components/DefendantStage';
import { DefenseSpeech } from './components/DefenseSpeech';
import { DiscardEnding } from './components/DiscardEnding';
import { EvidenceUpload } from './components/EvidenceUpload';
import { KeepEnding } from './components/KeepEnding';
import { VerdictButtons } from './components/VerdictButtons';
import { UiIcon } from './components/UiIcon';
import { SAMPLE_TRIALS } from './data/sampleTrial';
import { useTrial } from './hooks/useTrial';
import { btnGhost, btnPrimary, card, chip, eyebrow } from './lib/ui';
import type { PlausibleOption, Trial, TrialAnalysis } from './types/trial';

const SAMPLE_FIRST = new URLSearchParams(window.location.search).get('demo') === '1';

const OPTION_LABEL: Record<PlausibleOption, string> = {
  keep: '계속 사용',
  repair: '수리',
  donate: '나눔·기부',
  discard: '폐기',
};

export default function App() {
  const { trial, error, startTrial, startDemo, retryAnalysis, go, giveVerdict, noteQuestionAnswered, reset } = useTrial();
  // 지금 소리를 내는 쪽. 변론과 심문 답변이 겹쳐 들리지 않게 한쪽이 시작하면 다른 쪽을 멈춘다.
  const [speaker, setSpeaker] = useState<'defense' | 'answer' | null>(null);
  const [muted, setMuted] = useState(false);
  const stage = trial?.stage ?? 'home';
  const analysis = trial?.analysis;
  const inCourt = stage === 'courtroom' || stage === 'examination';
  const pageStage = inCourt ? 'courtroom' : stage;

  const onDefenseSpeaking = useCallback((speaking: boolean) => {
    setSpeaker((current) => (speaking ? 'defense' : current === 'defense' ? null : current));
  }, []);
  const onAnswerSpeaking = useCallback((speaking: boolean) => {
    setSpeaker((current) => (speaking ? 'answer' : current === 'answer' ? null : current));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (trial) document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [pageStage]);

  return (
    <div className={`app-shell${inCourt ? ' app-shell--court' : !trial ? ' app-shell--home' : ''}`}>
      <a className="skip-link" href="#main-content">본문으로 바로가기</a>
      <CourtHeader muted={muted} onMute={() => setMuted((value) => !value)} onReset={trial ? reset : undefined} isDemo={Boolean(trial?.isDemo)} step={!trial || stage === 'analyzing' ? 1 : inCourt ? 2 : 3} />

      <main id="main-content" className={`court-main${!trial ? ' court-main--home' : ''}`} tabIndex={-1}>
        {!trial && (
          <>
            <section className="home-intro">
              <p className="eyebrow home-intro__eyebrow"><span />물건에게도 할 말이 있으니까.</p>
              <h1>버리기 전에,<br /><em>변론부터</em> 들어보세요.</h1>
              <p className="home-intro__description">당신이 버리려던 그 물건, 마지막으로 할 말이 있대요.<br />사진 한 장으로 시작되는 작고 진지한 재판극.</p>
              <div className="home-scene" aria-label="평범한 물통이 법정의 피고인이 된 모습">
                <div className="home-scene__arch" aria-hidden="true"><UiIcon name="scales" /></div>
                <div className="home-scene__evidence"><span>증거물 A</span><img src={SAMPLE_TRIALS.bottle.sourceImage} alt="원래 물통" draggable={false} /><small>그냥 물통이었는데…</small></div>
                <img className="home-scene__defendant" src={SAMPLE_TRIALS.bottle.characterImage} alt="마지막 변론을 준비하는 물통 피고인" draggable={false} />
                <span className="home-scene__aside">“아직, 할 말이 있어요.”</span>
                <div className="home-scene__bench"><span>피 고 인 석</span></div>
              </div>
              <p className="home-intro__principle"><UiIcon name="scales" />AI는 변론합니다. <strong>판결은 당신이 내립니다.</strong></p>
            </section>
            <EvidenceUpload onSubmit={startTrial} onSample={startDemo} error={error} sampleFirst={SAMPLE_FIRST} />
          </>
        )}

        {trial && stage === 'analyzing' && (
          <Analyzing trial={trial} error={error} onRetry={retryAnalysis} onSample={() => startDemo('bottle')} />
        )}

        {/* 반대 심문(examination)은 법정 화면 안에서 진행한다. 질문에 답이 나오면 단계만 examination 으로 바뀐다. */}
        {trial && analysis && inCourt && (
          <>
          <div className="screen-heading"><div><p className={eyebrow}>THE LAST DEFENSE</p><h1>피고인의 이야기를 들어주세요.</h1></div><span className="court-chip">{analysis.objectName} · 심리 중</span></div>
          <div className="courtroom-layout">
            <div className="courtroom-character">
            <DefendantStage
              name={analysis.defendantName}
              sourceImage={trial.sourceImage}
              characterImage={trial.characterImage}
              imageStatus={trial.imageStatus}
              speaking={speaker !== null}
            />
            </div>
            <div className="courtroom-content">
            <DefenseSpeech
              defendantName={analysis.defendantName}
              text={analysis.defenseSpeech}
              voiceDirection={analysis.voiceDirection}
              presetAudioUrl={trial.speechAudioUrl}
              disableRemote={trial.isDemo}
              muted={muted}
              silenced={speaker === 'answer'}
              onSpeakingChange={onDefenseSpeaking}
            />
            <p className="court-safety-note">{analysis.safetyNote}</p>
            <Indictment analysis={analysis} reason={trial.reason} />
            <details className="court-disclosure">
              <summary>
                <span><strong>반대 심문</strong><small>선택 · 질문 1회</small></span>
                <UiIcon name="chevron" />
              </summary>
              <div className="court-disclosure__body">
            <CrossExamination
              key={trial.id}
              analysis={analysis}
              isDemo={trial.isDemo}
              muted={muted}
              silenced={speaker === 'defense'}
              onSpeakingChange={onAnswerSpeaking}
              onAnswered={noteQuestionAnswered}
            />
              </div>
            </details>
            <div className="court-verdict-action">
              <p>판결은 판사님이 내립니다.</p>
              <button type="button" className={btnPrimary} onClick={() => go('verdict')}>
                판결하러 가기 <UiIcon name="arrow" />
              </button>
            </div>
            </div>
          </div>
          </>
        )}

        {trial && analysis && stage === 'verdict' && (
          <div className="decision-layout">
            <div className="decision-context">
              <div className="verdict-defendant">
                <img src={trial.characterImage || trial.sourceImage} alt={`피고인 ${analysis.defendantName}`} draggable={false} />
                <p>피고인 <strong>{analysis.defendantName}</strong></p>
              </div>
            <details className="court-disclosure">
              <summary><span><strong>참고 판단 근거</strong><small>AI 추정 · 가능한 선택지와 주의 사항</small></span><UiIcon name="chevron" /></summary>
              <div className="court-disclosure__body">
              <p className="mt-2 text-sm text-court-300">가능한 선택지</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {analysis.plausibleOptions.map((option) => (
                  <li key={option} className={chip}>
                    {OPTION_LABEL[option]}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm leading-relaxed">{analysis.safetyNote}</p>
              </div>
            </details>
            </div>
            <section className="verdict-panel">
              <h2 className={eyebrow}>판사님의 판결</h2>
              <h1 className="verdict-panel__title">이 물건의 다음을,<br />판결해 주세요.</h1>
              <p className="verdict-panel__note">변론은 여기까지입니다.<br />{analysis.defendantName}의 다음은 판사님이 정해 주세요.</p>
              <VerdictButtons onVerdict={giveVerdict} />
              <button type="button" className="court-text-link" onClick={() => go('courtroom')}>변론 다시 살펴보기</button>
            </section>
          </div>
        )}

        {trial && stage === 'keep-ending' && <KeepEnding trial={trial} onDone={() => go('result')} />}

        {trial && (stage === 'discard-ending' || stage === 'tool-select' || stage === 'action') && (
          <DiscardEnding trial={trial} onDone={() => go('result')} />
        )}

        {trial && analysis && stage === 'result' && <Result trial={trial} analysis={analysis} onRestart={reset} />}
      </main>

      <footer className="court-footer">
        <span>A SAIDA PROJECT <span>·</span> 사물 재판소</span>
        <p>사진만으로 작동·위생·안전 상태를 판정하지 않습니다.</p>
        <span>작은 물건을 위한, 신중한 판결.</span>
      </footer>
    </div>
  );
}

function Analyzing({
  trial,
  error,
  onRetry,
  onSample,
}: {
  trial: Trial;
  error: string | null;
  onRetry: () => void;
  onSample: () => void;
}) {
  const [slow, setSlow] = useState(false);
  const [recordStep, setRecordStep] = useState(0);
  useEffect(() => {
    const timers = [
      window.setTimeout(() => setRecordStep(1), 3000),
      window.setTimeout(() => setRecordStep(2), 8000),
      window.setTimeout(() => setSlow(true), 20_000),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <section className={`${card} analysis-sheet`}>
      <figure className="analysis-evidence"><img src={trial.sourceImage} alt="제출한 증거 사진" /><figcaption>증 제 001호 · 제출된 증거</figcaption></figure>
      <div className="analysis-content">
      <p className={eyebrow}>COURT RECORD · 사건 접수</p>
      {error ? (
        <div role="alert">
          <h1>잠시, 휴정하겠습니다.</h1>
          <p className="court-error mt-4">{error}</p>
          <div className="analysis-actions">
            <button type="button" className={btnPrimary} onClick={onRetry}>
              다시 시도
            </button>
            <button type="button" className={btnGhost} onClick={onSample}>
              샘플 재판으로 계속
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1>작은 재판을<br />준비하고 있습니다.</h1>
          <ol className="analysis-record" aria-label="재판 준비 기록" aria-live="polite">
            {['증거 사진을 살펴보는 중', '피고인의 진술을 준비하는 중', '법정 입장을 기다리는 중'].map((label, index) => (
              <li key={label} aria-current={index === recordStep ? 'step' : undefined}>
                <span aria-hidden="true">{index < recordStep ? <UiIcon name="check" /> : `0${index + 1}`}</span><strong>{label}{index === recordStep ? '…' : ''}</strong>
              </li>
            ))}
          </ol>
          {slow && (
            <div className="mt-6" role="status">
              <p className="mb-3 text-sm text-court-300">조금 늦어지고 있어요. 기다리거나 샘플 재판을 살펴보세요.</p>
              <button type="button" className={btnGhost} onClick={onSample}>
                샘플 재판으로 계속
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </section>
  );
}

function Indictment({ analysis, reason }: { analysis: TrialAnalysis; reason: string }) {
  return (
    <details className="court-disclosure">
      <summary>
        <span><strong>기소장 · AI 분석</strong><small>{reason || analysis.objectName}</small></span>
        <UiIcon name="chevron" />
      </summary>
      <div className="court-disclosure__body">

      <h3 className="mt-4 text-sm font-semibold text-gold-300">사진에서 보이는 것</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed">
        {analysis.visibleObservations.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h3 className="mt-4 text-sm font-semibold text-gold-300">사진만으로 알 수 없는 것</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-court-300">
        {analysis.unknowns.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      </div>
    </details>
  );
}

function Result({ trial, analysis, onRestart }: { trial: Trial; analysis: TrialAnalysis; onRestart: () => void }) {
  const kept = trial.verdict === 'keep';

  return (
    <section className={`verdict-document${kept ? ' verdict-document--keep' : ''}`}>
      <div className="verdict-document__meta"><span>OBJECT COURT · CASE 001</span><h1>최종 판결문</h1></div>
      <div className="verdict-document__portrait">
        <img src={trial.sourceImage} alt={`원래 모습으로 돌아온 ${analysis.objectName}`} draggable={false} />
        <div className="verdict-stamp"><strong>{kept ? '무죄' : '유죄'}</strong><span>{kept ? '보관 · 수리' : '안전한 배출'}</span></div>
      </div>
      <p className="verdict-document__defendant">피고인 {analysis.defendantName}</p>
      <p className="verdict-document__title">{kept ? '우리, 다시 함께해요.' : '마지막까지, 올바르게.'}</p>
      <p className="verdict-document__subtitle">{kept ? '다시 함께하기로 했습니다.' : '폐기 판결이 집행되었습니다.'}</p>
      <dl className="result-guidance">
        <div><dt>{kept ? '계속 쓰기 전에' : '실제로 버릴 때'}</dt><dd>{kept ? analysis.keepTip : analysis.discardTip}</dd></div>
        <div><dt>확인이 필요한 점</dt><dd>{analysis.safetyNote}</dd></div>
      </dl>
      {!kept && (
        <p className="rounded-lg border border-gold-500/60 bg-gold-400/10 px-3 py-2 text-sm">
          가상 연출입니다. 실제로 물건을 부수거나 태우지 마세요.
        </p>
      )}

      <p className="verdict-document__fineprint">
        관리·배출 안내는 일반 참고 정보입니다. 지역 규정과 품목별 세부 사항은 직접 확인해 주세요.
      </p>

      <button type="button" className={btnPrimary} onClick={onRestart}>
        새 사건 접수 <UiIcon name="arrow" />
      </button>
    </section>
  );
}
