// POST /api/character — 물건 의인화 이미지 (TRD §5.2)
import { Router } from 'express';
import OpenAI, { toFile } from 'openai';
import { ApiError, parseOrThrow } from '../lib/errors.js';
import { getOpenAI, models, rejectsParam, upstream } from '../lib/openai.js';
import { buildCharacterPrompt } from '../lib/prompts.js';
import { limiters } from '../lib/rateLimit.js';
import { CharacterFieldsSchema, type CharacterResponse } from '../lib/schema.js';
import { IMAGE_EXTENSION, requireImage, uploadImage } from '../lib/upload.js';

export const characterRouter = Router();

characterRouter.post('/', limiters.character, uploadImage, async (req, res) => {
  const image = requireImage(req);
  const { objectName, characterBrief } = parseOrThrow(CharacterFieldsSchema, req.body ?? {});
  const openai = getOpenAI();

  const edit = async (withComplexity: boolean) =>
    openai.images.edit(
      {
        model: models.image(),
        image: await toFile(image.buffer, `object.${IMAGE_EXTENSION[image.mime]}`, { type: image.mime }),
        prompt: buildCharacterPrompt(objectName, characterBrief),
        size: '1024x1024', // 문서: 정사각이 보통 가장 빠르다
        quality: 'medium', // 작은 얼굴과 무광 재질을 최종 화면에서도 또렷하게 유지한다
        ...(withComplexity ? { complexity: 'low' as const } : {}), // 생략하면 'high' 이고 지연이 늘 수 있다
        output_format: 'jpeg', // 문서: png 보다 빠르다
        output_compression: 80,
        n: 1,
      },
      upstream.character,
    );

  try {
    // 모델이 complexity 를 받지 않으면 빼고 한 번 더 부른다. 거절된 400 은 과금되지 않는다.
    const result = await edit(true).catch((err: unknown) => {
      if (!rejectsParam(err, 'complexity')) throw err;
      return edit(false);
    });

    const base64 = result.data?.[0]?.b64_json;
    if (!base64) {
      throw new ApiError(502, 'AI_UNAVAILABLE', '캐릭터를 만들지 못했어요. 기본 캐릭터로 계속 진행합니다.');
    }
    const body: CharacterResponse = { imageDataUrl: `data:image/jpeg;base64,${base64}` };
    res.json(body);
  } catch (err) {
    // 콘텐츠 정책 차단은 같은 입력으로 다시 시도하지 않는다. 클라이언트는 폴백 캐릭터로 진행한다.
    if (err instanceof OpenAI.APIError && err.code === 'moderation_blocked') {
      throw new ApiError(502, 'IMAGE_BLOCKED', '이 사진으로는 캐릭터를 만들 수 없어요. 기본 캐릭터로 계속 진행합니다.');
    }
    throw err;
  }
});
