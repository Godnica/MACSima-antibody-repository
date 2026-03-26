CREATE TABLE IF NOT EXISTS experiments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE,
  requesting_lab_id INTEGER REFERENCES laboratories(id),
  status VARCHAR(30) NOT NULL DEFAULT 'planning',
  macswell_slides INTEGER,
  total_cocktail_volume NUMERIC(10,2),
  experiment_type VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
