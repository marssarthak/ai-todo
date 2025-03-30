import { Task } from "@/types/task";
import { CreateTaskData, UpdateTaskData } from "@/hooks/useTaskManager"; // Reuse types from hook

const API_BASE_URL = "/api/tasks";

// Helper to handle API responses and errors
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignore JSON parsing error if body is empty or not JSON
      errorData = { message: response.statusText };
    }
    const error = new Error(
      errorData?.error || `API request failed with status ${response.status}`
    );
    // You could add more properties to the error object if needed
    // error.status = response.status;
    throw error;
  }
  // Handle 204 No Content specifically for DELETE
  if (response.status === 204) {
    return {} as T; // Return an empty object or handle as needed
  }
  // For other successful responses, parse JSON
  try {
    return (await response.json()) as T;
  } catch (e) {
    // Handle cases where response is OK but body is empty/not JSON
    console.warn("Could not parse JSON response for status:", response.status);
    return {} as T;
  }
}

// Fetch all tasks for the current user
export async function getTasks(): Promise<Task[]> {
  const response = await fetch(API_BASE_URL);
  return handleResponse<Task[]>(response);
}

// Create a new task
export async function createTask(taskData: CreateTaskData): Promise<Task> {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(taskData),
  });
  return handleResponse<Task>(response);
}

// Update an existing task
export async function updateTask(
  id: string,
  taskData: UpdateTaskData
): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(taskData),
  });
  return handleResponse<Task>(response);
}

// Delete a task
export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });
  await handleResponse<{}>(response); // Expecting no content back, just check status
}
