-- Reset all data so seed.js re-populates from the CSV with the corrected
-- current_volume handling (explicit 0 in CSV must be preserved as 0).
TRUNCATE TABLE experiment_antibodies, experiments, antibodies, laboratories, users CASCADE;
