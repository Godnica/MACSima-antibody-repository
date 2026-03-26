DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'antibodies' AND column_name = 'panel'
  ) THEN
    ALTER TABLE antibodies RENAME COLUMN panel TO status;
  END IF;
END $$;

ALTER TABLE antibodies ALTER COLUMN status TYPE VARCHAR(20);
