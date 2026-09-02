import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const finalSpecSchema = z.object({
  specification: z.string().min(1),
}).strict();

export type FinalSpec = z.infer<typeof finalSpecSchema>;

export const finalSpecTool: Anthropic.Tool = {
  name: "submit_final_spec",
  description:
    "Submit the complete final specification. Call this only when the specification is ready; never paste a final specification as ordinary text.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      specification: {
        type: "string",
        description: "The complete final specification in Markdown.",
      },
    },
    required: ["specification"],
    additionalProperties: false,
  },
};
