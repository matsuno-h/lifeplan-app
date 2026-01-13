/*
  # Fix auth.users Access in RLS Policies

  ## Problem
  RLS policies cannot directly query auth.users table due to permission restrictions.
  This causes "permission denied for table users" errors when trying to save data.

  ## Solution
  Remove direct auth.users queries from RLS policies. Since the `link_collaborator_on_signup` 
  trigger automatically updates collaborator_id when a user signs up, we can rely solely on 
  collaborator_id checks instead of also checking collaborator_email against auth.users.

  ## Changes
  - Update user_life_plans SELECT policy to only check collaborator_id
  - Update user_life_plans UPDATE policy to only check collaborator_id
  - Update plan_collaborators SELECT policy to only check collaborator_id

  ## Impact
  - Fixes data save issues
  - Maintains security through collaborator_id checks
  - Collaborators are automatically linked via signup trigger
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own or shared life plans" ON user_life_plans;
DROP POLICY IF EXISTS "Users can update own or edit-shared life plans" ON user_life_plans;
DROP POLICY IF EXISTS "Users can view relevant collaborator entries" ON plan_collaborators;

-- =====================================================
-- Recreate policies without auth.users access
-- =====================================================

-- user_life_plans: SELECT policy
CREATE POLICY "Users can read own or shared life plans"
  ON user_life_plans
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM plan_collaborators
      WHERE plan_collaborators.plan_id = user_life_plans.id
      AND plan_collaborators.collaborator_id = (select auth.uid())
    )
  );

-- user_life_plans: UPDATE policy
CREATE POLICY "Users can update own or edit-shared life plans"
  ON user_life_plans
  FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM plan_collaborators
      WHERE plan_collaborators.plan_id = user_life_plans.id
      AND plan_collaborators.permission = 'edit'
      AND plan_collaborators.collaborator_id = (select auth.uid())
    )
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM plan_collaborators
      WHERE plan_collaborators.plan_id = user_life_plans.id
      AND plan_collaborators.permission = 'edit'
      AND plan_collaborators.collaborator_id = (select auth.uid())
    )
  );

-- plan_collaborators: SELECT policy
CREATE POLICY "Users can view relevant collaborator entries"
  ON plan_collaborators
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = owner_id
    OR (select auth.uid()) = collaborator_id
  );