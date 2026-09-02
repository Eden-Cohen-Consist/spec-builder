import Anthropic from "@anthropic-ai/sdk";
import { resolve } from "node:path";
import { createApp } from "./app.js";
import { loadEnv, serverRoot } from "./config/env.js";
import { createChatRateLimit } from "./middleware/rateLimit.js";
import { ClaudeService } from "./services/claude.service.js";
import { UsageService } from "./services/usage.service.js";

const env = loadEnv();
const app = createApp({
  claude: new ClaudeService(
    new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }),
    env.ANTHROPIC_MODEL,
    env.MAX_TOKENS,
  ),
  usage: new UsageService(resolve(serverRoot, env.USAGE_FILE)),
  chatRateLimit: createChatRateLimit(
    env.RATE_LIMIT_WINDOW_MS,
    env.RATE_LIMIT_MAX,
  ),
});

app.listen(env.PORT, () => {
  console.log(`Spec Builder server listening on http://localhost:${env.PORT}`);
});
