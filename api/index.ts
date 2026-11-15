// Vercel 함수 진입점. vercel.json 의 rewrites 가 /api/* 요청을 전부 여기로 보낸다.
import app from '../server/app.js';

export default app;
