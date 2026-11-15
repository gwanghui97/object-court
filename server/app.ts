// Express 앱 본체. listen 하지 않는다.
// 로컬에서는 server/index.ts 가, Vercel 에서는 api/index.ts 가 이 앱을 가져다 쓴다.
import './lib/env.js';
import express from 'express';
import { ApiError, errorHandler } from './lib/errors.js';
import { analyzeRouter } from './routes/analyze.js';
import { characterRouter } from './routes/character.js';
import { crossExamineRouter } from './routes/crossExamine.js';
import { speechRouter } from './routes/speech.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // 프록시 뒤에서 IP 기준 빈도 제한이 동작하게 한다
app.use(express.json({ limit: '32kb' }));

// 배포본을 깨울 때와 키 설정 여부를 볼 때 쓴다. 키 값은 돌려주지 않는다.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
});

app.use('/api/analyze', analyzeRouter);
app.use('/api/character', characterRouter);
app.use('/api/speech', speechRouter);
app.use('/api/cross-examine', crossExamineRouter);
app.use('/api', (_req, _res, next) => {
  next(new ApiError(404, 'NOT_FOUND', '없는 API 경로입니다.'));
});
app.use('/api', errorHandler);

export default app;
