import { renderHook, act } from "@testing-library/react";
import {
  useTaskManager,
  CreateTaskData,
  UpdateTaskData,
} from "./useTaskManager";
import { Task } from "@/types/task";
import { loadData, saveData, clearData } from "@/lib/storage"; // Import storage utils

// --- Mock localStorage --- (Common pattern for Jest)
let store: Record<string, string> = {};
const localStorageMock = (() => {
  return {
    getItem(key: string): string | null {
      return store[key] || null;
    },
    setItem(key: string, value: string): void {
      store[key] = value.toString();
    },
    removeItem(key: string): void {
      delete store[key];
    },
    clear(): void {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});
// --- End Mock localStorage ---

const TASKS_STORAGE_KEY = "ai_productivity_tasks";

describe("useTaskManager Hook with localStorage", () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorageMock.clear();
    // Ensure mocks for storage functions use the mocked localStorage
    jest.clearAllMocks(); // Clear any previous mocks if needed
  });

  it("should initialize with empty tasks if localStorage is empty", () => {
    const { result } = renderHook(() => useTaskManager());
    expect(result.current.tasks).toEqual([]);
    expect(localStorageMock.getItem(TASKS_STORAGE_KEY)).toBeNull();
  });

  it("should load tasks from localStorage on initial render", () => {
    // Arrange: Pre-populate localStorage
    const initialStoredTasks: Task[] = [
      {
        id: "1",
        title: "Stored Task 1",
        priority: "high",
        status: "todo",
        createdAt: new Date("2023-01-01T10:00:00.000Z"),
        updatedAt: new Date("2023-01-01T10:00:00.000Z"),
      },
    ];
    // Use the actual saveData function which will use the mock localStorage
    saveData(TASKS_STORAGE_KEY, initialStoredTasks);

    // Act: Render the hook
    const { result } = renderHook(() => useTaskManager());

    // Assert
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].id).toBe("1");
    expect(result.current.tasks[0].title).toBe("Stored Task 1");
    // Verify date deserialization
    expect(result.current.tasks[0].createdAt).toEqual(
      new Date("2023-01-01T10:00:00.000Z")
    );
  });

  it("should save tasks to localStorage when a task is added", () => {
    const { result } = renderHook(() => useTaskManager());
    const newTaskData: CreateTaskData = {
      title: "Save Me",
      priority: "medium",
    };

    act(() => {
      result.current.addTask(newTaskData);
    });

    // Assert: Check hook state and localStorage
    expect(result.current.tasks).toHaveLength(1);
    const storedData = loadData<Task[]>(TASKS_STORAGE_KEY);
    expect(storedData).not.toBeNull();
    expect(storedData).toHaveLength(1);
    expect(storedData![0].title).toBe("Save Me");
    expect(storedData![0].createdAt).toBeInstanceOf(Date); // Check date type after loading
  });

  it("should save tasks to localStorage when a task is deleted", () => {
    // Arrange: Start with one task (loaded or added)
    const { result } = renderHook(() => useTaskManager());
    let addedTask: Task | undefined;
    act(() => {
      addedTask = result.current.addTask({
        title: "Delete and Save",
        priority: "low",
      });
    });
    expect(result.current.tasks).toHaveLength(1);
    expect(loadData<Task[]>(TASKS_STORAGE_KEY)).toHaveLength(1);

    // Act: Delete the task
    act(() => {
      if (addedTask) {
        result.current.deleteTask(addedTask.id);
      }
    });

    // Assert: Check hook state and localStorage
    expect(result.current.tasks).toHaveLength(0);
    const storedData = loadData<Task[]>(TASKS_STORAGE_KEY);
    expect(storedData).toEqual([]); // Should be an empty array
  });

  it("should save tasks to localStorage when a task is edited", () => {
    const { result } = renderHook(() => useTaskManager());
    let addedTask: Task | undefined;
    act(() => {
      addedTask = result.current.addTask({
        title: "Edit and Save",
        priority: "low",
      });
    });
    const taskId = addedTask!.id;

    act(() => {
      result.current.editTask(taskId, { title: "Edited Title" });
    });

    expect(result.current.tasks[0].title).toBe("Edited Title");
    const storedData = loadData<Task[]>(TASKS_STORAGE_KEY);
    expect(storedData).toHaveLength(1);
    expect(storedData![0].title).toBe("Edited Title");
    expect(storedData![0].updatedAt > storedData![0].createdAt).toBe(true);
  });

  it("should save tasks to localStorage when a task is toggled", () => {
    const { result } = renderHook(() => useTaskManager());
    let addedTask: Task | undefined;
    act(() => {
      addedTask = result.current.addTask({
        title: "Toggle and Save",
        priority: "low",
      });
    });
    const taskId = addedTask!.id;

    act(() => {
      result.current.toggleTaskCompletion(taskId);
    });

    expect(result.current.tasks[0].status).toBe("completed");
    const storedData = loadData<Task[]>(TASKS_STORAGE_KEY);
    expect(storedData).toHaveLength(1);
    expect(storedData![0].status).toBe("completed");

    // Toggle back
    act(() => {
      result.current.toggleTaskCompletion(taskId);
    });
    expect(result.current.tasks[0].status).toBe("todo");
    const storedData2 = loadData<Task[]>(TASKS_STORAGE_KEY);
    expect(storedData2![0].status).toBe("todo");
  });

  // Add tests for error handling if localStorage is unavailable (might require more complex mocking)
});
