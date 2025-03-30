import { createServerClient, type CookieOptions } from "@supabase/ssr"; // Keep for type if needed
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Task } from "@/types/task";
import { createClient } from "@/lib/supabase/server"; // Use the corrected server client

// PUT handler - Update an existing task
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const taskId = params.id;

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    // Exclude fields that shouldn't be directly updated or are set automatically
    const { id, created_at, updated_at, user_id, ...updateData } = body;

    // Add server-side updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update the task, ensuring it belongs to the current user
    const { data: updatedTask, error: dbError } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", taskId)
      .eq("user_id", user.id) // Crucial security check
      .select()
      .single();

    if (dbError) {
      console.error("Supabase PUT error:", dbError);
      // Handle specific errors, e.g., not found (PGRST116 might indicate RLS failure or not found)
      if (dbError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Task not found or access denied" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (!updatedTask) {
      return NextResponse.json(
        { error: "Task not found after update" },
        { status: 404 }
      );
    }

    // Map back to frontend Task type
    const mappedTask: Task = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description ?? undefined,
      priority: updatedTask.priority as Task["priority"],
      status: updatedTask.status as Task["status"],
      createdAt: new Date(updatedTask.created_at),
      updatedAt: new Date(updatedTask.updated_at),
      deadline: updatedTask.deadline
        ? new Date(updatedTask.deadline)
        : undefined,
      userId: updatedTask.user_id,
    };

    return NextResponse.json(mappedTask);
  } catch (error) {
    console.error(`PUT /api/tasks/${taskId} error:`, error);
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

// DELETE handler - Delete a task
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const taskId = params.id;

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the task, ensuring it belongs to the current user
    const { error: dbError, count } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", user.id); // Crucial security check

    if (dbError) {
      console.error("Supabase DELETE error:", dbError);
      // Handle specific errors (e.g., RLS failure might result in error or count=0)
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (count === 0) {
      // RLS prevented deletion or task didn't exist for this user
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 }); // 204 No Content on successful deletion
  } catch (error) {
    console.error(`DELETE /api/tasks/${taskId} error:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
