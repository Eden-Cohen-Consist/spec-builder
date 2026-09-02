import express, { type Express } from "express";
import type { RequestHandler } from "express";
import { createChatController } from "./controllers/chat.controller.js";
import { errorHandler } from "./middleware/error.js";
import { createChatRouter } from "./routes/chat.routes.js";
import type { ClaudeService } from "./services/claude.service.js";
import type { UsageService } from "./services/usage.service.js";

type AppDependencies = {
  claude: Pick<ClaudeService, "streamChat">;
  usage: Pick<UsageService, "logExchange">;
  chatRateLimit: RequestHandler;
};

export function createApp(dependencies: AppDependencies): Express {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.get("/api/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });
  app.use(
    "/api",
    createChatRouter(
      createChatController(dependencies),
      dependencies.chatRateLimit,
    ),
  );
  app.use(errorHandler);

  return app;
}
