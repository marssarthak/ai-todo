import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
// Assume Database types are generated and available, adjust path if needed
// import type { Database } from '@/types/supabase'
import { Task } from "@/types/task"; // Use our frontend Task type
import { createClient } from "@/lib/supabase/server";

// GET handler - Fetch tasks for the current user
export async function GET(request: Request) {
  const supabase = await createClient();

  try {
    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch tasks for the user
    const { data: tasks, error: dbError } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("Supabase GET error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Map database results to frontend Task type (handle potential nulls/dates)
    const mappedTasks: Task[] = (tasks || []).map((dbTask) => ({
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description ?? undefined,
      priority: dbTask.priority as Task["priority"], // Ensure type casting is safe or validate
      status: dbTask.status as Task["status"], // Ensure type casting is safe or validate
      createdAt: new Date(dbTask.created_at),
      updatedAt: new Date(dbTask.updated_at),
      deadline: dbTask.deadline ? new Date(dbTask.deadline) : undefined,
      userId: dbTask.user_id,
    }));

    return NextResponse.json(mappedTasks);
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST handler - Create a new task
export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, priority, deadline } = body;

    // Basic validation (consider using Zod here for robustness)
    if (!title || !priority) {
      return NextResponse.json(
        { error: "Missing required fields: title and priority" },
        { status: 400 }
      );
    }

    // Prepare data for Supabase (status defaults to 'todo' in DB)
    const newTaskData = {
      user_id: user.id,
      title: title,
      description: description,
      priority: priority,
      deadline: deadline ? new Date(deadline).toISOString() : null, // Ensure correct format for DB
    };

    const { data: newTask, error: dbError } = await supabase
      .from("tasks")
      .insert(newTaskData)
      .select()
      .single(); // Get the newly created task back

    if (dbError) {
      console.error("Supabase POST error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (!newTask) {
      return NextResponse.json(
        { error: "Failed to create task." },
        { status: 500 }
      );
    }

    // Map the created task back to the frontend type
    const mappedTask: Task = {
      id: newTask.id,
      title: newTask.title,
      description: newTask.description ?? undefined,
      priority: newTask.priority as Task["priority"],
      status: newTask.status as Task["status"],
      createdAt: new Date(newTask.created_at),
      updatedAt: new Date(newTask.updated_at),
      deadline: newTask.deadline ? new Date(newTask.deadline) : undefined,
      userId: newTask.user_id,
    };

    return NextResponse.json(mappedTask, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    // Check if the error is due to JSON parsing
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request body format" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
