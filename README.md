# 사물 재판소: 최후의 변론 (Object Court)

> “AI는 변론합니다. 판결은 인간이 내립니다.”

버릴까 고민되는 물건의 사진을 올리면, 그 물건이 얼굴과 팔다리가 달린 피고인이 되어 법정에서 최후 변론을 한다. 사용자는 판사가 되어 **보관(무죄)** 또는 **폐기(유죄)** 를 직접 결정한다. 버리기 직전에 물건의 상태와 수리·재사용 가능성, 올바른 배출 방법을 한 번 더 생각하게 만드는 웹앱이다.

- **팀:** 사이다 | Y-AI 메이커톤 CASE 04
- **형태:** 모바일·데스크톱 대응 웹앱
- **마감:** 2026-11-15 17:10 KST (배포·리허설 포함). 여러 Claude 세션이 병렬로 작업한다.
- **문서:** [PRD.md](./PRD.md) (무엇을 만드는가) · [TRD.md](./TRD.md) (어떻게 만드는가)

## 한 번의 재판

1. **증거 제출** — 사진 1장과 버리는 이유 한 줄을 넣는다. 사진은 브라우저에서 축소한 뒤 보낸다.
2. **기소장 확인** — AI가 물건 종류, 사진에서 보이는 상태, 사진만으로 알 수 없는 점을 나눠서 보여 준다.
3. **피고인 소환** — 원래 물건의 색과 형태를 살린 의인화 캐릭터가 법정에 선다.
4. **최후 변론** — ‘변론 듣기’를 누르면 캐릭터 목소리(AI 생성 음성)로 2~4문장을 말한다. 자막은 항상 보인다.
5. **반대 심문** (P1) — 질문을 한 번 던지면 피고인이 답한다.
6. **판결** — 무죄 또는 유죄를 사람이 고른다. AI는 판결을 정하지 않는다.
7. **엔딩**
   - 무죄: 캐릭터가 원래 물건으로 돌아와 손에 안기고, 관리·수리 팁이 나온다.
   - 유죄: 원래 물건에 가상 망치 또는 쓰레기통 연출을 실행하고, 실제 배출 안내가 나온다.

화면의 파괴 연출은 가상 애니메이션이다. 실제 물건을 부수거나 태우라는 뜻이 아니다.

우선순위(P0·P1·P2)와 제외 범위는 [PRD §5](./PRD.md#5-mvp-범위-및-우선순위)에 있다.

## 기술 스택

| 계층 | 선택 |
|---|---|
| 프론트엔드 | React + TypeScript + Vite |
| 스타일·애니메이션 | Tailwind CSS 또는 CSS Modules, CSS keyframes + Web Animations API |
| 서버 | Node.js + Express + 공식 `openai` 패키지 |
| 검증 | zod |
| 호스팅 | Vercel (정적 화면 + `/api/*` 함수) |
| DB·로그인 | 없음 (세션 메모리만 사용) |

AI는 사진 분석, 변론 텍스트, 캐릭터 이미지, 변론 음성에만 쓴다. 전환·귀환·파괴 연출은 브라우저 애니메이션이다.

| 용도 | 기본 모델 | 환경변수 |
|---|---|---|
| 사진 분석 + 변론·심문 텍스트 | `gpt-5.6-luna` | `OPENAI_TEXT_MODEL` |
| 캐릭터 이미지 | `gpt-image-1-mini` | `OPENAI_IMAGE_MODEL` |
| 변론 음성 | `gpt-4o-mini-tts` | `OPENAI_TTS_MODEL` |

TRD가 처음 고른 `gpt-6.1-terra`, `gpt-image-2.5-flare`는 이 프로젝트의 API 키로 접근되지 않아(403), 2026-11-15에 위 모델로 바꾸고 실제 호출로 재판 1회를 확인했다.

모델 ID는 코드에 직접 쓰지 않고 환경변수에서 읽는다. `gpt-image-1`, `dall-e-3`, `tts-1` 같은 예전 ID는 종료됐거나 필요한 기능이 없으니 쓰지 않는다. 선정 근거와 가격은 [TRD §2.1](./TRD.md#21-모델-선정)에 있다.

## 실행

Node.js 20.19 이상과 pnpm이 필요하다.

```bash
pnpm install
cp .env.example .env    # OPENAI_API_KEY 를 채운다
pnpm dev                # http://localhost:3000
```

| 명령 | 하는 일 |
|---|---|
| `pnpm dev` | 개발 서버. Express가 `/api/*`와 Vite 개발 화면을 한 포트로 제공한다. 서버 코드를 고치면 다시 시작하고 화면은 바로 갱신된다 |
| `pnpm build` | 클라이언트를 `dist/client`로 빌드한다 |
| `pnpm start` | 빌드본을 로컬에서 실행한다. 빌드된 클라이언트와 `/api/*`를 한 포트로 제공한다. 먼저 `pnpm build`를 돌린다 |
| `pnpm typecheck` | 클라이언트와 서버의 타입을 검사한다 |

`OPENAI_API_KEY`가 없어도 서버는 뜬다. AI 라우트는 `AI_UNAVAILABLE` 오류를 돌려주고, 샘플 재판은 끝까지 진행된다. `GET /api/health`의 `aiConfigured`로 키 설정 여부를 볼 수 있다.

### Vercel 배포

화면은 `dist/client`의 정적 파일로, `/api/*`는 함수 하나(`api/index.ts`가 `server/app.ts`의 Express 앱을 내보냄)로 배포된다. 설정은 `vercel.json`에 있다.

1. Vercel에서 GitHub 저장소를 새 프로젝트로 연결한다. 빌드 설정은 `vercel.json`을 따르므로 손대지 않는다.
2. 프로젝트 환경변수에 `OPENAI_API_KEY`, `OPENAI_TEXT_MODEL=gpt-5.6-luna`, `OPENAI_IMAGE_MODEL=gpt-image-1-mini`, `OPENAI_TTS_MODEL=gpt-4o-mini-tts`, `OPENAI_TTS_VOICE=marin`을 넣는다.
3. 배포한다. 환경변수를 나중에 바꿨으면 다시 배포해야 반영된다.
4. 배포 주소의 `/api/health`에서 `aiConfigured: true`를 확인하고 `?demo=1` 샘플 재판을 끝까지 돌려 본다.

Vercel 함수는 요청 본문을 4.5MB까지만 받는다. 사진은 브라우저에서 줄여서 보내므로 보통 이보다 훨씬 작다. 함수 실행 시간 상한은 60초로 잡았다(서버의 OpenAI 호출 제한 시간은 50초 이내).

환경변수는 아래와 같다. 로컬에서는 `.env`에, Vercel에서는 프로젝트 환경변수에 넣는다.

```dotenv
OPENAI_API_KEY=                       # 서버 전용. 클라이언트 번들·저장소에 넣지 않는다
OPENAI_TEXT_MODEL=gpt-5.6-luna
OPENAI_IMAGE_MODEL=gpt-image-1-mini
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=marin
PORT=3000
```

`.env`는 커밋하지 않는다. `VITE_` 접두사가 붙은 변수는 클라이언트 번들에 들어가므로 API 키에 쓰지 않는다.

## API

| 라우트 | 하는 일 | 응답 |
|---|---|---|
| `POST /api/analyze` | 사진과 이유를 받아 분석·변론을 만든다 | `TrialAnalysis` JSON |
| `POST /api/character` | 사진을 의인화 캐릭터로 바꾼다 | `{ imageDataUrl }` |
| `POST /api/speech` | 변론 텍스트를 음성으로 합성한다 | `audio/mpeg` |
| `POST /api/cross-examine` (P1) | 질문 1회에 피고인이 답한다 | `{ answer, caution? }` |

분석이 끝나면 캐릭터 이미지와 변론 음성을 동시에 요청한다. 판결은 텍스트만 있어도 진행된다. 요청·응답 형식, 오류 코드, 타임아웃은 [TRD §5](./TRD.md#5-api-설계)에 있다.

## 실패해도 재판은 이어진다

| 실패 | 대신 쓰는 것 |
|---|---|
| 캐릭터 이미지 생성 실패·지연 | 원본을 가리지 않는 증거 사진 카드 |
| OpenAI 음성 실패·지연 | 브라우저 음성, 그것도 없으면 자막만 |
| 분석 API 실패·지연 | 재시도 또는 샘플 재판 |
| 심문 API 실패 | 추천 질문 3개의 정적 답변 |

**샘플 재판:** `?demo=1` 또는 홈의 ‘샘플 재판’ 버튼으로 물통(무죄)·이어폰(유죄)을 AI 호출 없이 끝까지 볼 수 있다. 화면에 데모 모드임을 표시한다. 전체 표는 [TRD §10](./TRD.md#10-실패대체-경로)에 있다.

샘플 캐릭터는 imagegen으로 제작한 투명 배경 PNG(`client/public/demo/*/character.png`)다. 생성 방식과 최종 프롬프트는 [character-prompts.json](./output/imagegen/character-prompts.json)에 기록했다.

## 폴더 구조

```text
object-court/
├─ client/          React SPA (컴포넌트, 훅, 애니메이션, 샘플 재판 자산)
├─ server/          Express API (라우트 4개, OpenAI 호출, zod 스키마, 프롬프트)
├─ .env.example
├─ PRD.md
├─ TRD.md
└─ README.md
```

파일 단위 구성은 [TRD §6](./TRD.md#6-파일-구성)에 있다.

## 마감과 작업 방식

- **17:10 KST** 까지 공개 URL에서 전체 흐름이 돌아야 한다.
- **16:25** — P1 작업을 멈추고 검증·배포로 넘어간다.
- **16:45** — 새 기능을 넣지 않는다. 배포본 시연과 오류 복구 점검만 한다.

작업 순서와 컷오프 규칙은 [TRD §11](./TRD.md#11-180분-작업-계획-및-우선순위), 배포 전 확인 항목은 [TRD §13](./TRD.md#13-배포운영-체크리스트)에 있다.

## 안전과 개인정보

- AI는 사진으로 알 수 없는 작동·위생·안전 상태를 단정하지 않는다. 불확실한 점은 불확실하다고 표시한다.
- 배터리·유리 같은 물건을 실제로 부수거나 태우라고 안내하지 않는다. 분리배출 안내는 일반 참고 정보이며 지역 규정은 따로 확인해야 한다.
- 사진과 버리는 이유는 분석·이미지 생성을 위해 OpenAI로 전송된다. 음성 합성에는 변론 텍스트만 보낸다. 얼굴·주소·문서가 찍힌 사진은 올리지 않도록 안내한다.
- 사진은 브라우저에서 다시 인코딩해 위치 등 촬영 메타데이터를 떼고 보낸다. 사용자 사진을 영구 저장하지 않는다.
- 들리는 목소리가 AI 생성 음성임을 화면에 표시한다.
