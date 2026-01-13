/*
  # Fix RLS policies to avoid auth.users access

  1. Changes
    - Update user_life_plans policies to not directly access auth.users table
    - Update plan_collaborators policies to not directly access auth.users table
    - Use auth.jwt() function to get user email instead

  2. Security
    - Maintains same security level
    - All existing functionality preserved
    - Removes permission errors when accessing plans

  3. Important Notes
    - Fixes "permission denied for table users" error
    - Users can still access their own plans and shared plans
    - Collaborators can still be matched by email
*/

-- Drop existing policies that access auth.users
DROP POLICY IF EXISTS "Collaborators can view their own entries" ON plan_collaborators;
DROP POLICY IF EXISTS "Users can read own or shared life plans" ON user_life_plans;
DROP POLICY IF EXISTS "Users can update own or edit-shared life plans" ON user_life_plans;

-- Recreate plan_collaborators policies without auth.users access
CREATE POLICY "Collaborators can view their own entries"
  ON plan_collaborators
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = collaborator_id 
    OR collaborator_email = (auth.jwt() ->> 'email')
  );

-- Recreate user_life_plans SELECT policy without auth.users access
CREATE POLICY "Users can read own or shared life plans"
  ON user_life_plans
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM plan_collaborators
      WHERE plan_collaborators.plan_id = user_life_plans.id
      AND (
        plan_collaborators.collaborator_id = auth.uid()
        OR plan_collaborators.collaborator_email = (auth.jwt() ->> 'email')
      )
    )
  );

-- Recreate user_life_plans UPDATE policy without auth.users access
CREATE POLICY "Users can update own or edit-shared life plans"
  ON user_life_plans
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM plan_collaborators
      WHERE plan_collaborators.plan_id = user_life_plans.id
      AND plan_collaborators.permission = 'edit'
      AND (
        plan_collaborators.collaborator_id = auth.uid()
        OR plan_collaborators.collaborator_email = (auth.jwt() ->> 'email')
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM plan_collaborators
      WHERE plan_collaborators.plan_id = user_life_plans.id
      AND plan_collaborators.permission = 'edit'
      AND (
        plan_collaborators.collaborator_id = auth.uid()
        OR plan_collaborators.collaborator_email = (auth.jwt() ->> 'email')
      )
    )
  );