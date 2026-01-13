/*
  # Add cascade delete for account deletion

  1. Changes
    - Update plan_collaborators foreign key constraint to cascade on delete
    - This ensures that when a user_life_plan is deleted, all associated collaborator entries are also deleted

  2. Important Notes
    - When a user deletes their account, their life plans are deleted first
    - Cascade delete ensures collaborator entries are automatically removed
    - This prevents orphaned data in the database
*/

-- Drop existing foreign key constraint
ALTER TABLE plan_collaborators
DROP CONSTRAINT IF EXISTS plan_collaborators_plan_id_fkey;

-- Recreate with CASCADE delete
ALTER TABLE plan_collaborators
ADD CONSTRAINT plan_collaborators_plan_id_fkey
FOREIGN KEY (plan_id)
REFERENCES user_life_plans(id)
ON DELETE CASCADE;
