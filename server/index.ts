// 로컬 실행 전용 진입점 (pnpm dev, pnpm start). Vercel 배포는 api/index.ts 가 app 을 직접 쓴다.
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import app from './app.js';

const isProd = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT) || 3000;

const server = http.createServer(app);

if (isProd) {
  // 빌드된 클라이언트와 /api/* 를 같은 포트로 제공한다
  const dist = path.resolve(process.cwd(), 'dist/client');
  app.use(express.static(dist, { index: false }));
  app.use((req, res, next) => {
    // 화면 경로만 index.html 로 돌린다. 없는 정적 파일(예: 준비 안 된 mp3)은 404 로 둔다.
    if (req.method !== 'GET' || path.extname(req.path)) {
      next();
      return;
    }
    res.sendFile(path.join(dist, 'index.html'));
  });
} else {
  // 개발: Vite 를 미들웨어로 붙여 화면과 API 를 한 포트로 제공한다
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true, ws: { server } },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

server.listen(port, '0.0.0.0', () => {
  console.log(`[object-court] http://localhost:${port} (${isProd ? 'production' : 'development'})`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[object-court] OPENAI_API_KEY 가 없습니다. AI 라우트는 AI_UNAVAILABLE 을 돌려주고 샘플 재판만 동작합니다.');
  }
});
