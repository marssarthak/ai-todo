import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// Allow responses up to 5 minutes
export const maxDuration = 59;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
  });

  return result.toDataStreamResponse({
    getErrorMessage: errorHandler,
  });
}

function errorHandler(error: unknown) {
  if (error == null) {
    return "unknown error";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}
