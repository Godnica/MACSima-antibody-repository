-- Historical local reset migration.
-- Kept as a no-op so fresh production databases never delete user data.
DO $$
BEGIN
  IF current_setting('app.allow_destructive_migrations', true) = 'true' THEN
    TRUNCATE TABLE experiment_antibodies, experiments, antibodies, laboratories, users CASCADE;
  END IF;
END $$;
