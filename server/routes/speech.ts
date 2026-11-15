// POST /api/speech — 변론 음성 합성 (TRD §5.3)
import { Router } from 'express';
import { parseOrThrow, toApiError } from '../lib/errors.js';
import { limiters } from '../lib/rateLimit.js';
import { SpeechRequestSchema } from '../lib/schema.js';
import { synthesize } from '../lib/tts.js';

export const speechRouter = Router();

speechRouter.post('/', limiters.speech, async (req, res) => {
  const { text, voiceDirection } = parseOrThrow(SpeechRequestSchema, req.body);

  let audio: Buffer;
  try {
    audio = await synthesize(text, voiceDirection);
  } catch (err) {
    throw toApiError(err, 'TTS_UNAVAILABLE');
  }

  res.set({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' });
  res.send(audio);
});
