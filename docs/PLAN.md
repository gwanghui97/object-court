# 구현 계획 — Vercel 배포, 마감 17:00 KST

16:13 개정. 마스터 세션(`y-ai-d2`)이 관리한다. 세션은 자기 줄만 읽고 바로 움직인다.

**16:11 변경:** 배포 대상이 Replit 에서 **Vercel** 로 바뀌었고 마감이 **17:00** 으로 당겨졌다. 17:00 에 공개 URL 에서 전체 재판이 돌아야 한다.

## 16:32 현황

- **운영 주소: https://object-court-trial.vercel.app** (커밋 `e8de05d`, `/api/health` → `aiConfigured:true`).
- `object-court-seven.vercel.app` 은 쓰지 않는다. 16:27 에 프로젝트에 `object-court.com` 이 추가되면서 그쪽으로 307 리다이렉트되고, 그 도메인은 DNS 가 없다. 고치려면 Vercel 대시보드 Settings → Domains 에서 `object-court.com` 을 지운다.
- 커밋: `49b1d2a`(앱·Vercel 구성), `413944c`(엔딩 그림 PNG), `e8de05d`(엔딩 그림 축소 사본).
- 배포본 검증: 서버·자산 16개 항목 통과(`y-ai-ee`), 샘플 재판 390px 통과(`y-ai-f8`). 배포본에서의 실제 OpenAI 호출, 실제 소리, 휴대폰 실기기는 미확인.
- `y-ai-c5` 는 16:31 에 종료됐다. 루트 설정·`vercel.json`·`api/`·`server/index.ts`·`server/app.ts` 는 `y-ai-ee`, 화면 파일과 `README.md` 는 `y-ai-f8` 이 맡는다.
- Codex 가 화면 파일·글꼴·샘플 그림을 고치는 중이고 전부 미커밋이다. 배포에 넣을지는 사용자 결정 대기.
- 공개 주소에는 실제 키가 실려 있다. 검증은 `?demo=1` 이거나 `/api` 를 가로챈 경우에만 한다.

아래는 16:13 에 쓴 계획이다. 주소와 소유 범위는 위 내용이 우선한다.

## 지금 상태 (16:13)

| 항목 | 상태 |
|---|---|
| `pnpm typecheck` | 통과 (마스터가 16:02 에 직접 실행, exit 0) |
| 샘플 재판 (`?demo=1`) | 키 없는 빌드본에서 390px 통과(`y-ai-c5`). 현재 코드 기준 독립 재검증은 `y-ai-f8` 진행 중 |
| 실제 API 완주 | 통과 1회 (16:09, `y-ai-c5`): analyze 8.8초, speech 4.2초, character 12.6초. 유죄 경로·반대 심문·실기기는 미확인 |
| 확정 모델 | 텍스트 `gpt-5.6-luna`, 이미지 `gpt-image-1-mini`, 음성 `gpt-4o-mini-tts` (`marin`). 이 키로는 `gpt-6.1-terra`·`gpt-image-2.5-flare` 접근 불가(403) |
| Vercel 적응 | 진행 중. 지금 구조(`pnpm start` 로 서버 상주)는 Vercel 에서 돌지 않는다 |
| 배포 | 안 함 |
| 커밋 | `d3a281c` 이후 전부 미커밋 |

## Vercel 구조

Vercel 은 서버를 띄워 두지 않고 요청마다 함수를 실행한다.

| 파일 | 역할 | 소유 |
|---|---|---|
| `server/app.ts` | Express app. `/api/health`, 라우터 4개, 404, 오류 처리. listen 없음 | `y-ai-c5` |
| `server/index.ts` | 로컬 전용. app 에 Vite 미들웨어(개발)·정적 제공(배포용)을 붙여 listen | `y-ai-c5` |
| `api/index.ts` | Vercel 함수 진입점. `export default app` | `y-ai-c5` |
| `vercel.json` | 빌드 `pnpm build`, 출력 `dist/client`, `/api/*` → 함수, 화면 경로 → `index.html`, 함수 최대 120초 | `y-ai-c5` |
| `server/lib/**`, `server/routes/**` | 상대 import 에 `.js` 확장자, 업로드 상한 4MB | `y-ai-ee` |

지켜야 하는 제한:

- 요청 본문 4.5MB 초과는 Vercel 이 413 으로 거절한다. 브라우저 축소 결과와 서버 상한을 4MB 로 맞춘다.
- 함수 실행 시간: 캐릭터 생성 시간 초과가 90초라 `maxDuration` 을 120초로 둔다.
- 환경변수는 Vercel 프로젝트 설정에 넣는다. `.env` 는 올라가지 않는다.
- 빈도 제한은 인스턴스별 메모리 저장이라 엄밀하지 않다. 시연에는 문제없다.

## 소유 범위

| 세션 | 파일 |
|---|---|
| `y-ai-c5` | `package.json`, `pnpm-lock.yaml`, `tsconfig*`, `vite.config.ts`, `vercel.json`, `api/**`, `README.md`, `server/index.ts`, `server/app.ts`, `client/index.html`, `client/src/{main.tsx,App.tsx,index.css}`, `lib/ui.ts`, `hooks/useTrial.ts`, `components/{EvidenceUpload,DefendantStage,DefenseSpeech,VerdictButtons,CrossExamination,SpeechPlayer}.tsx` |
| `y-ai-ee` | `server/lib/**`, `server/routes/**`, `.env.example`, `client/src/types/trial.ts`, `lib/{api,resizeImage}.ts`, `hooks/useSpeech.ts`, `data/sampleTrial.ts`, `client/public/demo/**` |
| `y-ai-f8` | `client/src/components/{KeepEnding,DiscardEnding,FallbackCharacter}.tsx`, `styles/animations.css`, `assets/**`, `PRD.md`, `TRD.md`, `.claude/**` |
| `y-ai-d2` | `docs/**`, 커밋·푸시, Vercel 프로젝트·배포 |
| Codex (사용자가 직접 운용) | 캐릭터 그림. 15:59~16:02 에 엔딩·화면·서버 프롬프트 파일을 고쳤다. 마스터가 지시할 수 없다 |

남의 파일에서 고칠 것을 찾으면 직접 고치지 않고 소유 세션에 줄 번호와 함께 보낸다. 수정 전에는 항상 파일을 다시 읽는다(Codex 가 바꿨을 수 있다).

## 공용 자원

- **포트:** `y-ai-c5` 3000, `y-ai-ee` 3011, `y-ai-f8` 3012. 3001·3002 는 Codex 가 실제 키로 띄운 서버라 요청을 보내지 않는다.
- **실제 키:** `.env` 가 있으므로 새로 띄우는 서버는 과금된다. 검증용 서버는 `OPENAI_API_KEY=` 를 앞에 붙여 띄우고 `/api/health` 의 `aiConfigured:false` 를 확인한다. 공개 URL 에도 실제 키가 실린다.
- **Playwright 브라우저:** 기본 사용자는 `y-ai-f8`. 업로드 흐름은 `**/api/**` 를 가로챈 상태로만 돌린다.
- **git:** 세션은 add·commit·stash·checkout·push 를 하지 않는다.
- **유료 호출:** 사용자가 그 세션에서 직접 승인한 것만 한다.

## 일정

### 16:13 ~ 16:25 — Vercel 적응

| 세션 | 할 일 |
|---|---|
| `y-ai-c5` | `server/app.ts` 분리, `api/index.ts`, `vercel.json`, 자기 파일의 `.js` 확장자, `.replit` 삭제, README 배포 절차를 Vercel 로. 검증: `pnpm typecheck`, `pnpm build`, 키 없는 `pnpm start` |
| `y-ai-ee` | `server/lib`·`server/routes` 상대 import 에 `.js`, 업로드 상한 4MB, `resizeImage` 가 4MB 미만을 보장하는지, `api.ts` 가 JSON 아닌 413·504 를 견디는지, 서버리스 점검. 가짜 OpenAI 로 라우트 4개 재확인 |
| `y-ai-f8` | 폴백 캐릭터 복원, 현재 코드 재검증(샘플 재판·가로채기 TC·물통 MP3·640px 그림), TRD·PRD·skill 의 모델과 배포 대상 수정 |
| `y-ai-d2` | Vercel 계정·프로젝트 확인, 환경변수 준비 |

### 16:25 ~ 16:35 — 커밋, 첫 배포

1. 마스터가 `pnpm typecheck`·`pnpm build` 를 직접 돌리고 diff 를 본다.
2. 커밋·푸시한다(사용자 요청 필요). `output/`, `.DS_Store`, `.playwright-mcp/`, `.env` 는 넣지 않는다.
3. Vercel 프로젝트를 GitHub 저장소 `gwanghui97/object-court` 에 연결해 배포한다.
4. 환경변수: `OPENAI_TEXT_MODEL`, `OPENAI_IMAGE_MODEL`, `OPENAI_TTS_MODEL`, `OPENAI_TTS_VOICE` 는 마스터가 넣는다. **`OPENAI_API_KEY` 는 사용자가 Vercel 대시보드에 직접 넣는다**(마스터는 `.env` 를 읽을 수 없다).

### 16:35 ~ 16:50 — 배포본 검증과 수정

| 누가 | 할 일 |
|---|---|
| `y-ai-ee` | 배포 점검 스크립트로 `/`, 샘플 SVG, `/api/health`(`aiConfigured:true`), 없는 API 404, 화면 경로 폴백 확인. 함수 로그에서 import 오류를 본다 |
| `y-ai-f8` | 공개 URL 에서 `?demo=1` 샘플 재판을 390px·1280px 로. 업로드 흐름은 `/api` 가로챈 상태로만 |
| `y-ai-c5` | 배포 오류 수정 대기. 고치면 마스터가 다시 커밋·푸시 |
| 사용자 | 휴대폰으로 공개 URL 에서 실제 사진 1장 재판(TC-13, TC-14). 소리가 나는지, 변론이 10초 남짓인지 확인 |

### 16:50 ~ 17:00 — 동결

새 변경 금지. 운영 배포 주소 확정, 무죄·유죄 각 1회 시연, 1분 리허설. 고칠 것이 남으면 고치지 않고 샘플 재판(`?demo=1`)으로 시연한다.

## 컷오프

- **16:25** Vercel 적응이 안 끝났으면 P1(반대 심문·음소거)을 화면에서 숨기고라도 배포 가능한 상태를 먼저 만든다.
- **16:40** 배포본에서 `/api` 가 안 돌면 원인을 10분 넘게 파지 않는다. 화면만 배포하고 샘플 재판으로 시연한다(샘플은 `/api` 없이 끝까지 돈다).
- **16:50** 이후 코드 수정 금지.

## 사용자가 해야 하는 것

| # | 할 일 | 시각 |
|---|---|---|
| 1 | 커밋·푸시 승인 | 16:25 |
| 2 | Vercel 대시보드에 `OPENAI_API_KEY` 입력 | 16:30 |
| 3 | 휴대폰 실기기 재판 1회 | 16:40 |
| 4 | Codex 가 `FallbackCharacter.tsx` 와 `server/`, `api/`, `vercel.json` 을 건드리지 않게 하기 | 지금 |

## 보고 규칙

- 단계가 끝나면 무엇을 어떻게 확인했는지와 함께 `y-ai-d2` 로 보고한다. 돌리지 못한 검증은 "미검증"이라고 적는다.
- 막히면 5분 넘게 붙잡지 않고 선택지와 추천안을 보낸다.
- 16:25, 16:40, 16:50 에는 진행 중이어도 상태를 한 줄 보낸다.
