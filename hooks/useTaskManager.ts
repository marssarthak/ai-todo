"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Task, TaskPriority, TaskStatus } from "@/types/task";
import * as TaskService from "@/services/TaskService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Type for the data needed to create a new task
export type CreateTaskData = Omit<
  Task,
  "id" | "createdAt" | "updatedAt" | "status" | "userId"
> & {
  status?: TaskStatus; // Status is optional on creation, defaults to 'todo'
};

// Type for the data needed to update an existing task
export type UpdateTaskData = Partial<
  Omit<Task, "id" | "createdAt" | "updatedAt" | "userId">
>;

// Type for filtering criteria
export type TaskFilters = {
  status?: TaskStatus[];
  priority?: TaskPriority[];
};

// Type for sorting criteria
export type TaskSortCriteria = keyof Pick<
  Task,
  "deadline" | "priority" | "createdAt"
>;
export type SortDirection = "asc" | "desc";

export function useTaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Represents initial load
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: isAuthLoading } = useAuth(); // Get user for API calls
  const [loadingTaskIds, setLoadingTaskIds] = useState<Set<string>>(new Set()); // Track loading IDs

  const [filters, setFilters] = useState<TaskFilters>({});
  const [sortCriteria, setSortCriteria] =
    useState<TaskSortCriteria>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Initial Fetch Tasks
  useEffect(() => {
    if (!isAuthLoading && user) {
      // Only fetch if auth is resolved and user exists
      setIsLoading(true);
      setError(null);
      TaskService.getTasks()
        .then((fetchedTasks) => {
          // Ensure dates are Date objects (API might return strings)
          const tasksWithDates = fetchedTasks.map((t) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
            deadline: t.deadline ? new Date(t.deadline) : undefined,
          }));
          setTasks(tasksWithDates);
        })
        .catch((err) => {
          console.error("Failed to fetch tasks:", err);
          const message =
            err instanceof Error ? err.message : "Failed to load tasks.";
          setError(message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!isAuthLoading && !user) {
      // If auth is resolved but no user, clear tasks and stop loading
      setTasks([]);
      setIsLoading(false);
    }
    // Dependency: Fetch when auth state changes
  }, [user, isAuthLoading]);

  // Helper to add/remove loading ID
  const trackLoading = (id: string, isLoading: boolean) => {
    setLoadingTaskIds((prev) => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  // Add a new task
  const addTask = useCallback(
    async (taskData: CreateTaskData) => {
      if (!user) {
        setError("You must be logged in to add tasks.");
        return;
      }
      const optimisticId = uuidv4();
      const optimisticTask: Task = {
        ...taskData,
        id: optimisticId,
        status: taskData.status || "todo",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.id,
      };
      setTasks((prevTasks) => [optimisticTask, ...prevTasks]);
      trackLoading(optimisticId, true); // Start tracking loading
      setError(null);

      try {
        const createdTask = await TaskService.createTask(taskData);
        const finalTask = {
          ...createdTask,
          createdAt: new Date(createdTask.createdAt),
          updatedAt: new Date(createdTask.updatedAt),
          deadline: createdTask.deadline
            ? new Date(createdTask.deadline)
            : undefined,
        };

        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === optimisticId ? finalTask : task))
        );
        toast.success("Task created successfully");
      } catch (err) {
        console.error("Failed to create task:", err);
        const message =
          err instanceof Error ? err.message : "Failed to add task.";
        setError(message);
        setTasks((prevTasks) =>
          prevTasks.filter((task) => task.id !== optimisticId)
        );
      } finally {
        trackLoading(optimisticId, false); // Stop tracking loading regardless of outcome
      }
    },
    [user]
  );

  // Edit an existing task
  const editTask = useCallback(
    async (id: string, updates: UpdateTaskData) => {
      const originalTasks = tasks;
      const originalTask = originalTasks.find((t) => t.id === id);
      if (!originalTask) return; // Should not happen if UI is correct

      const optimisticTasks = tasks.map((task) =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date() } // Apply updates locally
          : task
      );
      setTasks(optimisticTasks);
      trackLoading(id, true); // Start loading
      setError(null);

      try {
        const updatedTask = await TaskService.updateTask(id, updates);
        const finalTask = {
          ...updatedTask,
          createdAt: new Date(updatedTask.createdAt),
          updatedAt: new Date(updatedTask.updatedAt),
          deadline: updatedTask.deadline
            ? new Date(updatedTask.deadline)
            : undefined,
        };
        setTasks(
          (prevTasks) =>
            prevTasks.map((task) => (task.id === id ? finalTask : task)) // Replace with server data
        );
        toast.success("Task updated successfully");
      } catch (err) {
        console.error("Failed to update task:", err);
        const message =
          err instanceof Error ? err.message : "Failed to update task.";
        setError(message);
        setTasks(originalTasks); // Rollback
      } finally {
        trackLoading(id, false); // Stop loading
      }
    },
    [tasks] // Dependency on tasks is important here for rollback
  );

  // Delete a task
  const deleteTask = useCallback(
    async (id: string) => {
      const originalTasks = tasks;
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
      trackLoading(id, true); // Track as loading during delete API call
      setError(null);

      try {
        await TaskService.deleteTask(id);
        // On success, task is already removed from local state
        // Stop tracking loading (it won't be rendered anymore)
        setLoadingTaskIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });

        toast.success("Task deleted successfully");
      } catch (err) {
        console.error("Failed to delete task:", err);
        const message =
          err instanceof Error ? err.message : "Failed to delete task.";
        setError(message);
        setTasks(originalTasks); // Rollback
        trackLoading(id, false); // Ensure loading state is cleared on error too
      }
    },
    [tasks]
  );

  // Toggle completion combines edit logic
  const toggleTaskCompletion = useCallback(
    async (id: string) => {
      const taskToToggle = tasks.find((task) => task.id === id);
      if (!taskToToggle) return;

      const newStatus =
        taskToToggle.status === "completed" ? "todo" : "completed";
      const updates: UpdateTaskData = { status: newStatus };

      // Use the existing editTask logic for optimistic update + API call + rollback
      await editTask(id, updates);
      toast.success("Task updated successfully");
    },
    [tasks, editTask] // Include editTask dependency
  );

  // Set filtering criteria
  const applyFilters = useCallback((newFilters: TaskFilters) => {
    setFilters(newFilters);
  }, []);

  // Set sorting criteria
  const applySort = useCallback(
    (criteria: TaskSortCriteria, direction: SortDirection) => {
      setSortCriteria(criteria);
      setSortDirection(direction);
    },
    []
  );

  // Use useMemo for processed tasks to avoid recalculating on every render
  const processedTasks = useMemo(() => {
    let processed = [...tasks];

    // Filtering
    if (filters.status && filters.status.length > 0) {
      processed = processed.filter((task) =>
        filters.status!.includes(task.status)
      );
    }
    if (filters.priority && filters.priority.length > 0) {
      processed = processed.filter((task) =>
        filters.priority!.includes(task.priority)
      );
    }

    // Sorting
    const priorityOrder: Record<TaskPriority, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    processed.sort((a, b) => {
      let comparison = 0;
      const valA = a[sortCriteria];
      const valB = b[sortCriteria];

      if (sortCriteria === "priority") {
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortCriteria === "deadline") {
        // Handle potentially undefined deadlines - sort undefined last
        if (valA === undefined && valB === undefined) {
          comparison = 0;
        } else if (valA === undefined) {
          comparison = 1; // a is undefined, sort after b
        } else if (valB === undefined) {
          comparison = -1; // b is undefined, sort after a
        } else {
          // Both are defined Dates
          comparison = (valA as Date).getTime() - (valB as Date).getTime();
        }
      } else if (sortCriteria === "createdAt") {
        // createdAt is always defined
        comparison = (valA as Date).getTime() - (valB as Date).getTime();
      }
      // Note: No generic else case needed as TaskSortCriteria restricts the keys

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return processed;
  }, [tasks, filters, sortCriteria, sortDirection]);

  // Return loading state if needed, or just let the initial render be empty
  return {
    tasks: processedTasks, // Filtered/sorted tasks
    allTasks: tasks, // Raw tasks from state
    isLoading: isLoading || isAuthLoading, // Combine initial load and auth load
    loadingTaskIds, // Expose the set of loading IDs
    error,
    addTask,
    editTask,
    deleteTask,
    toggleTaskCompletion,
    applyFilters,
    applySort,
    currentFilters: filters,
    currentSortCriteria: sortCriteria,
    currentSortDirection: sortDirection,
    retryFetch: useCallback(() => {
      // Wrap retry in useCallback
      if (user && !isAuthLoading) {
        // Ensure auth is ready
        setIsLoading(true);
        setError(null);
        TaskService.getTasks()
          .then((fetchedTasks) => {
            const tasksWithDates = fetchedTasks.map((t) => ({
              ...t,
              createdAt: new Date(t.createdAt),
              updatedAt: new Date(t.updatedAt),
              deadline: t.deadline ? new Date(t.deadline) : undefined,
            }));
            setTasks(tasksWithDates);
          })
          .catch((err) => {
            const message =
              err instanceof Error ? err.message : "Failed to load tasks.";
            setError(message);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }, [user, isAuthLoading]), // Dependencies for retryFetch
  };
}
