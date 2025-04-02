import React, { useState, useEffect } from "react";
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";
import {
  getUserActivityCalendar,
  DailyActivity,
} from "@/services/StreakService";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StreakCalendarProps {
  title?: string;
  className?: string;
}

export function StreakCalendar({
  title = "Activity Calendar",
  className,
}: StreakCalendarProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get first and last day of the month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Get all days for the month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Handle month navigation
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToCurrentMonth = () => setCurrentDate(new Date());

  useEffect(() => {
    if (!user?.id) return;

    async function fetchData() {
      setIsLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const activityData = await getUserActivityCalendar(user.id, year, month);
      setActivities(activityData);
      setIsLoading(false);
    }

    fetchData();
  }, [user, currentDate]);

  // Helper to find activity for a specific day
  const getActivityForDay = (day: Date) => {
    return activities.find((activity) => isSameDay(activity.date, day));
  };

  // Days of week header
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>
              {format(currentDate, "MMMM yyyy")}
            </CardDescription>
          </div>
          <div className="flex space-x-1">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous month</span>
            </Button>
            <Button variant="outline" size="icon" onClick={goToCurrentMonth}>
              <CalendarIcon className="h-4 w-4" />
              <span className="sr-only">Current month</span>
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next month</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Days of week header */}
        <div className="grid grid-cols-7 mb-2 text-xs font-medium text-center">
          {weekDays.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the start of the month */}
            {Array.from({ length: monthStart.getDay() }).map((_, index) => (
              <div key={`empty-start-${index}`} className="aspect-square" />
            ))}

            {/* Calendar days */}
            {daysInMonth.map((day) => {
              const activity = getActivityForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <TooltipProvider key={day.toString()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "aspect-square flex flex-col items-center justify-center rounded-md text-xs relative",
                          isCurrentMonth ? "opacity-100" : "opacity-30",
                          isCurrentDay && "border border-primary",
                          activity?.goalReached &&
                            "bg-green-50 dark:bg-green-950/20",
                          activity?.tasksCompleted > 0 &&
                            !activity.goalReached &&
                            "bg-blue-50 dark:bg-blue-950/20"
                        )}
                      >
                        <span className="font-medium">{format(day, "d")}</span>
                        {activity?.tasksCompleted > 0 && (
                          <div className="absolute bottom-1">
                            {activity.goalReached ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <Circle className="h-3 w-3 text-blue-400 fill-blue-100 dark:fill-blue-900" />
                            )}
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs space-y-1">
                        <p className="font-medium">
                          {format(day, "EEEE, MMMM d, yyyy")}
                        </p>
                        {activity?.tasksCompleted > 0 ? (
                          <p>
                            {activity.tasksCompleted} task
                            {activity.tasksCompleted !== 1 && "s"} completed
                            {activity.goalReached && " (Goal reached)"}
                          </p>
                        ) : (
                          <p>No tasks completed</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}

            {/* Empty cells for days after the end of the month */}
            {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
              <div key={`empty-end-${index}`} className="aspect-square" />
            ))}
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center">
              <Circle className="h-3 w-3 mr-1 text-blue-400 fill-blue-100 dark:fill-blue-900" />
              <span>Tasks Completed</span>
            </div>

            <div className="flex items-center">
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
              <span>Daily Goal Met</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
