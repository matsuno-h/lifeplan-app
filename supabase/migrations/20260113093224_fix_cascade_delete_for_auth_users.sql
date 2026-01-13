/*
  # Fix CASCADE DELETE for auth.users references

  1. Changes
    - Drop existing foreign key constraints on user_id columns
    - Recreate them with ON DELETE CASCADE
    - Ensures that when a user is deleted from auth.users, all related data is automatically deleted

  2. Tables affected
    - user_profiles: user_id -> auth.users.id
    - user_life_plans: user_id -> auth.users.id
    - plan_collaborators: owner_id -> auth.users.id
    - plan_collaborators: collaborator_id -> auth.users.id
*/

-- user_profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_profiles_user_id_fkey'
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_user_id_fkey;
  END IF;
END $$;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- user_life_plans
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_life_plans_user_id_fkey'
    AND table_name = 'user_life_plans'
  ) THEN
    ALTER TABLE user_life_plans DROP CONSTRAINT user_life_plans_user_id_fkey;
  END IF;
END $$;

ALTER TABLE user_life_plans
  ADD CONSTRAINT user_life_plans_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- plan_collaborators owner_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'plan_collaborators_owner_id_fkey'
    AND table_name = 'plan_collaborators'
  ) THEN
    ALTER TABLE plan_collaborators DROP CONSTRAINT plan_collaborators_owner_id_fkey;
  END IF;
END $$;

ALTER TABLE plan_collaborators
  ADD CONSTRAINT plan_collaborators_owner_id_fkey
  FOREIGN KEY (owner_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- plan_collaborators collaborator_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'plan_collaborators_collaborator_id_fkey'
    AND table_name = 'plan_collaborators'
  ) THEN
    ALTER TABLE plan_collaborators DROP CONSTRAINT plan_collaborators_collaborator_id_fkey;
  END IF;
END $$;

ALTER TABLE plan_collaborators
  ADD CONSTRAINT plan_collaborators_collaborator_id_fkey
  FOREIGN KEY (collaborator_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;