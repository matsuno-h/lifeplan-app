/*
  # Update get_user_emails function to include names

  1. Changes
    - Update `get_user_emails` function to also return user names from user_profiles
    - Rename to `get_user_info` to better reflect its purpose

  2. Returns
    - id (uuid) - User ID
    - email (text) - User email
    - name (text) - User display name
*/

-- Drop the old function
DROP FUNCTION IF EXISTS get_user_emails(uuid[]);

-- Create new function that returns email and name
CREATE OR REPLACE FUNCTION get_user_info(user_ids uuid[])
RETURNS TABLE (id uuid, email text, name text) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email::text, COALESCE(p.name, u.email::text) as name
  FROM auth.users u
  LEFT JOIN public.user_profiles p ON u.id = p.user_id
  WHERE u.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;