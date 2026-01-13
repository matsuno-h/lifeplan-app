/*
  # Add AI Advice Column to User Life Plans

  1. Changes
    - Add `ai_advice` column to `user_life_plans` table to store AI-generated financial advice
    - Column type: TEXT (allows storing large AI-generated reports)
    - Default value: NULL (advice is optional and only generated when requested)
  
  2. Purpose
    - Enable persistence of AI-generated financial planning advice
    - Allow users to view previously generated advice without re-generating
    - Support saving advice per plan (each plan can have its own advice)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_life_plans' AND column_name = 'ai_advice'
  ) THEN
    ALTER TABLE user_life_plans ADD COLUMN ai_advice TEXT DEFAULT NULL;
  END IF;
END $$;