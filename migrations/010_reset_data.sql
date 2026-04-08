-- Reset all data so seed.js re-populates from updated CSV files.
-- Tables are dropped in dependency order and recreated by prior migrations
-- that will re-run after _migrations is cleared.
--
-- This migration truncates all data tables (preserving schema)
-- and clears the users table so seed.js detects a fresh database.
TRUNCATE TABLE experiment_antibodies, experiments, antibodies, laboratories, users CASCADE;
