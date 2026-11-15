// 홈: 증거(사진) 제출, 버리는 이유 입력, 샘플 재판 진입
import { useEffect, useId, useState } from 'react';
import { SAMPLE_TRIALS, type SampleKey } from '../data/sampleTrial';
import { btnPrimary, card, eyebrow } from '../lib/ui';

const REASON_MAX = 300;
const SAMPLE_KEYS = Object.keys(SAMPLE_TRIALS) as SampleKey[];

type Props = {
  onSubmit: (file: File, reason: string) => Promise<void>;
  onSample: (key: SampleKey) => void;
  error: string | null;
  /** ?demo=1 로 들어오면 샘플 재판을 먼저 보여 준다 */
  sampleFirst: boolean;
};

export function EvidenceUpload({ onSubmit, onSample, error, sampleFirst }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const fileId = useId();
  const reasonId = useId();

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function submit() {
    if (!file || busy) return;
    setBusy(true);
    try {
      await onSubmit(file, reason);
    } finally {
      setBusy(false);
    }
  }

  const uploadForm = (
    <form
      key="upload"
      className={`${card} flex flex-col gap-4`}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div>
        <h2 className={eyebrow}>증거 제출</h2>
        <p className="mt-1 text-sm text-court-300">버릴까 고민되는 물건의 사진 1장을 올려 주세요.</p>
      </div>

      <label
        htmlFor={fileId}
        className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-court-500 bg-court-950/60 p-4 text-center transition hover:border-gold-400 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-300"
      >
        {preview ? (
          <>
            <img src={preview} alt="선택한 사진 미리보기" className="max-h-56 rounded-lg object-contain" />
            <span className="text-xs text-court-300">눌러서 다른 사진으로 바꾸기</span>
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="h-9 w-9 text-gold-400" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            <span className="font-semibold">사진 선택 또는 촬영</span>
            <span className="text-xs text-court-300">JPEG · PNG · WebP, 20MB 이하</span>
          </>
        )}
        <input
          id={fileId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>

      <div>
        <label htmlFor={reasonId} className="text-sm font-semibold">
          버리려는 이유 <span className="font-normal text-court-300">(선택)</span>
        </label>
        <input
          id={reasonId}
          type="text"
          value={reason}
          maxLength={REASON_MAX}
          onChange={(event) => setReason(event.target.value)}
          placeholder="예: 겉에 흠집이 많아서 버리려고요"
          className="mt-1 w-full rounded-xl border border-court-500 bg-court-950/60 px-4 py-3 text-base placeholder:text-court-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-discard/60 bg-discard/15 px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <button type="submit" className={btnPrimary} disabled={!file || busy}>
        {busy ? '사진 준비 중…' : '재판 시작'}
      </button>

      <p className="text-xs leading-relaxed text-court-300">
        사진과 버리는 이유는 분석과 캐릭터 생성을 위해 OpenAI로 전송됩니다. 얼굴·주소·문서가 찍힌 사진은 올리지 마세요.
        사진은 위치 정보를 떼고 보내며 저장하지 않습니다.
      </p>
    </form>
  );

  const sampleSection = (
    <section key="sample" className={card}>
      <h2 className={eyebrow}>샘플 재판</h2>
      <p className="mt-1 text-sm text-court-300">
        사진 없이 미리 준비한 재판을 끝까지 볼 수 있어요. AI를 호출하지 않는 데모 모드입니다.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {SAMPLE_KEYS.map((key) => (
          <button key={key} type="button" className="sample-defendant" onClick={() => onSample(key)}>
            <img src={SAMPLE_TRIALS[key].characterImage} alt="" className="sample-defendant__art" draggable={false} />
            <span className="sample-defendant__name">{SAMPLE_TRIALS[key].analysis.defendantName}</span>
            <span className="sample-defendant__hint">{SAMPLE_TRIALS[key].label}</span>
          </button>
        ))}
      </div>
    </section>
  );

  return <>{sampleFirst ? [sampleSection, uploadForm] : [uploadForm, sampleSection]}</>;
}
