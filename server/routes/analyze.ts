// POST /api/analyze — 물건 분석 및 변론 (TRD §5.1)
import { Router } from 'express';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { ApiError, parseOrThrow } from '../lib/errors.js';
import { getOpenAI, models, rejectsParam, upstream } from '../lib/openai.js';
import { ANALYZE_SYSTEM_PROMPT, buildAnalyzeUserText } from '../lib/prompts.js';
import { limiters } from '../lib/rateLimit.js';
import { AnalyzeFieldsSchema, fitAnalysis, TrialAnalysisSchema, TrialAnalysisWireSchema } from '../lib/schema.js';
import { requireImage, uploadImage } from '../lib/upload.js';

export const analyzeRouter = Router();

analyzeRouter.post('/', limiters.analyze, uploadImage, async (req, res) => {
  const image = requireImage(req);
  const { reason } = parseOrThrow(AnalyzeFieldsSchema, req.body ?? {});
  const openai = getOpenAI();
  const imageUrl = `data:${image.mime};base64,${image.buffer.toString('base64')}`;

  const ask = (withReasoning: boolean) =>
    openai.responses.parse(
      {
        model: models.text(),
        ...(withReasoning ? { reasoning: { effort: 'low' as const } } : {}),
        store: false, // 사용자 사진을 OpenAI 쪽 응답 기록에 남기지 않는다
        instructions: ANALYZE_SYSTEM_PROMPT,
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: buildAnalyzeUserText(reason) },
              { type: 'input_image', image_url: imageUrl, detail: 'auto' },
            ],
          },
        ],
        text: { format: zodTextFormat(TrialAnalysisWireSchema, 'trial_analysis') },
      },
      upstream.analyze,
    );
  // 모델이 reasoning 을 받지 않는 것을 알게 되면 이 요청의 남은 시도에서는 처음부터 뺀다
  let useReasoning = true;

  // 거절·불완전 응답이거나 필수 값이 비어 있으면 한 번 더 요청한다 (TRD §10)
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let parsed: unknown;
    try {
      const response = await ask(useReasoning).catch((err: unknown) => {
        // 거절된 400 은 과금되지 않는다. 그 파라미터를 빼고 한 번만 다시 부른다.
        if (!useReasoning || !rejectsParam(err, 'reasoning')) throw err;
        useReasoning = false;
        return ask(false);
      });
      parsed = response.output_parsed;
    } catch (err) {
      // 업스트림 오류는 그대로 올린다. SDK 가 응답 본문을 읽지 못한 경우만 다시 시도한다.
      if (err instanceof OpenAI.APIError || err instanceof ApiError) throw err;
      continue;
    }

    // 길이를 넘긴 값은 거절하지 않고 잘라서 쓴다. 다시 부르면 과금도 두 번이다.
    const wire = TrialAnalysisWireSchema.safeParse(parsed);
    if (!wire.success) continue;
    const analysis = TrialAnalysisSchema.safeParse(fitAnalysis(wire.data));
    if (analysis.success) {
      res.json(analysis.data);
      return;
    }
  }

  throw new ApiError(502, 'AI_UNAVAILABLE', 'AI가 이 사진을 분석하지 못했어요. 다시 시도하거나 샘플 재판으로 계속할 수 있습니다.');
});
