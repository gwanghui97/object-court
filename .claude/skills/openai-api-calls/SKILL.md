---
name: openai-api-calls
description: 사물 재판소에서 OpenAI를 호출하는 서버 코드를 쓰거나 고칠 때, 모델 ID·목소리·이미지 옵션을 고를 때, model_not_found·403·moderation_blocked 같은 OpenAI 오류를 만났을 때 사용한다. TTS(audio.speech), 캐릭터 이미지(images.edit), 사진 분석(Responses API)을 다루는 모든 작업에 해당한다.
---

# OpenAI 호출 규칙

기억하고 있는 OpenAI 모델 ID는 낡았다. 아래 표는 2026-11-15에 이 프로젝트의 키로 실제 호출해 확인한 값이고, 이 프로젝트는 이 표와 환경변수만 쓴다. 요청·응답 형식의 기준은 `TRD.md` §5다.

## 모델

| 용도 | 환경변수 | 기본값 | SDK 호출 |
|---|---|---|---|
| 사진 분석, 변론·심문 텍스트 | `OPENAI_TEXT_MODEL` | `gpt-5.6-luna` | `openai.responses.parse` |
| 캐릭터 이미지 | `OPENAI_IMAGE_MODEL` | `gpt-image-1-mini` | `openai.images.edit` |
| 변론 음성 | `OPENAI_TTS_MODEL` | `gpt-4o-mini-tts` | `openai.audio.speech.create` |
| 목소리 | `OPENAI_TTS_VOICE` | `marin` | 위 호출의 `voice` |

모델 ID는 `process.env`에서 읽고, 기본값 문자열은 이 표와 같게 둔다. 기본값의 단일 정의는 `server/lib/openai.ts`다.

## 쓰지 않는 ID

| ID | 이유 |
|---|---|
| `gpt-6.1-terra`, `gpt-image-2.5-flare` | 공식 문서에는 있으나 이 키로는 `403 model_not_found` (2026-11-15 실제 호출) |
| `gpt-image-1` | 2026-10-23 종료. 호출이 실패한다. `gpt-image-1-mini`는 다른 모델이고 이 프로젝트가 쓰는 모델이다 |
| `dall-e-2`, `dall-e-3` | 2026-05-12 종료 |
| `tts-1`, `tts-1-hd` | `instructions`를 지원하지 않아 캐릭터 연기가 안 된다 |
| `gpt-realtime-*` | `/v1/audio/speech`에서 지원하지 않는다 |

표에 없는 모델 ID가 필요하면 기억으로 쓰지 않는다. `TRD.md` §15의 공식 문서를 확인하고, 문서에 있어도 이 키로 호출되는지 1회 확인한 뒤에 쓴다.

## 호출 형태

```ts
import OpenAI, { toFile } from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';

// 1) 분석: 사진 + 이유 → 스키마가 고정된 JSON
const response = await openai.responses.parse({
  model: process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.6-luna',
  reasoning: { effort: 'low' },                 // 모델이 거절하면 빼고 한 번 더 부른다
  instructions: ANALYZE_SYSTEM_PROMPT,
  input: [{
    role: 'user',
    content: [
      { type: 'input_text', text: `버리려는 이유: ${reason || '(입력 없음)'}` },
      { type: 'input_image', image_url: `data:${mime};base64,${base64}`, detail: 'auto' },
    ],
  }],
  text: { format: zodTextFormat(TrialAnalysisSchema, 'trial_analysis') },
});
const analysis = response.output_parsed;        // null이면 거절·불완전 응답

// 2) 캐릭터: 원본 사진을 입력 이미지로 넘긴다
const result = await openai.images.edit({
  model: process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1-mini',
  image: await toFile(file.buffer, 'object.jpg', { type: file.mimetype }),
  prompt,
  size: '1024x1024',
  quality: 'medium',                            // 작은 얼굴이 또렷하게 나오도록 'low'에서 올렸다
  complexity: 'low',                            // 모델이 거절하면 빼고 한 번 더 부른다
  output_format: 'jpeg',
  output_compression: 80,
  n: 1,
});
const imageDataUrl = `data:image/jpeg;base64,${result.data[0].b64_json}`; // URL은 오지 않는다

// 3) 음성: 변론 텍스트 + 연기 지시 → MP3
const speech = await openai.audio.speech.create({
  model: process.env.OPENAI_TTS_MODEL ?? 'gpt-4o-mini-tts',
  voice: process.env.OPENAI_TTS_VOICE ?? 'marin',
  input: text,                                  // 서버에서 600자로 제한
  instructions: buildVoiceInstructions(voiceDirection),
  response_format: 'mp3',
});
const audio = Buffer.from(await speech.arrayBuffer());
```

설치된 `openai` 패키지의 타입에 필드(`complexity` 등)가 없으면 패키지 버전이 낮은 것이다. `any`로 덮지 말고 버전을 올려야 한다고 보고한다.

모델마다 받는 옵션이 다르다. 옵션 하나 때문에 400이 오면 그 옵션만 빼고 한 번 더 부르는 방식은 `server/routes/character.ts`와 `analyze.ts`에 이미 들어 있다. 같은 방식을 따른다.

## 규칙

- **키:** `OPENAI_API_KEY`는 서버에서만 읽는다. `VITE_` 변수, 클라이언트 코드, 응답 본문, 로그에 넣지 않는다. `.env`를 읽거나 출력하지 않는다.
- **구조화 출력:** zod 스키마의 모든 필드를 필수로 둔다. 선택 필드를 만들지 않는다. 글자 수 제한은 프롬프트에 적고 응답을 받은 뒤 zod로 다시 확인한다.
- **이미지 비용:** 재판당 자동 호출 1회. 클라이언트 생성 시 `maxRetries: 0`. 실패하면 다시 부르지 않고 오류를 돌려준다.
- **음성 비용:** 재판당 변론 1회(심문 답변 1회는 P1). 같은 텍스트를 다시 합성하지 않는다. 다시 듣기는 클라이언트가 받아 둔 오디오를 쓴다.
- **음성 설정:** 말 빠르기와 감정은 `instructions`로 지시한다. `speed` 파라미터를 쓰지 않는다. `instructions` 템플릿은 `TRD.md` §5.3.
- **목소리:** 내장 13종(`alloy`, `ash`, `ballad`, `coral`, `echo`, `fable`, `nova`, `onyx`, `sage`, `shimmer`, `verse`, `marin`, `cedar`) 중에서만 고른다.
- **타임아웃:** 분석 30초, 이미지 90초, 음성 20초, 심문 20초(`TRD.md` §5.6).

## 오류 대응

| OpenAI에서 온 것 | 서버 응답 | 그다음 |
|---|---|---|
| 401, 403, `model_not_found` (권한·조직 인증) | 502 `AI_UNAVAILABLE` | 원인을 오래 파지 않는다. 사실을 보고하고 폴백으로 간다 |
| 이미지 `moderation_blocked` | 502 `IMAGE_BLOCKED` | 같은 입력으로 다시 부르지 않는다 |
| 429 | 429 `RATE_LIMITED` | 클라이언트가 재시도 버튼을 보여 준다 |
| 시간 초과 | 504 `AI_TIMEOUT` | 폴백 |
| 음성 합성 실패 | 502 `TTS_UNAVAILABLE` | 클라이언트가 브라우저 음성 → 자막으로 내려간다 |
| `output_parsed`가 `null` | 재시도 1회, 그래도 없으면 502 `AI_UNAVAILABLE` | 샘플 재판 안내 |

## 실제 호출로 확인하기

돈이 드는 호출이다. 지시받았을 때만 하고 횟수를 보고한다. 개발 서버를 띄운 상태에서 한다.

```bash
curl -s -X POST localhost:3000/api/speech \
  -H 'Content-Type: application/json' \
  -d '{"text":"판사님, 저는 억울합니다!","voiceDirection":"간절하고 조금 빠르게"}' \
  -o "$TMPDIR/defense.mp3" -w '%{http_code} %{content_type} %{size_download}\n'
```

`200 audio/mpeg`와 0보다 큰 크기가 나와야 한다. 결과 파일은 저장소 밖에 둔다.

## 흔한 실수

- 예전 예제를 따라 `gpt-image-1`이나 `tts-1`을 넣는다.
- 이미지 응답에서 `data[0].url`을 읽는다. GPT 이미지 모델은 `b64_json`만 준다.
- TTS 응답을 JSON으로 파싱한다. 본문은 오디오 바이너리다.
- 이미지 호출에 SDK 기본 재시도를 그대로 둔다. 실패 한 번이 여러 번의 과금이 된다.
- 권한 오류를 고치느라 시간을 쓴다. 폴백이 이미 설계되어 있다.
