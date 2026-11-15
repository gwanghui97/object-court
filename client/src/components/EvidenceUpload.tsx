import { useEffect, useId, useState } from 'react';
import { SAMPLE_TRIALS, type SampleKey } from '../data/sampleTrial';
import { btnPrimary } from '../lib/ui';
import { UiIcon } from './UiIcon';

const REASON_MAX = 300;
const SAMPLE_KEYS = Object.keys(SAMPLE_TRIALS) as SampleKey[];

type Props = {
  onSubmit: (file: File, reason: string) => Promise<void>;
  onSample: (key: SampleKey) => void;
  error: string | null;
  sampleFirst: boolean;
};

export function EvidenceUpload({ onSubmit, onSample, error, sampleFirst }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileId = useId();
  const reasonId = useId();
  const privacyId = useId();

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
    <form key="upload" className="evidence-form paper-sheet" aria-labelledby={`${fileId}-title`} onSubmit={(event) => {
      event.preventDefault();
      void submit();
    }}>
      <div className="evidence-form__heading">
        <div><p className="eyebrow">사건 접수처</p><h2 id={`${fileId}-title`}>오늘의 피고인은 누구인가요?</h2></div>
        <UiIcon name="document" />
      </div>
      <label htmlFor={fileId} className={`evidence-envelope${dragging ? ' is-dragging' : ''}${preview ? ' has-photo' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); const dropped = event.dataTransfer.files[0]; if (dropped && !busy) setFile(dropped); }}>
        <span className="evidence-envelope__number">증 제 001호</span>
        {preview ? (
          <><img src={preview} alt="선택한 증거 사진" /><span className="evidence-envelope__change">사진 변경하기 <UiIcon name="restart" /></span></>
        ) : (
          <><span className="evidence-envelope__icon"><UiIcon name="camera" /></span><strong>증거 사진 제출</strong><span className="evidence-envelope__hint">사진을 끌어 놓거나 눌러서 선택하세요</span><span className="evidence-envelope__formats">JPG · PNG · WebP / 최대 20MB</span></>
        )}
        <input id={fileId} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      </label>
      <div className="evidence-form__reason">
        <label htmlFor={reasonId}>왜 버리려고 하나요? <span>선택 사항</span></label>
        <input id={reasonId} type="text" value={reason} maxLength={REASON_MAX} disabled={busy}
          onChange={(event) => setReason(event.target.value)} placeholder="오래됐고, 뚜껑이 헐거워요" />
      </div>
      {error && <p role="alert" className="court-error">{error}</p>}
      <button type="submit" className={`${btnPrimary} evidence-form__submit`} disabled={!file || busy} aria-describedby={privacyId}>
        <UiIcon name="scales" />{busy ? '증거 사진 준비 중…' : '피고인 소환하기'}<UiIcon name="arrow" />
      </button>
      <p className="evidence-form__caution">사진만으로 내부 고장 여부를 확정할 수 없습니다.</p>
      <details className="evidence-privacy" id={privacyId}>
        <summary>사진은 어떻게 처리되나요? <UiIcon name="chevron" /></summary>
        <p>사진과 이유는 AI 분석·캐릭터 생성을 위해 OpenAI로 전송됩니다. 얼굴·주소·문서가 담긴 사진은 피해주세요. 위치 정보를 제거해 전송하며, 앱은 사진을 영구 저장하지 않습니다.</p>
      </details>
    </form>
  );

  const samples = (
    <section key="sample" className="sample-cases" aria-labelledby={`${fileId}-samples`}>
      <div className="sample-cases__heading"><h2 id={`${fileId}-samples`}>사진이 없으신가요?</h2><span>샘플 재판으로 먼저 만나보세요</span></div>
      <div className="sample-cases__list">
        {SAMPLE_KEYS.map((key) => (
          <button key={key} type="button" className="sample-defendant" onClick={() => onSample(key)}>
            <img src={SAMPLE_TRIALS[key].characterImage} alt="" draggable={false} />
            <span><strong>{SAMPLE_TRIALS[key].analysis.defendantName}</strong><small>{key === 'bottle' ? '흠집은 있지만, 아직 쓸 만해요' : '한쪽이 조용해진 사연'}</small></span>
            <UiIcon name="arrow" />
          </button>
        ))}
      </div>
      <p className="sample-cases__note">미리 준비된 이야기로 진행하는 데모입니다.</p>
    </section>
  );

  return <div className="evidence-layout">{sampleFirst ? [samples, uploadForm] : [uploadForm, samples]}</div>;
}
