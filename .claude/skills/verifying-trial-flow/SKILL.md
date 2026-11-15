---
name: verifying-trial-flow
description: 사물 재판소에서 작업이 끝났다고 보고하려는 순간, 커밋·배포 직전, 화면·상태 머신·API 라우트를 바꾼 뒤, 또는 다른 작업자의 완료 보고를 받아들이기 전에 사용한다. "됐다", "완료", "통과", "동작한다"라고 쓰려 할 때 해당한다.
---

# 재판 흐름 검증

직접 돌려서 본 것만 통과다. 코드를 읽고 내린 판단은 통과가 아니다. 돌리지 못한 항목은 “확인 못 함”으로 적는다.

기대 동작의 기준은 `TRD.md` §12(테스트 케이스)와 `PRD.md` §10(데모 체크리스트)이다.

## 순서

### 1. 타입체크와 빌드

`package.json`의 `scripts`를 읽고 타입체크·빌드 명령을 찾아 실행한다. 패키지 매니저는 락파일을 따른다. 종료 코드와 오류 출력을 그대로 기록한다.

### 2. 금지 문자열 검색

아래 세 명령은 아무것도 출력하지 않아야 한다.

```bash
# 종료됐거나 쓰지 않기로 한 모델 ID
grep -rnE "['\"](gpt-image-1|dall-e-[23]|tts-1|tts-1-hd)['\"]" server client/src
# 클라이언트로 새는 비밀값, 저장소에 들어간 키
grep -rnE "VITE_[A-Z_]*(OPENAI|SECRET|KEY)|sk-[A-Za-z0-9_-]{20,}" server client --exclude-dir=node_modules --exclude-dir=dist
# AI 응답을 HTML로 넣는 코드
grep -rn "dangerouslySetInnerHTML" client/src
```

### 3. 돈이 들지 않는 흐름부터

개발 서버를 띄우고 브라우저로 연다. **390×844**와 **1280×800** 두 폭에서 각각 본다. 콘솔 오류도 확인한다.

샘플 재판(`?demo=1`)은 API를 부르지 않으므로 먼저 이것으로 본다.

| 확인 | 봐야 하는 것 |
|---|---|
| 샘플 물통 → 무죄 | 변론 자막이 전부 보임 → ‘변론 듣기’ → 무죄 → 캐릭터가 원래 물건으로 바뀌고 손으로 귀환 → 관리 팁 |
| 샘플 이어폰 → 유죄 → 망치 | 원래 물건으로 전환 → 망치 연출 → “가상 연출입니다. 실제로 물건을 부수거나 태우지 마세요.” → 배출 안내 |
| 샘플 이어폰 → 유죄 → 쓰레기통 | 버튼만으로 실행 가능 → 완료 카드 → 같은 고지와 배출 안내 |
| 표시 | 데모 모드 표시, ‘AI 생성 음성’ 표시, AI 추정 정보와 판결의 구분 |
| 판결 전 상태 | 무죄·유죄를 누르기 전에는 어떤 판결도 선택되어 있지 않음 |
| 처음부터 | 음성이 멈추고 홈으로 돌아가며 이전 재판의 내용이 남지 않음 |
| 네트워크 | 샘플 재판 동안 `/api/*` 요청이 0건 |
| 390px | 가로 스크롤 없음, 버튼이 손가락으로 누를 크기, 연출이 화면 밖으로 넘치지 않음 |

소리가 실제로 나는지는 헤드리스 브라우저로 알 수 없다. 오디오 요소가 재생 상태(`paused === false`, `currentTime` 증가)인지까지만 확인하고, 실기기 확인은 “사람 확인 필요”로 적는다.

### 4. 실제 흐름과 폴백 (응답 가로채기)

사진을 올리는 실제 흐름은 `/api/*` 응답을 가로채서 돈을 쓰지 않고 본다. 분석 응답은 `client/src/data/sampleTrial.ts`의 샘플 재판 `analysis` 값을 JSON으로 옮겨 쓴다.

```js
// Playwright: 분석은 성공, 캐릭터와 음성은 실패시키는 예
await page.route('**/api/analyze', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: analysisJson }));
await page.route('**/api/character', (route) =>
  route.fulfill({ status: 502, contentType: 'application/json',
    body: JSON.stringify({ error: { code: 'AI_UNAVAILABLE', message: 'test' } }) }));
await page.route('**/api/speech', (route) =>
  route.fulfill({ status: 502, contentType: 'application/json',
    body: JSON.stringify({ error: { code: 'TTS_UNAVAILABLE', message: 'test' } }) }));
```

| 가로챈 상황 | 봐야 하는 것 |
|---|---|
| `/api/character` 502 | 폴백 캐릭터(원본 사진 + 눈·팔·다리)로 재판이 이어지고 엔딩까지 감 |
| `/api/speech` 502 | 브라우저 음성으로 읽거나 “자막으로 진행합니다”. 판결 가능 |
| `/api/analyze` 429 또는 502 | 읽을 수 있는 오류 문구, 재시도, 샘플 재판으로 가는 길 |
| `/api/character` 응답을 판결 뒤로 늦춤 | 엔딩 도중 그림이 바뀌지 않음 |
| ‘다시 듣기’ | `/api/speech` 요청이 늘지 않음 |
| 20MB 초과 파일, 이미지가 아닌 파일 | `/api/analyze` 요청 없이 입력 화면에서 안내 |

### 5. 서버 단독 확인

키 없이도 볼 수 있는 것부터 본다.

```bash
# 파일 없이 호출 → 400과 { error: { code, message } }
curl -s -X POST localhost:3000/api/analyze -w '\n%{http_code}\n'
# 길이 초과 → 400 TEXT_TOO_LONG
curl -s -X POST localhost:3000/api/speech -H 'Content-Type: application/json' \
  -d "{\"text\":\"$(printf '가%.0s' {1..601})\"}" -w '\n%{http_code}\n'
```

### 6. 실제 OpenAI 호출

돈이 든다. 지시받았을 때만 한다. 사진 1장으로 재판 1회를 끝까지 돌리고, 모델별 호출 횟수와 각 단계가 걸린 시간을 적는다. 방법은 `.claude/skills/openai-api-calls/SKILL.md`의 “실제 호출로 확인하기”.

### 7. 정리

띄운 개발 서버와 브라우저를 끈다. 스크린샷과 내려받은 파일은 저장소 밖(`$TMPDIR`)에 두었는지 확인한다.

## 보고에 들어갈 것

1. 결론 한 줄: 통과 / 실패 N건 / 확인 못 함 N건
2. 항목별 결과와 근거(실행한 명령, 본 화면, 폭)
3. 실패마다 재현 순서, 본 것, 기대한 것, 의심 위치. 관찰과 추측을 구분한다.
4. 확인하지 못한 항목과 이유
5. 유료 호출 횟수(없으면 0)

## 흔한 실수

- 빌드가 통과했다고 화면까지 된다고 적는다.
- 데스크톱 폭만 본다.
- 샘플 재판만 보고 실패 경로를 보지 않는다. 이 프로젝트의 데모 안정성은 폴백에 달려 있다.
- 확인하려고 실제 이미지 생성을 여러 번 부른다.
- 스크린샷을 저장소 안에 남긴다.
