import { Router, type RequestHandler } from "express";

export function createChatRouter(
  chatController: RequestHandler,
  chatRateLimit: RequestHandler,
): Router {
  const router = Router();
  router.post("/chat", chatRateLimit, chatController);
  return router;
}
