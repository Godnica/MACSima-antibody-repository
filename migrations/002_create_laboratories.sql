CREATE TABLE IF NOT EXISTS laboratories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  pi_name VARCHAR(255),
  email VARCHAR(255),
  billing_address TEXT
);
