-- Add antibody_code column: an integer that groups vials representing the same
-- antibody across different tube numbers (e.g. one code for all backups).
-- NOT UNIQUE — the same code can appear on multiple rows by design.
ALTER TABLE antibodies ADD COLUMN IF NOT EXISTS antibody_code INTEGER;

-- Reset all data so seed.js re-populates from the updated CSV
-- (which now includes the antibody_code column).
-- Historical local reset, disabled by default for production safety.
DO $$
BEGIN
  IF current_setting('app.allow_destructive_migrations', true) = 'true' THEN
    TRUNCATE TABLE experiment_antibodies, experiments, antibodies, laboratories, users CASCADE;
  END IF;
END $$;
