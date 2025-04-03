import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getSimpleCompletion, // We'll use simple text completion for insights for now
} from "@/services/AIService";
import { getCompletionAnalytics } from "@/services/AnalyticsService";
import { CoreMessage } from "ai";

export async function GET(request: Request) {
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

    // 2. Get Analytics Data
    const analyticsData = await getCompletionAnalytics();

    if (!analyticsData) {
      // This might happen if the user has zero completed tasks or an error occurred fetching
      return NextResponse.json({
        insights:
          "Not enough data to generate insights yet. Complete some tasks!",
      });
    }

    // 3. Construct Prompt for AI based on analytics
    const systemMessage = `You are a helpful productivity assistant. Analyze the provided task completion data and generate 2-3 brief, actionable insights or suggestions for the user to improve their productivity or consistency. Focus on positive framing and encouragement. Today is ${new Date().toLocaleDateString()}.`;

    let dataSummary = `User's Task Completion Summary:\n`;
    dataSummary += `- Tasks completed in the last 7 days: ${analyticsData.completedLast7Days}\n`;
    dataSummary += `- Tasks completed so far this week: ${analyticsData.completedThisWeek}\n`;
    if (analyticsData.averageCompletionTimeDays !== undefined) {
      dataSummary += `- Average time to complete a task: ${analyticsData.averageCompletionTimeDays} days\n`;
    }
    dataSummary += `- Total tasks completed (in tracked period): ${analyticsData.totalCompleted}\n`;
    // Add more data points as available/relevant

    const userPrompt = `${dataSummary}\nProvide 2-3 concise productivity insights or suggestions based *only* on this data.`;

    // const messages: CoreMessage[] = [
    //     { role: 'system', content: systemMessage },
    //     { role: 'user', content: userPrompt }
    // ]
    const fullPrompt = `${systemMessage}\n\n${userPrompt}`; // Combine for simple completion

    // 4. Call AI Service for Text Completion
    // Using simple completion for now, but could use generateObject if a specific structure is needed
    const insights = await getSimpleCompletion(fullPrompt);

    // 5. Return the insights
    return NextResponse.json({ insights: insights.trim() });
  } catch (error) {
    console.error("Error in /api/ai/insights:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error generating insights";
    return NextResponse.json(
      { error: "AI Insights Generation Failed", details: errorMessage },
      { status: 500 }
    );
  }
}
