/*
  # Add function to get user emails safely

  1. New Functions
    - `get_user_emails` - Returns email addresses for given user IDs
      - Takes an array of user IDs as input
      - Returns a table with id and email columns
      - Uses SECURITY DEFINER to bypass RLS on auth.users

  2. Security
    - Function runs with SECURITY DEFINER to access auth.users
    - Only returns id and email, no other sensitive information
    - Can be called by authenticated users

  3. Important Notes
    - This allows safe access to user emails without exposing auth.users directly
    - Used for displaying owner information in shared plans
*/

CREATE OR REPLACE FUNCTION get_user_emails(user_ids uuid[])
RETURNS TABLE (id uuid, email text) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email::text
  FROM auth.users u
  WHERE u.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;