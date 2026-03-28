-- Content items (base table for all content types)
CREATE TABLE content_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('blog', 'audio', 'video', 'stream')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_content_items_type ON content_items (type);
CREATE INDEX idx_content_items_status ON content_items (status);
CREATE INDEX idx_content_items_slug ON content_items (slug);

-- Blog posts (blog-specific data)
CREATE TABLE blog_posts (
  content_id TEXT PRIMARY KEY REFERENCES content_items (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT
);

-- Tags
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

-- Content tags (M:N)
CREATE TABLE content_tags (
  content_id TEXT NOT NULL REFERENCES content_items (id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_id)
);
