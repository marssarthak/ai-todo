// Import streaming helpers specifically for the OpenAI provider

import { openai } from "@ai-sdk/openai";
import { generateText, generateObject, CoreMessage } from "ai";
import { z } from "zod"; // Import Zod

const MODEL = "gpt-4o-mini";

/**
 * Gets a non-streaming text completion from OpenAI using Vercel AI SDK.
 */
export async function getSimpleCompletion(prompt: string): Promise<string> {
  "use server";

  try {
    const { text } = await generateText({
      model: openai(MODEL),
      prompt: prompt,
    });

    if (!text) {
      throw new Error("No text content received from OpenAI.");
    }
    return text.trim();
  } catch (error) {
    console.error("Error in getSimpleCompletion:", error);
    throw new Error(
      `OpenAI generateText failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Gets a structured object completion from OpenAI using Vercel AI SDK.
 * Requires a Zod schema to define the expected output structure.
 * Accepts either a single prompt string or an array of messages.
 */
export async function getStructuredCompletion<T>({
  prompt,
  messages,
  schema,
}: {
  prompt?: string; // Make prompt optional
  messages?: CoreMessage[]; // Make messages optional
  schema: z.ZodSchema<T>;
}): Promise<T> {
  if (!prompt && !messages) {
    throw new Error("Either prompt or messages must be provided.");
  }
  if (prompt && messages) {
    console.warn(
      "Both prompt and messages provided to getStructuredCompletion, using messages."
    );
  }

  try {
    // Call generateObject with EITHER prompt or messages
    const { object } = await generateObject({
      model: openai(MODEL),
      schema: schema,
      // Conditionally pass prompt or messages
      ...(messages ? { messages } : { prompt: prompt! }), // Use prompt! non-null assertion when messages is falsy
    });
    return object;
  } catch (error) {
    console.error("Error in getStructuredCompletion:", error);
    throw new Error(
      `OpenAI generateObject failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// --- Example Types (for future use) --- //

export interface PrioritizationResult {
  priority: "high" | "medium" | "low";
  reasoning: string;
}

// Example Zod schema for prioritization
export const prioritizationSchema = z.object({
  priority: z.enum(["high", "medium", "low"]),
  reasoning: z
    .string()
    .min(10)
    .describe("Brief explanation for the assigned priority."),
});

// Note: The streaming functionality is now handled directly in the
// `/api/chat` route using `streamText` as per the documentation provided.
// No separate streaming function needed here unless for a different use case.
