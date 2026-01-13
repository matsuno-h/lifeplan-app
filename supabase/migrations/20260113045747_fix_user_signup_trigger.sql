/*
  # Fix user signup trigger to prevent registration errors

  1. Changes
    - Recreate link_collaborator_on_signup function with exception handling
    - Ensure that any errors in the trigger don't prevent user registration
    - Add logging for debugging purposes

  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Exception handling ensures registration always succeeds

  3. Important Notes
    - If collaborator linking fails, user registration will still succeed
    - Errors are caught and logged but don't block the signup process
*/

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created_link_collaborator ON auth.users;

-- Recreate function with exception handling
CREATE OR REPLACE FUNCTION link_collaborator_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to link collaborator entries, but don't fail if there's an error
  BEGIN
    UPDATE plan_collaborators
    SET collaborator_id = NEW.id
    WHERE collaborator_email = NEW.email
    AND collaborator_id IS NULL;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't prevent user creation
      RAISE WARNING 'Failed to link collaborator on signup for email %: %', NEW.email, SQLERRM;
  END;
  
  -- Always return NEW to allow user creation to proceed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created_link_collaborator
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION link_collaborator_on_signup();