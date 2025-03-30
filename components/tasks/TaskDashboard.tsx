"use client";

import React, { useState } from "react";
import {
  useTaskManager,
  CreateTaskData,
  UpdateTaskData,
} from "@/hooks/useTaskManager";
import { Task } from "@/types/task";
import { TaskList } from "./TaskList";
import { TaskForm, TaskFormData } from "./TaskForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose, // Import DialogClose if needed, or manage closing via state
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductivityInsights } from "@/components/ai/ProductivityInsights";

export function TaskDashboard() {
  const {
    tasks,
    addTask,
    editTask,
    deleteTask,
    toggleTaskCompletion,
    applyFilters,
    applySort,
    currentFilters,
    currentSortCriteria,
    currentSortDirection,
    allTasks, // Use allTasks for summary calculations
    isLoading, // Get loading state
    error, // Get error state
    loadingTaskIds, // Get loading IDs
    retryFetch, // Get retry function
  } = useTaskManager(/* Add initial tasks here if needed */);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleOpenFormForCreate = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleOpenFormForEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTask(null); // Clear editing state when closing
  };

  const handleFormSubmit = async (data: TaskFormData) => {
    if (editingTask) {
      // Editing existing task
      const updateData: UpdateTaskData = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status, // Status can be updated when editing
        deadline: data.deadline,
      };
      await editTask(editingTask.id, updateData);
    } else {
      // Creating new task
      const createData: CreateTaskData = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        // Status defaults to 'todo' in addTask if not provided
        deadline: data.deadline,
      };
      await addTask(createData);
    }
    handleCloseForm();
  };

  const handleDeleteTask = (id: string) => {
    // Example Confirmation:
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTask(id);
    }
  };

  // Calculate task summary
  const taskSummary = allTasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      acc.total++;
      return acc;
    },
    { todo: 0, "in-progress": 0, completed: 0, total: 0 }
  );

  // 1. Handle Global Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Skeleton for Task List Area */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // 2. Handle Global Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4 border bg-destructive/10 border-destructive/30 rounded-lg">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-xl font-semibold text-destructive mb-2">
          Failed to Load Tasks
        </h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={retryFetch} variant="destructive">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            {/* Icon can go here */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskSummary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskSummary.todo}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {taskSummary["in-progress"]}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskSummary.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Productivity Insights */}
      <ProductivityInsights />

      {/* Task List and Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Tasks</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenFormForCreate} disabled={isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] md:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Edit Task" : "Add New Task"}
              </DialogTitle>
              <DialogDescription>
                {editingTask
                  ? "Update the details of your task."
                  : "Fill in the details for your new task."}
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              onSubmit={handleFormSubmit}
              initialData={editingTask || undefined} // Pass undefined if creating
              onCancel={handleCloseForm}
              submitButtonText={editingTask ? "Save Changes" : "Create Task"}
            />
            {/* Optional: Add DialogFooter with explicit close button if needed */}
          </DialogContent>
        </Dialog>
      </div>

      <TaskList
        tasks={tasks} // Pass the processed (filtered/sorted) tasks
        loadingTaskIds={loadingTaskIds} // Pass loading IDs down
        onToggleComplete={toggleTaskCompletion}
        onEdit={handleOpenFormForEdit} // Opens the dialog with the task data
        onDelete={handleDeleteTask}
        onSortChange={applySort}
        onFilterChange={applyFilters}
        currentSortCriteria={currentSortCriteria}
        currentSortDirection={currentSortDirection}
        currentFilters={currentFilters}
      />
    </div>
  );
}
