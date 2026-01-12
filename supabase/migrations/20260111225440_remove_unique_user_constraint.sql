/*
  # Remove unique user_id constraint to allow multiple plans per user

  1. Changes
    - Remove UNIQUE constraint on user_id column in user_life_plans table
    - This allows users to create multiple life plans
    - Each plan will have its own unique id

  2. Important Notes
    - Users can now own multiple plans
    - Existing plans will not be affected
    - RLS policies already support multiple plans per user
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_life_plans_user_id_key'
    AND conrelid = 'user_life_plans'::regclass
  ) THEN
    ALTER TABLE user_life_plans DROP CONSTRAINT user_life_plans_user_id_key;
  END IF;
END $$;
