import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";

export const chatRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Chat rate limit exceeded" },
});
