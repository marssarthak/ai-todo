import { NextResponse } from "next/server";
import { getSimpleCompletion } from "@/services/AIService";

// Simple GET endpoint to test basic AI connection
export async function GET(request: Request) {
  // IMPORTANT: Add authentication/authorization checks here in a real app
  // to prevent unauthorized use of your OpenAI credits.
  // For now, this is an unprotected test endpoint.

  const testPrompt = "Write a one-sentence motivational quote.";

  try {
    console.log("Testing AI simple completion...");
    const completion = await getSimpleCompletion(testPrompt);
    console.log("AI Test Completion Received:", completion);
    return NextResponse.json({ prompt: testPrompt, completion: completion });
  } catch (error) {
    console.error("Error in /api/ai/test:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error during AI test";
    return NextResponse.json(
      { error: "AI Service Test Failed", details: errorMessage },
      { status: 500 }
    );
  }
}

// Optional: You could add a POST handler to test with a dynamic prompt
// export async function POST(request: Request) {
//     try {
//         const { prompt } = await request.json();
//         if (!prompt) {
//             return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
//         }
//         const completion = await getSimpleCompletion(prompt);
//         return NextResponse.json({ prompt: prompt, completion: completion });
//     } catch (error) {
//         // ... error handling ...
//     }
// }
