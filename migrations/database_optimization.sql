-- Database optimization migration
-- Adds indexes to frequently queried fields to improve query performance

-- =====================================
-- Add indexes to user_reputation table
-- =====================================
-- Index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_reputation_user_id ON user_reputation(id);

-- Index for streak counting and filtering
CREATE INDEX IF NOT EXISTS idx_user_reputation_streak ON user_reputation(streak_count);

-- Index for sorting by reputation points
CREATE INDEX IF NOT EXISTS idx_user_reputation_points ON user_reputation(points);

-- =====================================
-- Add indexes to daily_activity table
-- =====================================
-- Composite index for fast lookup of user's activities by date
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON daily_activity(user_id, activity_date);

-- Index for retrieving activities in a date range
CREATE INDEX IF NOT EXISTS idx_daily_activity_date ON daily_activity(activity_date);

-- Index for filtering activities by completion status
CREATE INDEX IF NOT EXISTS idx_daily_activity_goal_reached ON daily_activity(goal_reached);

-- =====================================
-- Add indexes to achievements table
-- =====================================
-- Index for sorting by display order
CREATE INDEX IF NOT EXISTS idx_achievements_display_order ON achievements(display_order);

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

-- =====================================
-- Add indexes to user_achievements table
-- =====================================
-- Composite index for fast lookup of user's achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_achievement ON user_achievements(user_id, achievement_id);

-- Index for sorting by unlock date
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);

-- =====================================
-- Optimize performance by vacuuming/analyzing tables
-- =====================================
ANALYZE user_reputation;
ANALYZE daily_activity;
ANALYZE achievements;
ANALYZE user_achievements;

-- =====================================
-- Pagination support for achievements
-- =====================================
-- Function to get paginated achievements for a user
CREATE OR REPLACE FUNCTION get_paginated_achievements(
    p_user_id TEXT,
    p_category TEXT DEFAULT NULL,
    p_unlocked BOOLEAN DEFAULT NULL,
    p_page INTEGER DEFAULT 1,
    p_page_size INTEGER DEFAULT 10
)
RETURNS TABLE (
    id INTEGER,
    name TEXT,
    description TEXT,
    icon TEXT,
    category TEXT,
    display_order INTEGER,
    is_unlocked BOOLEAN,
    unlocked_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_offset INTEGER := (p_page - 1) * p_page_size;
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.description,
        a.icon,
        a.category,
        a.display_order,
        CASE WHEN ua.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_unlocked,
        ua.unlocked_at
    FROM 
        achievements a
    LEFT JOIN 
        user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = p_user_id
    WHERE 
        (p_category IS NULL OR a.category = p_category) AND
        (p_unlocked IS NULL OR 
         (p_unlocked = TRUE AND ua.user_id IS NOT NULL) OR 
         (p_unlocked = FALSE AND ua.user_id IS NULL))
    ORDER BY 
        CASE WHEN ua.user_id IS NOT NULL THEN 0 ELSE 1 END, -- Unlocked first
        a.display_order ASC,
        a.id ASC
    LIMIT p_page_size
    OFFSET v_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to count total achievements matching criteria (for pagination)
CREATE OR REPLACE FUNCTION count_achievements(
    p_user_id TEXT,
    p_category TEXT DEFAULT NULL,
    p_unlocked BOOLEAN DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT 
        COUNT(*)
    INTO
        v_count
    FROM 
        achievements a
    LEFT JOIN 
        user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = p_user_id
    WHERE 
        (p_category IS NULL OR a.category = p_category) AND
        (p_unlocked IS NULL OR 
         (p_unlocked = TRUE AND ua.user_id IS NOT NULL) OR 
         (p_unlocked = FALSE AND ua.user_id IS NULL));
         
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- Optimize streak calculations 
-- =====================================
-- Function to efficiently get a user's streak data
CREATE OR REPLACE FUNCTION get_user_streak_data(p_user_id TEXT)
RETURNS TABLE (
    current_streak INTEGER,
    max_streak INTEGER,
    last_active_date DATE,
    daily_goal INTEGER,
    is_goal_reached BOOLEAN,
    tasks_completed_today INTEGER
) AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
BEGIN
    RETURN QUERY
    WITH today_activity AS (
        SELECT 
            goal_reached,
            tasks_completed
        FROM 
            daily_activity
        WHERE 
            user_id = p_user_id AND
            activity_date = v_today
        LIMIT 1
    )
    SELECT 
        ur.streak_count AS current_streak,
        ur.max_streak,
        ur.last_active_date::DATE,
        ur.daily_goal,
        COALESCE(ta.goal_reached, FALSE) AS is_goal_reached,
        COALESCE(ta.tasks_completed, 0) AS tasks_completed_today
    FROM 
        user_reputation ur
    LEFT JOIN 
        today_activity ta ON true
    WHERE 
        ur.id = p_user_id;
END;
$$ LANGUAGE plpgsql; 