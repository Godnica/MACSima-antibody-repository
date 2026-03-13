CREATE TABLE IF NOT EXISTS experiment_antibodies (
  id SERIAL PRIMARY KEY,
  experiment_id INTEGER NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  antibody_id INTEGER NOT NULL REFERENCES antibodies(id),
  titration_ratio INTEGER NOT NULL,
  ul_per_slide NUMERIC(10,4),
  total_ul_used NUMERIC(10,4),
  total_chf NUMERIC(10,4),
  UNIQUE(experiment_id, antibody_id)
);
