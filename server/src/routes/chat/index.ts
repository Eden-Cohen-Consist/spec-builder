import { Router } from "express";
import { chatController } from "../../controllers/chatController.js";
import { chatRateLimit } from "../../middleware/rateLimit.js";

const router = Router();

router.post("/", chatRateLimit, chatController);

export default router;
