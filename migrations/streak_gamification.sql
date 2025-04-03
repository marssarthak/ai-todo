-- Add streak related fields to user_reputation table
ALTER TABLE user_reputation 
ADD COLUMN IF NOT EXISTS streak_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date DATE,
ADD COLUMN IF NOT EXISTS max_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_goal INTEGER NOT NULL DEFAULT 1;

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

-- Create user achievements table for tracking unlocked achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create daily activity tracking table
CREATE TABLE IF NOT EXISTS daily_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  goal_reached BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id, activity_date)
);

-- Add index on user_id for faster activity queries
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_id ON daily_activity(user_id);

-- Add index on activity_date for date range queries
CREATE INDEX IF NOT EXISTS idx_daily_activity_date ON daily_activity(activity_date);

-- Populate achievements table with initial data
INSERT INTO achievements (name, description, icon, category, display_order)
VALUES 
  ('First Task', 'Complete your first task', 'CheckCircleIcon', 'tasks', 1),
  ('Productivity Starter', 'Complete 10 tasks', 'ListChecksIcon', 'tasks', 2),
  ('Task Master', 'Complete 100 tasks', 'AwardIcon', 'tasks', 3),
  ('First Streak', 'Maintain a streak for 3 days', 'FlameIcon', 'streaks', 4),
  ('Week Warrior', 'Maintain a streak for 7 days', 'CalendarIcon', 'streaks', 5),
  ('Consistent Achiever', 'Maintain a streak for 30 days', 'TrophyIcon', 'streaks', 6),
  ('Perfectionist', 'Complete all daily goals for 5 days', 'TargetIcon', 'goals', 7),
  ('Weekend Warrior', 'Complete tasks on both Saturday and Sunday', 'SunIcon', 'dedication', 8),
  ('Night Owl', 'Complete a task after 10 PM', 'MoonIcon', 'dedication', 9),
  ('Early Bird', 'Complete a task before 7 AM', 'SunriseIcon', 'dedication', 10)
ON CONFLICT (id) DO NOTHING;

-- Create function to update streak based on daily activity
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  yesterday DATE;
  two_days_ago DATE;
  current_streak INTEGER;
  max_streak INTEGER;
  achievement_id INTEGER;
BEGIN
  -- Get current streak info
  SELECT ur.streak_count, ur.max_streak, ur.last_active_date 
  INTO current_streak, max_streak, yesterday
  FROM user_reputation ur
  WHERE ur.id = NEW.user_id;
  
  -- Calculate yesterday and two days ago
  yesterday := CURRENT_DATE - INTERVAL '1 day';
  two_days_ago := CURRENT_DATE - INTERVAL '2 days';
  
  -- If this is the first activity
  IF current_streak IS NULL OR current_streak = 0 THEN
    current_streak := 1;
    
  -- If already active today, just update tasks_completed
  ELSIF NEW.activity_date = CURRENT_DATE AND current_streak > 0 THEN
    -- No streak change needed, just update task count
    NULL;
    
  -- If active yesterday, increment streak
  ELSIF yesterday = NEW.last_active_date THEN
    current_streak := current_streak + 1;
    
  -- If missed one day but active two days ago, lose streak but start a new one
  ELSIF two_days_ago = NEW.last_active_date THEN
    current_streak := 1;
    
  -- If longer gap, reset streak
  ELSE
    current_streak := 1;
  END IF;
  
  -- Update max streak if needed
  IF current_streak > max_streak THEN
    max_streak := current_streak;
  END IF;
  
  -- Update user_reputation
  UPDATE user_reputation ur
  SET 
    streak_count = current_streak,
    max_streak = max_streak,
    last_active_date = NEW.activity_date
  WHERE ur.id = NEW.user_id;
  
  -- Check if they've unlocked any streak achievements
  IF current_streak >= 3 THEN
    -- First Streak achievement (3 days)
    SELECT a.id INTO achievement_id FROM achievements a WHERE a.name = 'First Streak';
    
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (NEW.user_id, achievement_id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;
  
  IF current_streak >= 7 THEN
    -- Week Warrior achievement (7 days)
    SELECT a.id INTO achievement_id FROM achievements a WHERE a.name = 'Week Warrior';
    
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (NEW.user_id, achievement_id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;
  
  IF current_streak >= 30 THEN
    -- Consistent Achiever achievement (30 days)
    SELECT a.id INTO achievement_id FROM achievements a WHERE a.name = 'Consistent Achiever';
    
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (NEW.user_id, achievement_id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on daily activity
CREATE TRIGGER update_streak_on_activity
AFTER INSERT OR UPDATE OF tasks_completed ON daily_activity
FOR EACH ROW
WHEN (NEW.tasks_completed > 0)
EXECUTE FUNCTION update_user_streak();

-- Create function to check and update daily activity when tasks are completed
CREATE OR REPLACE FUNCTION update_daily_activity_on_task_completion()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE;
  current_tasks INTEGER;
  daily_goal INTEGER;
  goal_reached BOOLEAN;
  achievement_id INTEGER;
BEGIN
  -- Only trigger on task completion
  IF NEW.status = 'completed' THEN
    today_date := CURRENT_DATE;
    
    -- Get user's daily goal
    SELECT ur.daily_goal INTO daily_goal FROM user_reputation ur
    WHERE ur.id = NEW.user_id;
    
    -- Default to 1 if not set
    IF daily_goal IS NULL THEN
      daily_goal := 1;
    END IF;
    
    -- Check if we already have a record for today
    SELECT da.tasks_completed, da.goal_reached 
    INTO current_tasks, goal_reached
    FROM daily_activity da
    WHERE da.user_id = NEW.user_id AND da.activity_date = today_date;
    
    -- If no record exists for today, create one
    IF current_tasks IS NULL THEN
      current_tasks := 1;
      goal_reached := (current_tasks >= daily_goal);
      
      INSERT INTO daily_activity (
        user_id, activity_date, tasks_completed, goal_reached
      ) VALUES (
        NEW.user_id, today_date, current_tasks, goal_reached
      );
    ELSE
      -- Update existing record
      current_tasks := current_tasks + 1;
      goal_reached := (current_tasks >= daily_goal);
      
      UPDATE daily_activity da
      SET 
        tasks_completed = current_tasks,
        goal_reached = goal_reached
      WHERE da.user_id = NEW.user_id AND da.activity_date = today_date;
    END IF;
    
    -- Check for first task achievement
    IF NEW.status = 'completed' THEN
      SELECT a.id INTO achievement_id FROM achievements a WHERE a.name = 'First Task';
      
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (NEW.user_id, achievement_id)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
    
    -- Check for weekend warrior achievement
    IF EXTRACT(DOW FROM today_date) IN (0, 6) THEN -- 0 is Sunday, 6 is Saturday
      -- Check if they've completed tasks on both Saturday and Sunday
      IF EXISTS (
        SELECT 1 FROM daily_activity da
        WHERE da.user_id = NEW.user_id 
        AND EXTRACT(DOW FROM da.activity_date) = 0 -- Sunday
        AND da.tasks_completed > 0
      ) AND EXISTS (
        SELECT 1 FROM daily_activity da
        WHERE da.user_id = NEW.user_id 
        AND EXTRACT(DOW FROM da.activity_date) = 6 -- Saturday
        AND da.tasks_completed > 0
      ) THEN
        -- Weekend Warrior achievement
        SELECT a.id INTO achievement_id FROM achievements a WHERE a.name = 'Weekend Warrior';
        
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (NEW.user_id, achievement_id)
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
      END IF;
    END IF;
    
    -- Check for time-based achievements
    IF EXTRACT(HOUR FROM NOW()) >= 22 THEN -- After 10 PM
      -- Night Owl achievement
      SELECT a.id INTO achievement_id FROM achievements a WHERE a.name = 'Night Owl';
      
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (NEW.user_id, achievement_id)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
    
    IF EXTRACT(HOUR FROM NOW()) < 7 THEN -- Before 7 AM
      -- Early Bird achievement
      SELECT a.id INTO achievement_id FROM achievements a WHERE a.name = 'Early Bird';
      
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (NEW.user_id, achievement_id)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on task updates
CREATE TRIGGER update_activity_on_task_completion
AFTER UPDATE OF status ON tasks
FOR EACH ROW
WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
EXECUTE FUNCTION update_daily_activity_on_task_completion(); 