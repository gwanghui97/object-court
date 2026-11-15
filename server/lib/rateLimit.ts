import { rateLimit } from 'express-rate-limit';
import { ApiError } from './errors.js';

function perMinute(limit: number) {
  return rateLimit({
    windowMs: 60_000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new ApiError(429, 'RATE_LIMITED', '요청이 많아요. 잠시 뒤 다시 시도해 주세요.'));
    },
  });
}

// IP당 분당 횟수 (TRD §9). 행사장에서는 심사위원 여럿이 같은 공유기 IP 로 들어오므로 넉넉하게 둔다.
export const limiters = {
  analyze: perMinute(20),
  character: perMinute(12),
  speech: perMinute(40),
  crossExamine: perMinute(20),
};
