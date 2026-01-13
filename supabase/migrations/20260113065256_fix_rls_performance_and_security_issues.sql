/*
  # Fix RLS Performance and Security Issues

  ## 1. RLS Policy Optimization
  All policies updated to use `(select auth.uid())` instead of `auth.uid()` to prevent
  re-evaluation for each row, significantly improving query performance at scale.

  ### Tables Updated:
  - `user_life_plans` - 4 policies optimized
  - `plan_collaborators` - 5 policies optimized  
  - `user_profiles` - 3 policies optimized

  ## 2. Remove Unused Indexes
  - Drop `idx_plan_collaborators_owner_id` (unused)
  - Drop `idx_user_profiles_user_id` (unused - unique constraint handles lookups)

  ## 3. Consolidate Multiple Permissive Policies
  - `plan_collaborators`: Merge two SELECT policies into one efficient policy
  - `user_profiles`: Merge two SELECT policies into one (authenticated users can read all)

  ## 4. Fix Function Security (Search Path)
  Add `SET search_path = public` to all functions to prevent search path manipulation:
  - `handle_new_user_profile`
  - `get_user_info`
  - `update_updated_at_column`
  - `link_collaborator_on_signup`

  ## Performance Impact
  - Reduces database load by caching auth function calls per query instead of per row
  - Eliminates redundant policy checks for better query planning
  - Improves security posture by fixing mutable search paths
*/

-- =====================================================
-- PART 1: Drop all existing policies that need updates
-- =====================================================

-- user_life_plans policies
DROP POLICY IF EXISTS "Users can insert own life plan" ON user_life_plans;
DROP POLICY IF EXISTS "Users can delete own life plan" ON user_life_plans;
DROP POLICY IF EXISTS "Users can read own or shared life plans" ON user_life_plans;
DROP POLICY IF EXISTS "Users can update own or edit-shared life plans" ON user_life_plans;

-- plan_collaborators policies
DROP POLICY IF EXISTS "Owners can view collaborators of their plans" ON plan_collaborators;
DROP POLICY IF EXISTS "Collaborators can view their own entries" ON plan_collaborators;
DROP POLICY IF EXISTS "Owners can add collaborators to their plans" ON plan_collaborators;
DROP POLICY IF EXISTS "Owners can update collaborators of their plans" ON plan_collaborators;
DROP POLICY IF EXISTS "Owners can remove collaborators from their plans" ON plan_collaborators;

-- user_profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON user_profiles;

-- =====================================================
-- PART 2: Create optimized policies for user_life_plans
-- =====================================================

CREATE POLICY "Users can read own or shared life plans"
  ON user_life_plans
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM plan_collaborators
      WHERE plan_collaborators.plan_id = user_life_plans.id
      AND (
        plan_collaborators.collaborator_id = (select auth.uid())
        OR plan_collaborators.collaborator_email = (
          SELECT email FROM auth.users WHERE id = (select auth.uid())
        )
      )
    )
  );

CREATE POLICY "Users can insert own life plan"
  ON user_life_plans
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

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
      AND (
        plan_collaborators.collaborator_id = (select auth.uid())
        OR plan_collaborators.collaborator_email = (
          SELECT email FROM auth.users WHERE id = (select auth.uid())
        )
      )
    )
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM plan_collaborators
      WHERE plan_collaborators.plan_id = user_life_plans.id
      AND plan_collaborators.permission = 'edit'
      AND (
        plan_collaborators.collaborator_id = (select auth.uid())
        OR plan_collaborators.collaborator_email = (
          SELECT email FROM auth.users WHERE id = (select auth.uid())
        )
      )
    )
  );

CREATE POLICY "Users can delete own life plan"
  ON user_life_plans
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- PART 3: Create optimized policies for plan_collaborators
-- =====================================================

-- Consolidated SELECT policy (combines owner and collaborator views)
CREATE POLICY "Users can view relevant collaborator entries"
  ON plan_collaborators
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = owner_id
    OR (select auth.uid()) = collaborator_id 
    OR collaborator_email = (
      SELECT email FROM auth.users WHERE id = (select auth.uid())
    )
  );

CREATE POLICY "Owners can add collaborators to their plans"
  ON plan_collaborators
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "Owners can update collaborators of their plans"
  ON plan_collaborators
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "Owners can remove collaborators from their plans"
  ON plan_collaborators
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = owner_id);

-- =====================================================
-- PART 4: Create optimized policies for user_profiles
-- =====================================================

-- Single consolidated SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- =====================================================
-- PART 5: Remove unused indexes
-- =====================================================

DROP INDEX IF EXISTS idx_plan_collaborators_owner_id;
DROP INDEX IF EXISTS idx_user_profiles_user_id;

-- =====================================================
-- PART 6: Fix function security (search path)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.email, 'ユーザー'));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION link_collaborator_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE plan_collaborators
  SET collaborator_id = NEW.id
  WHERE collaborator_email = NEW.email
  AND collaborator_id IS NULL;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_info(user_ids uuid[])
RETURNS TABLE (id uuid, email text, name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email::text, COALESCE(p.name, u.email::text) as name
  FROM auth.users u
  LEFT JOIN public.user_profiles p ON u.id = p.user_id
  WHERE u.id = ANY(user_ids);
END;
$$;