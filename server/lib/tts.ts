// TTS 제공자 교체 지점 (TRD §2.2). 후속 모델로 옮길 때 이 파일만 바꾼다.
import { getOpenAI, models, upstream } from './openai.js';
import { buildVoiceInstructions } from './prompts.js';

export async function synthesize(text: string, voiceDirection?: string): Promise<Buffer> {
  const speech = await getOpenAI().audio.speech.create(
    {
      model: models.tts(),
      voice: models.voice(),
      input: text,
      instructions: buildVoiceInstructions(voiceDirection),
      response_format: 'mp3',
    },
    upstream.speech,
  );
  return Buffer.from(await speech.arrayBuffer());
}
