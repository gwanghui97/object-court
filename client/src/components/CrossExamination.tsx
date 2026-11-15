// 반대 심문 (P1, TRD §5.4): 질문 1회. 추천 질문 3개는 API 가 실패해도 분석 결과로 답한다.
import { useEffect, useId, useRef, useState } from 'react';
import { requestCrossExamine } from '../lib/api';
import { btnChoice, btnPrimary, chip } from '../lib/ui';
import type { TrialAnalysis } from '../types/trial';
import { SpeechPlayer } from './SpeechPlayer';

const QUESTION_MAX = 200;

type Answer = {
  text: string;
  /** 판사가 직접 확인해야 할 점. 역할극 답변과 나눠서 보여 준다 */
  caution?: string;
  /** AI 가 만든 답이면 true, 분석 결과로 만든 준비된 답이면 false */
  fromAi: boolean;
};

const RECOMMENDED: Array<{ question: string; answer: (analysis: TrialAnalysis) => Answer }> = [
  {
    question: '아직 쓸 수 있다는 근거가 있습니까?',
    answer: (analysis) => ({
      text: `판사님, 제 겉모습에서 보이는 건 이 정도입니다. ${analysis.visibleObservations.join(', ')}. 그 이상은 저도 장담하지 못합니다.`,
      caution: `사진만으로 알 수 없는 점: ${analysis.unknowns.join(', ')}`,
      fromAi: false,
    }),
  },
  {
    question: '계속 쓰려면 무엇을 확인해야 합니까?',
    answer: (analysis) => ({ text: `판사님, 이것만 확인해 주세요. ${analysis.keepTip}`, fromAi: false }),
  },
  {
    question: '버린다면 어떻게 버려야 합니까?',
    answer: (analysis) => ({
      text: `그때는 이렇게 보내 주세요. ${analysis.discardTip}`,
      caution: analysis.safetyNote,
      fromAi: false,
    }),
  },
];

type Props = {
  analysis: TrialAnalysis;
  /** 샘플 재판이면 AI 를 부르지 않고 추천 질문의 준비된 답만 쓴다 */
  isDemo: boolean;
  muted: boolean;
  silenced?: boolean;
  onSpeakingChange?: (speaking: boolean) => void;
  /** 답이 화면에 나왔을 때 한 번 부른다 */
  onAnswered: () => void;
};

export function CrossExamination({ analysis, isDemo, muted, silenced, onSpeakingChange, onAnswered }: Props) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle');
  const [asked, setAsked] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [draft, setDraft] = useState('');
  const [freeFailed, setFreeFailed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputId = useId();

  useEffect(() => () => abortRef.current?.abort(), []);

  async function ask(question: string, prepared?: Answer) {
    if (phase !== 'idle') return;
    const finish = (next: Answer) => {
      setAnswer(next);
      setPhase('done');
      onAnswered();
    };

    setAsked(question);
    if (isDemo && prepared) {
      finish(prepared);
      return;
    }

    setPhase('loading');
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await requestCrossExamine(analysis, question, controller.signal);
      if (controller.signal.aborted) return;
      finish({ text: response.answer, caution: response.caution, fromAi: true });
    } catch {
      if (controller.signal.aborted) return;
      if (prepared) {
        finish(prepared);
        return;
      }
      // 직접 쓴 질문은 준비된 답이 없다. 질문 기회를 쓰지 않고 추천 질문으로 돌려보낸다.
      setFreeFailed(true);
      setPhase('idle');
    }
  }

  return (
    <section aria-label="반대 심문">

      {phase === 'idle' && (
        <>
          <p className="mt-1 text-sm text-court-300">피고인에게 한 번 물어볼 수 있습니다. 묻지 않고 판결해도 됩니다.</p>
          {freeFailed && (
            <p role="alert" className="mt-3 rounded-lg border border-court-500 px-3 py-2 text-sm">
              피고인이 그 질문에는 답을 준비하지 못했어요. 아래 질문 중에서 골라 주세요.
            </p>
          )}
          <ul className="mt-3 flex flex-col gap-2">
            {RECOMMENDED.map((item) => (
              <li key={item.question}>
                <button type="button" className={btnChoice} onClick={() => void ask(item.question, item.answer(analysis))}>
                  {item.question}
                </button>
              </li>
            ))}
          </ul>
          {!isDemo && !freeFailed && (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const question = draft.trim();
                if (question) void ask(question);
              }}
            >
              <label htmlFor={inputId} className="sr-only">
                직접 질문하기
              </label>
              <input
                id={inputId}
                type="text"
                value={draft}
                maxLength={QUESTION_MAX}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="직접 질문하기"
                className="min-w-0 flex-1 rounded-xl border border-court-500 bg-court-950/60 px-4 py-3 text-base placeholder:text-court-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
              />
              <button type="submit" className={btnPrimary} disabled={!draft.trim()}>
                질문
              </button>
            </form>
          )}
        </>
      )}

      {phase === 'loading' && (
        <p role="status" className="mt-3 text-sm text-court-300">
          “{asked}” — 피고인이 답을 준비하는 중…
        </p>
      )}

      {phase === 'done' && answer && (
        <>
          <p className="mt-2 text-sm text-court-300">판사: “{asked}”</p>
          <blockquote className="mt-2">
            <p className="font-display text-lg leading-relaxed">“{answer.text}”</p>
            <footer className="mt-2 flex flex-wrap items-center gap-2 text-sm text-court-300">
              — {analysis.defendantName}
              <span className={chip}>{answer.fromAi ? 'AI 답변' : '준비된 답변'}</span>
            </footer>
          </blockquote>
          {answer.caution && (
            <p className="mt-3 rounded-lg border border-court-500 px-3 py-2 text-sm leading-relaxed">
              <span className="font-semibold text-gold-300">확인이 필요한 점</span> {answer.caution}
            </p>
          )}
          <div className="mt-4">
            <SpeechPlayer
              text={answer.text}
              voiceDirection={analysis.voiceDirection}
              disableRemote={isDemo || !answer.fromAi}
              idleLabel="답변 듣기"
              muted={muted}
              silenced={silenced}
              onSpeakingChange={onSpeakingChange}
            />
          </div>
        </>
      )}
    </section>
  );
}
