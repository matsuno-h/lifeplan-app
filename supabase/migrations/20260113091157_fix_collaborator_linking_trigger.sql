/*
  # Fix collaborator linking trigger with exception handling

  1. Changes
    - Add exception handling to link_collaborator_on_signup function
    - Ensure that any errors in the trigger don't prevent user registration
    - Add logging for debugging purposes

  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Exception handling ensures registration always succeeds

  3. Important Notes
    - If collaborator linking fails, user registration will still succeed
    - Errors are caught and logged but don't block the signup process
    - Maintains search_path security from previous migration
*/

CREATE OR REPLACE FUNCTION link_collaborator_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
