-- Content table for managing all content types
CREATE TABLE content (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'post',
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  published BOOLEAN NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER,
  tags TEXT DEFAULT '[]',
  storage_key TEXT NOT NULL
);

CREATE INDEX idx_content_published ON content(published, published_at DESC);
CREATE INDEX idx_content_slug ON content(slug);
