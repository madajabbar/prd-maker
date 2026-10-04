CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'id',
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
