"use client";

import React from "react";
import { Task, TaskPriority, TaskStatus } from "@/types/task";
import {
  TaskSortCriteria,
  SortDirection,
  TaskFilters,
} from "@/hooks/useTaskManager";
import { TaskCard } from "./TaskCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, Filter } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2 } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  loadingTaskIds: Set<string>;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onSortChange: (criteria: TaskSortCriteria, direction: SortDirection) => void;
  onFilterChange: (filters: TaskFilters) => void;
  currentSortCriteria: TaskSortCriteria;
  currentSortDirection: SortDirection;
  currentFilters: TaskFilters;
}

const sortOptions: { value: TaskSortCriteria; label: string }[] = [
  { value: "createdAt", label: "Creation Date" },
  { value: "deadline", label: "Deadline" },
  { value: "priority", label: "Priority" },
];

const priorityOptions: { id: TaskPriority; label: string }[] = [
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

const statusOptions: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

export function TaskList({
  tasks,
  loadingTaskIds,
  onToggleComplete,
  onEdit,
  onDelete,
  onSortChange,
  onFilterChange,
  currentSortCriteria,
  currentSortDirection,
  currentFilters,
}: TaskListProps) {
  const handleSortCriteriaChange = (value: string) => {
    onSortChange(value as TaskSortCriteria, currentSortDirection);
  };

  const handleSortDirectionChange = () => {
    const newDirection = currentSortDirection === "asc" ? "desc" : "asc";
    onSortChange(currentSortCriteria, newDirection);
  };

  const handlePriorityFilterChange = (
    priority: TaskPriority,
    checked: boolean | string
  ) => {
    const currentPriorities = currentFilters.priority || [];
    let newPriorities: TaskPriority[] = [];
    if (checked) {
      newPriorities = [...currentPriorities, priority];
    } else {
      newPriorities = currentPriorities.filter((p) => p !== priority);
    }
    onFilterChange({ ...currentFilters, priority: newPriorities });
  };

  const handleStatusFilterChange = (
    status: TaskStatus,
    checked: boolean | string
  ) => {
    const currentStatuses = currentFilters.status || [];
    let newStatuses: TaskStatus[] = [];
    if (checked) {
      newStatuses = [...currentStatuses, status];
    } else {
      newStatuses = currentStatuses.filter((s) => s !== status);
    }
    onFilterChange({ ...currentFilters, status: newStatuses });
  };

  return (
    <div className="space-y-4">
      {/* Controls: Sorting and Filtering */}
      <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between">
        <div className="flex items-center gap-2">
          <Label
            htmlFor="sort-criteria"
            className="text-sm font-medium shrink-0"
          >
            Sort by:
          </Label>
          <Select
            value={currentSortCriteria}
            onValueChange={handleSortCriteriaChange}
          >
            <SelectTrigger id="sort-criteria" className="w-[180px]">
              <SelectValue placeholder="Select sort criteria" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSortDirectionChange}
            aria-label={`Sort direction: ${
              currentSortDirection === "asc" ? "ascending" : "descending"
            }`}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-4 space-y-4">
            <div>
              <h4 className="font-medium leading-none mb-2">Priority</h4>
              {priorityOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center space-x-2 mb-1"
                >
                  <Checkbox
                    id={`filter-priority-${option.id}`}
                    checked={currentFilters.priority?.includes(option.id)}
                    onCheckedChange={(checked) =>
                      handlePriorityFilterChange(option.id, checked)
                    }
                  />
                  <Label
                    htmlFor={`filter-priority-${option.id}`}
                    className="text-sm font-normal"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-medium leading-none mb-2">Status</h4>
              {statusOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center space-x-2 mb-1"
                >
                  <Checkbox
                    id={`filter-status-${option.id}`}
                    checked={currentFilters.status?.includes(option.id)}
                    onCheckedChange={(checked) =>
                      handleStatusFilterChange(option.id, checked)
                    }
                  />
                  <Label
                    htmlFor={`filter-status-${option.id}`}
                    className="text-sm font-normal"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Task Grid */}
      {tasks.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          <p>No tasks found.</p>
          <p>Add a new task to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isLoading={loadingTaskIds.has(task.id)}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
