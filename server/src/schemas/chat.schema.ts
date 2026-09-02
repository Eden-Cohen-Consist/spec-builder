import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
}).strict();

export const chatRequestSchema = z.object({
  sessionId: z.string().min(1).max(128),
  seed: z.object({
    systemPrompt: z.string(),
    context: z.string(),
  }).strict().optional(),
  history: z.array(chatMessageSchema),
  turn: z.string().min(1),
}).strict();

export type ChatRequest = z.infer<typeof chatRequestSchema>;
