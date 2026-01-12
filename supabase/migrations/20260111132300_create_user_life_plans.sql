/*
  # Create user life plans table

  1. New Tables
    - `user_life_plans`
      - `id` (uuid, primary key) - Unique identifier for each plan
      - `user_id` (uuid, foreign key to auth.users) - Owner of the plan
      - `plan_data` (jsonb) - Complete life plan data including settings, incomes, expenses, etc.
      - `created_at` (timestamptz) - When the plan was created
      - `updated_at` (timestamptz) - When the plan was last updated
  
  2. Security
    - Enable RLS on `user_life_plans` table
    - Add policy for authenticated users to read their own plans
    - Add policy for authenticated users to insert their own plans
    - Add policy for authenticated users to update their own plans
    - Add policy for authenticated users to delete their own plans

  3. Important Notes
    - Each user can have one life plan (enforced by unique constraint)
    - All data is stored in a single JSONB column for flexibility
    - RLS ensures users can only access their own data
*/

CREATE TABLE IF NOT EXISTS user_life_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE user_life_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own life plan"
  ON user_life_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own life plan"
  ON user_life_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own life plan"
  ON user_life_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own life plan"
  ON user_life_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_life_plans_user_id ON user_life_plans(user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_life_plans_updated_at
  BEFORE UPDATE ON user_life_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
