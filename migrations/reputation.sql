-- Create reputation levels reference table
CREATE TABLE IF NOT EXISTS reputation_levels (
  id SERIAL PRIMARY KEY,
  level_name TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT NOT NULL
);

-- Create user reputation table to store current reputation data
CREATE TABLE IF NOT EXISTS user_reputation (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 0 REFERENCES reputation_levels(id),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reputation history table to track changes
CREATE TABLE IF NOT EXISTS reputation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  task_title TEXT,
  previous_score INTEGER NOT NULL,
  score INTEGER NOT NULL,
  level INTEGER NOT NULL REFERENCES reputation_levels(id),
  is_level_up BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on user_id for faster history queries
CREATE INDEX IF NOT EXISTS idx_reputation_history_user_id ON reputation_history(user_id);

-- Populate reputation levels table with initial data
INSERT INTO reputation_levels (level_name, threshold, icon, color, description)
VALUES 
  ('Beginner', 0, 'StarIcon', 'bg-zinc-500', 'Just starting your productivity journey'),
  ('Intermediate', 10, 'StarIcon', 'bg-blue-500', 'Consistently completing tasks'),
  ('Advanced', 25, 'BadgeIcon', 'bg-green-500', 'Building strong productivity habits'),
  ('Expert', 50, 'AwardIcon', 'bg-purple-500', 'Mastering your productivity'),
  ('Master', 100, 'TrophyIcon', 'bg-yellow-500', 'Maximum productivity achievement')
ON CONFLICT (id) DO NOTHING;

-- Create function to update user reputation when tasks are verified
CREATE OR REPLACE FUNCTION update_reputation_on_task_verification()
RETURNS TRIGGER AS $$
DECLARE
  current_score INTEGER;
  previous_score INTEGER;
  current_level INTEGER;
  previous_level INTEGER;
  is_level_up BOOLEAN;
  is_verified BOOLEAN;
  already_awarded BOOLEAN;
BEGIN
  -- Check if the task is verified in metadata
  is_verified := (NEW.metadata->>'verified')::boolean;
  
  -- Only proceed if task is completed AND verified
  IF NEW.status = 'completed' AND is_verified = true THEN
    -- Check if we've already awarded points for this task
    SELECT EXISTS(
      SELECT 1 FROM reputation_history 
      WHERE task_id = NEW.id AND user_id = NEW.user_id
    ) INTO already_awarded;
    
    -- Only proceed if we haven't already awarded points
    IF NOT already_awarded THEN
      -- Get the user's current reputation
      SELECT score, level INTO previous_score, previous_level FROM user_reputation 
      WHERE id = NEW.user_id;
      
      -- If no record exists, initialize with 0
      IF previous_score IS NULL THEN
        previous_score := 0;
        previous_level := 1;
        
        INSERT INTO user_reputation (id, score, level, last_updated)
        VALUES (NEW.user_id, 1, 1, now());
      ELSE
        -- Update the user's reputation
        UPDATE user_reputation 
        SET 
          score = score + 1,
          last_updated = now()
        WHERE id = NEW.user_id
        RETURNING score, level INTO current_score, current_level;
        
        -- Check if user leveled up
        is_level_up := current_level > previous_level;
        
        -- Record the reputation change
        INSERT INTO reputation_history (
          user_id, change, reason, task_id, task_title, 
          previous_score, score, level, is_level_up
        )
        VALUES (
          NEW.user_id, 1, 'Task completed and verified', NEW.id, NEW.title,
          previous_score, current_score, current_level, is_level_up
        );
        
        -- If user leveled up, add a special history entry
        IF is_level_up THEN
          INSERT INTO reputation_history (
            user_id, change, reason, previous_score, score, level, is_level_up
          )
          VALUES (
            NEW.user_id, 0, 'Level up', current_score, current_score, current_level, TRUE
          );
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires when task is either completed or verified
-- We need to update since a task can be completed first, then verified later
-- Or it might be completed and verified in the same transaction
CREATE TRIGGER task_verified_reputation_update
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_reputation_on_task_verification(); 