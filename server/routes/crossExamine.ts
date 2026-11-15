// POST /api/cross-examine — 피고인 반대 심문, P1 (TRD §5.4)
import { Router } from 'express';
import { zodTextFormat } from 'openai/helpers/zod';
import { ApiError, parseOrThrow } from '../lib/errors.js';
import { getOpenAI, models, rejectsParam, upstream } from '../lib/openai.js';
import { CROSS_EXAMINE_SYSTEM_PROMPT, buildCrossExamineInput } from '../lib/prompts.js';
import { limiters } from '../lib/rateLimit.js';
import { clampText, CrossExamineRequestSchema, CrossExamineWireSchema, LIMITS, type CrossExamineResponse } from '../lib/schema.js';

export const crossExamineRouter = Router();

crossExamineRouter.post('/', limiters.crossExamine, async (req, res) => {
  const { analysis, question } = parseOrThrow(CrossExamineRequestSchema, req.body);

  const openai = getOpenAI();
  const ask = (withReasoning: boolean) =>
    openai.responses.parse(
      {
        model: models.text(),
        ...(withReasoning ? { reasoning: { effort: 'low' as const } } : {}),
        store: false,
        instructions: CROSS_EXAMINE_SYSTEM_PROMPT,
        input: buildCrossExamineInput(analysis, question),
        text: { format: zodTextFormat(CrossExamineWireSchema, 'cross_examine_answer') },
      },
      upstream.crossExamine,
    );
  // 모델이 reasoning 을 받지 않으면 빼고 한 번 더 부른다. 거절된 400 은 과금되지 않는다.
  const response = await ask(true).catch((err: unknown) => {
    if (!rejectsParam(err, 'reasoning')) throw err;
    return ask(false);
  });

  const parsed = CrossExamineWireSchema.safeParse(response.output_parsed);
  // 답변은 화면과 음성 합성에 함께 쓰인다. 길면 문장 끝에서 자른다.
  const answer = parsed.success ? clampText(parsed.data.answer, LIMITS.answer) : '';
  if (!parsed.success || !answer) {
    throw new ApiError(502, 'AI_UNAVAILABLE', '피고인이 답을 준비하지 못했어요. 추천 질문으로 계속할 수 있습니다.');
  }

  const caution = clampText(parsed.data.caution, LIMITS.answer);
  const body: CrossExamineResponse = caution ? { answer, caution } : { answer };
  res.json(body);
});
