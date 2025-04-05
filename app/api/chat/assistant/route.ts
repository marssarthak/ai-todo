import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { type Task } from "@/types/task";

// Allow responses up to 1 minute
export const maxDuration = 60;

type Message = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
};

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Create supabase client
    const supabase = await createClient();

    // Get session
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    // Create context about the user tasks if logged in
    let userContext = "";
    if (userId) {
      // Get user's tasks
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("deadline", { ascending: true });

      if (!error && tasks?.length) {
        userContext = `
The user has the following tasks:
${tasks
  .map(
    (task: Task, i: number) => `
${i + 1}. Title: ${task.title}
   Priority: ${task.priority}
   Status: ${task.status}
   ${
     task.deadline
       ? `Deadline: ${new Date(task.deadline).toLocaleDateString()}`
       : "No deadline"
   }
   ${task.description ? `Description: ${task.description}` : ""}
`
  )
  .join("\n")}
`;
      }
    }
    // System message with context
    const systemMessage: Message = {
      role: "system",
      content: `You are a helpful AI assistant for a productivity app. You help users manage their tasks, provide productivity advice, and motivate them.
${userContext}

Your responses should be:
1. Friendly and encouraging, with a positive tone
2. Concise and to the point
3. Practical and actionable
4. Gamified - use motivational elements, challenges, and rewards in your language
5. Personalized to their tasks and needs when possible

You can help with:
- Task organization, prioritization, and management
- Time management techniques
- Productivity strategies
- Work-life balance
- Goal setting
- Motivation and focus techniques`,
    };

    // Add system message to the beginning if not already there
    const augmentedMessages =
      messages[0]?.role === "system" ? messages : [systemMessage, ...messages];

    // Stream the response
    const result = streamText({
      model: openai("gpt-4o"),
      messages: augmentedMessages,
      temperature: 0.7,
      maxTokens: 500,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in chat assistant route:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
