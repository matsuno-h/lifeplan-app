/*
  # Create plan collaborators table for shared editing

  1. New Tables
    - `plan_collaborators`
      - `id` (uuid, primary key) - Unique identifier for each collaboration
      - `plan_id` (uuid, foreign key to user_life_plans) - The plan being shared
      - `owner_id` (uuid, foreign key to auth.users) - Owner of the plan
      - `collaborator_id` (uuid, foreign key to auth.users) - User with access
      - `collaborator_email` (text) - Email of the collaborator
      - `permission` (text) - Either 'view' or 'edit'
      - `created_at` (timestamptz) - When the collaboration was created
      - `updated_at` (timestamptz) - When the collaboration was last updated

  2. Security
    - Enable RLS on `plan_collaborators` table
    - Owners can manage collaborators for their plans
    - Collaborators can view their own collaboration entries
    - Update user_life_plans policies to allow collaborators access

  3. Important Notes
    - Each plan can have multiple collaborators
    - Collaborators can have either 'view' or 'edit' permission
    - When a plan is deleted, all collaborator entries are also deleted
*/

CREATE TABLE IF NOT EXISTS plan_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES user_life_plans(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  collaborator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  collaborator_email text NOT NULL,
  permission text NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(plan_id, collaborator_email)
);

ALTER TABLE plan_collaborators ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_plan_collaborators_plan_id ON plan_collaborators(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_collaborators_collaborator_id ON plan_collaborators(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_plan_collaborators_collaborator_email ON plan_collaborators(collaborator_email);
CREATE INDEX IF NOT EXISTS idx_plan_collaborators_owner_id ON plan_collaborators(owner_id);

CREATE POLICY "Owners can view collaborators of their plans"
  ON plan_collaborators
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Collaborators can view their own entries"
  ON plan_collaborators
  FOR SELECT
  TO authenticated
  USING (auth.uid() = collaborator_id OR collaborator_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Owners can add collaborators to their plans"
  ON plan_collaborators
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update collaborators of their plans"
  ON plan_collaborators
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can remove collaborators from their plans"
  ON plan_collaborators
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can read own life plan" ON user_life_plans;

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
        OR plan_collaborators.collaborator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can update own life plan" ON user_life_plans;

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
        OR plan_collaborators.collaborator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
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
        OR plan_collaborators.collaborator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

CREATE TRIGGER update_plan_collaborators_updated_at
  BEFORE UPDATE ON plan_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION link_collaborator_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE plan_collaborators
  SET collaborator_id = NEW.id
  WHERE collaborator_email = NEW.email
  AND collaborator_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_link_collaborator ON auth.users;

CREATE TRIGGER on_auth_user_created_link_collaborator
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION link_collaborator_on_signup();
