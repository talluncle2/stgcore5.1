DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

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

CREATE POLICY "Public profiles are readable"
  ON profiles FOR SELECT
  USING (true);
