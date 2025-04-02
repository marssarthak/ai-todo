import {
  describe,
  expect,
  jest,
  beforeEach,
  afterEach,
  it,
} from "@jest/globals";
import {
  getUserStreak,
  getUserActivityCalendar,
  updateDailyGoal,
  hasAchievement,
  clearAllCaches,
  getMotivationalMessage,
  StreakData,
} from "@/services/StreakService";
import { createClient } from "@/lib/supabase/client";

// Mock the Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

describe("StreakService", () => {
  // Clear caches between tests
  beforeEach(() => {
    clearAllCaches();
    jest.clearAllMocks();

    // Setup default mock for createClient
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe("getUserStreak", () => {
    it("should return null if userId is not provided", async () => {
      const result = await getUserStreak("");
      expect(result).toBeNull();
    });

    it("should use cached data when available", async () => {
      // Setup supabase mock
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            streak_count: 5,
            max_streak: 10,
            last_active_date: new Date().toISOString(),
            daily_goal: 3,
          },
          error: null,
        }),
        rpc: jest
          .fn()
          .mockResolvedValue({
            data: null,
            error: { message: "Not implemented" },
          }),
      };

      (createClient as jest.Mock).mockReturnValue(mockSupabase);

      // First call should get data from API
      const result1 = await getUserStreak("user1");
      expect(result1).not.toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      expect(result1?.currentStreak).toBe(5);

      // Reset mocks to verify second call
      jest.clearAllMocks();

      // Second call should use cache
      const result2 = await getUserStreak("user1");
      expect(result2).not.toBeNull();
      expect(mockSupabase.from).not.toHaveBeenCalled();
      expect(result2?.currentStreak).toBe(5);
    });

    it("should use optimized RPC function when available", async () => {
      const today = new Date();

      // Setup supabase mock for the RPC function
      const mockSupabase = {
        rpc: jest.fn().mockResolvedValue({
          data: {
            current_streak: 7,
            max_streak: 15,
            last_active_date: today.toISOString(),
            daily_goal: 2,
            is_goal_reached: true,
            tasks_completed_today: 3,
          },
          error: null,
        }),
        from: jest.fn(), // This shouldn't be called if RPC works
      };

      (createClient as jest.Mock).mockReturnValue(mockSupabase);

      // Call should use the RPC function
      const result = await getUserStreak("user1");

      expect(result).not.toBeNull();
      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_user_streak_data", {
        p_user_id: "user1",
      });
      expect(mockSupabase.from).not.toHaveBeenCalled();
      expect(result?.currentStreak).toBe(7);
      expect(result?.isGoalReached).toBe(true);
      expect(result?.tasksCompletedToday).toBe(3);
    });

    it("should fall back to regular queries if RPC fails", async () => {
      const today = new Date();

      // Setup supabase mock with RPC failure
      const mockSupabase = {
        rpc: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Function not found" },
        }),
        from: jest.fn().mockImplementation(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              streak_count: 3,
              max_streak: 8,
              last_active_date: today.toISOString(),
              daily_goal: 1,
            },
            error: null,
          }),
        })),
      };

      (createClient as jest.Mock).mockReturnValue(mockSupabase);

      // Call should fall back to regular queries
      const result = await getUserStreak("user1");

      expect(result).not.toBeNull();
      expect(mockSupabase.rpc).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalled();
      expect(result?.currentStreak).toBe(3);
    });
  });

  describe("getUserActivityCalendar", () => {
    it("should return empty array if userId is not provided", async () => {
      const result = await getUserActivityCalendar("");
      expect(result).toEqual([]);
    });

    it("should use cached data when available", async () => {
      // Setup supabase mock
      const mockActivityData = [
        { activity_date: "2023-05-01", tasks_completed: 3, goal_reached: true },
        {
          activity_date: "2023-05-02",
          tasks_completed: 1,
          goal_reached: false,
        },
      ];

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockActivityData,
          error: null,
        }),
      });

      const mockSupabase = { from: mockFrom };
      (createClient as jest.Mock).mockReturnValue(mockSupabase);

      // First call should fetch from API
      const result1 = await getUserActivityCalendar("user1", 2023, 4); // May (0-indexed)
      expect(result1.length).toBe(2);
      expect(mockFrom).toHaveBeenCalledTimes(1);

      // Reset mocks
      jest.clearAllMocks();

      // Second call with same params should use cache
      const result2 = await getUserActivityCalendar("user1", 2023, 4);
      expect(result2.length).toBe(2);
      expect(mockFrom).not.toHaveBeenCalled();

      // Different month should make a new request
      await getUserActivityCalendar("user1", 2023, 5);
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateDailyGoal", () => {
    it("should invalidate streak cache when goal is updated", async () => {
      // Setup initial cache with a streak
      const mockSupabase = {
        from: jest.fn().mockImplementation(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              streak_count: 5,
              max_streak: 10,
              last_active_date: new Date().toISOString(),
              daily_goal: 3,
            },
            error: null,
          }),
          update: jest.fn().mockReturnThis(),
        })),
        rpc: jest
          .fn()
          .mockResolvedValue({
            data: null,
            error: { message: "Not implemented" },
          }),
      };

      (createClient as jest.Mock).mockReturnValue(mockSupabase);

      // First call to populate cache
      await getUserStreak("user1");

      // Reset mocks
      jest.clearAllMocks();

      // Second call should use cache
      await getUserStreak("user1");
      expect(mockSupabase.from).not.toHaveBeenCalled();

      // Update daily goal
      await updateDailyGoal("user1", 5);

      // Now streak should be fetched again
      jest.clearAllMocks();
      await getUserStreak("user1");
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });

  describe("getMotivationalMessage", () => {
    it("should return a default message if streak data is null", () => {
      const message = getMotivationalMessage(null as unknown as StreakData);
      expect(message).toBe("Complete tasks to build your streak!");
    });

    it("should return a streak at risk message if applicable", () => {
      const streakData: StreakData = {
        currentStreak: 5,
        maxStreak: 10,
        lastActiveDate: new Date(),
        dailyGoal: 3,
        isGoalReached: false,
        tasksCompletedToday: 0,
        streakAtRisk: true,
        daysMissed: 0,
        longestStreak: 10,
        lastActivity: new Date(),
        completedDays: [],
      };

      const message = getMotivationalMessage(streakData);
      expect(message).toContain("Don't break your 5 day streak");
    });

    it("should return a goal reached message when goal is met", () => {
      const streakData: StreakData = {
        currentStreak: 7,
        maxStreak: 10,
        lastActiveDate: new Date(),
        dailyGoal: 3,
        isGoalReached: true,
        tasksCompletedToday: 4,
        streakAtRisk: false,
        daysMissed: 0,
        longestStreak: 10,
        lastActivity: new Date(),
        completedDays: [],
      };

      const message = getMotivationalMessage(streakData);
      expect(message).toContain("Great job!");
    });
  });
});
