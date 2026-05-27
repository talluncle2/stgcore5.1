/*
  # Fix RLS infinite recursion issue

  1. Remove the problematic admin policy that causes infinite recursion
  2. Create a simpler, non-recursive policy
  
  The issue was that the policy tried to SELECT from profiles 
  within its own USING clause, causing infinite recursion.
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Create a simpler policy that uses auth metadata instead
CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    (
      SELECT (raw_user_meta_data->>'role')::text IN ('admin', 'moderator')
      FROM auth.users
      WHERE id = auth.uid()
    ) IS TRUE
  );

-- Also add a public read policy for rankings and such
CREATE POLICY "Public profiles are readable"
  ON profiles FOR SELECT
  USING (true);
