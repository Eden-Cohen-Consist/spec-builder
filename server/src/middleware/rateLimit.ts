import { rateLimit } from "express-rate-limit";

export function createChatRateLimit(windowMs: number, limit: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Chat rate limit exceeded" },
  });
}
