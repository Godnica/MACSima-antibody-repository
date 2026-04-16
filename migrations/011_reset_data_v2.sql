-- Reset all data so seed.js re-populates from updated CSV files.
-- The antibodies CSV now includes current_vol and is semicolon-separated.
TRUNCATE TABLE experiment_antibodies, experiments, antibodies, laboratories, users CASCADE;
