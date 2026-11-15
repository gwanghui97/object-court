// .env 를 읽는다. server/index.ts 가 다른 모듈보다 먼저 import 한다.
// Replit 에서는 Secrets 가 환경변수로 들어오므로 파일이 없어도 된다.
try {
  process.loadEnvFile();
} catch {
  // .env 없음: 이미 설정된 환경변수만 쓴다
}
