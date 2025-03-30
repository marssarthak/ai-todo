import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getStructuredCompletion,
  prioritizationSchema,
} from "@/services/AIService";
import { Task } from "@/types/task";
import { CoreMessage } from "ai";

// Define the expected request body structure
interface PrioritizeRequest {
  // We only need the data relevant for prioritization
  title: string;
  description?: string;
  deadline?: string | Date; // Accept string or Date from client
  currentPriority?: Task["priority"];
}

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    // 1. Authenticate User
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse Request Body
    const taskData = (await request.json()) as PrioritizeRequest;
    if (!taskData || !taskData.title) {
      return NextResponse.json(
        { error: "Missing required task data (title)" },
        { status: 400 }
      );
    }

    // 3. Construct Prompt for AI
    // System message explaining the goal
    const systemMessage = `You are an expert task prioritizer. Analyze the following task details and suggest a priority level (high, medium, low) based on importance, urgency (considering the deadline if provided), and content. Provide a brief reasoning for your choice. Today's date is ${new Date().toLocaleDateString()}.`;

    // User message with task details
    let userPrompt = `Task Title: ${taskData.title}\n`;
    if (taskData.description) {
      userPrompt += `Description: ${taskData.description}\n`;
    }
    if (taskData.deadline) {
      const deadlineDate = new Date(taskData.deadline);
      // Check if the date is valid before formatting
      if (!isNaN(deadlineDate.getTime())) {
        userPrompt += `Deadline: ${deadlineDate.toLocaleDateString()}\n`;
      } else {
        console.warn(
          "Received invalid date format for deadline:",
          taskData.deadline
        );
        // Optionally inform the AI the deadline format was unclear
        userPrompt += `Deadline: (Provided but unclear format: ${taskData.deadline})\n`;
      }
    }
    if (taskData.currentPriority) {
      userPrompt += `Current Priority (for context): ${taskData.currentPriority}\n`;
    }
    userPrompt += `\nSuggest a priority (high, medium, or low) and provide a brief reasoning.`;

    const messages: CoreMessage[] = [
      { role: "system", content: systemMessage },
      { role: "user", content: userPrompt },
    ];

    console.log("Sending prompt to AI for prioritization:", userPrompt);

    // 4. Call AI Service for Structured Output
    const result = await getStructuredCompletion({
      messages: messages, // Pass messages property
      schema: prioritizationSchema, // Use the Zod schema for validation
    });

    console.log("AI Prioritization Result:", result);

    // 5. Return the structured result
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/ai/prioritize:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error during prioritization";
    return NextResponse.json(
      { error: "AI Prioritization Failed", details: errorMessage },
      { status: 500 }
    );
  }
}
