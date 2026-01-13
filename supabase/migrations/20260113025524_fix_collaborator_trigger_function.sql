/*
  # Fix collaborator linking trigger function

  1. Changes
    - Update link_collaborator_on_signup function to use proper security context
    - Ensure function has necessary permissions to update plan_collaborators

  2. Security
    - Function runs with SECURITY DEFINER to have necessary permissions
    - Still maintains data integrity and security

  3. Important Notes
    - Fixes issues with collaborator linking on user signup
    - Maintains existing functionality
*/

-- Recreate the function with proper permissions
CREATE OR REPLACE FUNCTION link_collaborator_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Update plan_collaborators entries when a new user signs up
  -- This links their email to their user_id
  UPDATE plan_collaborators
  SET collaborator_id = NEW.id
  WHERE collaborator_email = NEW.email
  AND collaborator_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created_link_collaborator ON auth.users;

CREATE TRIGGER on_auth_user_created_link_collaborator
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION link_collaborator_on_signup();