CREATE TABLE IF NOT EXISTS experiment_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  requesting_lab_id INTEGER REFERENCES laboratories(id) ON DELETE SET NULL,
  experiment_type VARCHAR(255),
  macswell_slides INTEGER,
  total_cocktail_volume NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS experiment_template_antibodies (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES experiment_templates(id) ON DELETE CASCADE,
  antibody_id INTEGER NOT NULL REFERENCES antibodies(id) ON DELETE CASCADE,
  titration_ratio INTEGER NOT NULL,
  UNIQUE(template_id, antibody_id)
);
