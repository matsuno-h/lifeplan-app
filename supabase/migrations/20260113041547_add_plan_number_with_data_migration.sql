/*
  # Add plan_number to user_life_plans table with data migration

  1. Changes
    - Drop the UNIQUE constraint on user_id (to allow multiple plans per user)
    - Add `plan_number` column (integer, 1-3) to track which plan slot this is
    - Migrate existing data by assigning plan numbers to existing records
    - Add UNIQUE constraint on (user_id, plan_number) to prevent duplicate plan numbers
    - Add CHECK constraint to ensure plan_number is between 1 and 3
    - Add `plan_name` column to allow users to name their plans

  2. Security
    - RLS policies remain unchanged - users can only access their own plans

  3. Important Notes
    - Each user can now have up to 3 plans (plan_number: 1, 2, or 3)
    - The combination of user_id and plan_number must be unique
    - Plan numbers are restricted to 1, 2, or 3
    - Existing records will be automatically numbered based on creation order
*/

-- Drop the existing unique constraint on user_id if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_life_plans_user_id_key'
  ) THEN
    ALTER TABLE user_life_plans DROP CONSTRAINT user_life_plans_user_id_key;
  END IF;
END $$;

-- Add plan_number column (nullable initially to allow data migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_life_plans' AND column_name = 'plan_number'
  ) THEN
    ALTER TABLE user_life_plans ADD COLUMN plan_number integer;
  END IF;
END $$;

-- Add plan_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_life_plans' AND column_name = 'plan_name'
  ) THEN
    ALTER TABLE user_life_plans ADD COLUMN plan_name text;
  END IF;
END $$;

-- Migrate existing data: assign plan numbers based on created_at order
DO $$
BEGIN
  -- Update plan_number for existing records
  UPDATE user_life_plans
  SET plan_number = subquery.row_num
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
    FROM user_life_plans
  ) as subquery
  WHERE user_life_plans.id = subquery.id
  AND user_life_plans.plan_number IS NULL;
END $$;

-- Make plan_number NOT NULL after data migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_life_plans' 
    AND column_name = 'plan_number'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE user_life_plans ALTER COLUMN plan_number SET NOT NULL;
  END IF;
END $$;

-- Set default value for future inserts
DO $$
BEGIN
  ALTER TABLE user_life_plans ALTER COLUMN plan_number SET DEFAULT 1;
END $$;

-- Add CHECK constraint to ensure plan_number is 1, 2, or 3
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_life_plans_plan_number_check'
  ) THEN
    ALTER TABLE user_life_plans ADD CONSTRAINT user_life_plans_plan_number_check 
      CHECK (plan_number >= 1 AND plan_number <= 3);
  END IF;
END $$;

-- Add UNIQUE constraint on (user_id, plan_number)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_life_plans_user_id_plan_number_key'
  ) THEN
    ALTER TABLE user_life_plans ADD CONSTRAINT user_life_plans_user_id_plan_number_key 
      UNIQUE (user_id, plan_number);
  END IF;
END $$;

-- Create index on (user_id, plan_number) for faster queries
CREATE INDEX IF NOT EXISTS idx_user_life_plans_user_id_plan_number 
  ON user_life_plans(user_id, plan_number);
