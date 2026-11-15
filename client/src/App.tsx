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
  }, [pageStage]);

  return (
    <div className={`app-shell${inCourt ? ' app-shell--court' : ''}`}>
      <CourtHeader muted={muted} onMute={() => setMuted((value) => !value)} onReset={trial ? reset : undefined} isDemo={Boolean(trial?.isDemo)} step={!trial ? undefined : stage === 'analyzing' ? 1 : inCourt ? 2 : 3} />

      <main className="flex flex-1 flex-col gap-5">
        {!trial && (
          <>
            <p className="font-display text-xl leading-snug text-gold-300">
              AI는 변론합니다.
              <br />
              판결은 인간이 내립니다.
            </p>
            <EvidenceUpload onSubmit={startTrial} onSample={startDemo} error={error} sampleFirst={SAMPLE_FIRST} />
          </>
        )}

        {trial && stage === 'analyzing' && (
          <Analyzing trial={trial} error={error} onRetry={retryAnalysis} onSample={() => startDemo('bottle')} />
        )}

        {/* 반대 심문(examination)은 법정 화면 안에서 진행한다. 질문에 답이 나오면 단계만 examination 으로 바뀐다. */}
        {trial && analysis && inCourt && (
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
        )}

        {trial && analysis && stage === 'verdict' && (
          <>
            <section className={card}>
              <h2 className={eyebrow}>참고 판단 근거 · AI 추정</h2>
              <p className="mt-2 text-sm text-court-300">가능한 선택지</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {analysis.plausibleOptions.map((option) => (
                  <li key={option} className={chip}>
                    {OPTION_LABEL[option]}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm leading-relaxed">{analysis.safetyNote}</p>
            </section>

            <section className="rounded-2xl border-2 border-gold-400 bg-court-900/85 p-4 sm:p-5">
              <h2 className={eyebrow}>판사님의 판결</h2>
              <p className="mb-4 mt-2 text-sm leading-relaxed">
                {analysis.defendantName}의 운명은 판사님이 정합니다. AI는 판결을 대신 내리지 않습니다.
              </p>
              <VerdictButtons onVerdict={giveVerdict} />
            </section>
          </>
        )}

        {trial && stage === 'keep-ending' && <KeepEnding trial={trial} onDone={() => go('result')} />}

        {trial && (stage === 'discard-ending' || stage === 'tool-select' || stage === 'action') && (
          <DiscardEnding trial={trial} onDone={() => go('result')} />
        )}

        {trial && analysis && stage === 'result' && <Result trial={trial} analysis={analysis} onRestart={reset} />}
      </main>

      <footer className="pt-8 text-center text-xs leading-relaxed text-court-300">
        AI 분석은 참고 정보입니다. 사진만으로 작동·위생·안전 상태를 판정하지 않습니다.
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
  // 20초가 지나면 샘플 재판으로 넘어갈 길을 함께 보여 준다 (TRD §5.6)
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 20_000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className={`${card} flex flex-col items-center gap-4 text-center`}>
      <img src={trial.sourceImage} alt="제출한 증거 사진" className="h-40 w-40 rounded-2xl object-cover ring-2 ring-court-700" />

      {error ? (
        <div role="alert" className="flex flex-col items-center gap-3">
          <p className="font-display text-xl">분석을 마치지 못했어요</p>
          <p className="text-sm text-court-300">{error}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" className={btnPrimary} onClick={onRetry}>
              다시 시도
            </button>
            <button type="button" className={btnGhost} onClick={onSample}>
              샘플 재판으로 계속
            </button>
          </div>
        </div>
      ) : (
        <div role="status" className="flex flex-col items-center gap-3">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent motion-reduce:animate-none"
            aria-hidden="true"
          />
          <p className="font-display text-xl">증거를 살펴보는 중…</p>
          <p className="text-sm text-court-300">물건의 종류와 보이는 상태를 확인하고 변론을 준비합니다.</p>
          {slow && (
            <>
              <p className="text-sm">응답이 늦어지고 있어요.</p>
              <button type="button" className={btnGhost} onClick={onSample}>
                샘플 재판으로 계속
              </button>
            </>
          )}
        </div>
      )}
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
    <section className={`${card} flex flex-col gap-4`}>
      <div className="flex items-center gap-4">
        <img src={trial.sourceImage} alt={analysis.objectName} className="h-20 w-20 shrink-0 rounded-xl object-cover ring-2 ring-court-700" />
        <div>
          <h2 className={eyebrow}>판결문</h2>
          <p className={`mt-1 font-display text-2xl font-bold ${kept ? 'text-keep' : 'text-gold-300'}`}>
            {kept ? '무죄' : '유죄'}
          </p>
          <p className="text-sm">{kept ? '다시 함께하기로 했습니다.' : '폐기 판결이 집행되었습니다.'}</p>
        </div>
      </div>

      {/* 관리 팁과 배출 안내는 엔딩 컴포넌트의 안내 카드가 이미 보여 준다. 여기서는 되풀이하지 않는다. */}
      {!kept && (
        <p className="rounded-lg border border-gold-500/60 bg-gold-400/10 px-3 py-2 text-sm">
          가상 연출입니다. 실제로 물건을 부수거나 태우지 마세요.
        </p>
      )}

      <p className="text-xs leading-relaxed text-court-300">
        관리·배출 안내는 일반 참고 정보입니다. 지역 규정과 품목별 세부 사항은 직접 확인해 주세요.
      </p>

      <button type="button" className={btnPrimary} onClick={onRestart}>
        처음부터 다시
      </button>
    </section>
  );
}
