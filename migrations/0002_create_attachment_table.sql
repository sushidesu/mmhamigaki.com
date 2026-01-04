-- Migration: Create attachment table and recreate content table
-- This migration removes the type and storage_key columns from content
-- and creates a new attachment table for storing all content attachments

-- Drop existing content table
DROP TABLE IF EXISTS content;

-- Recreate content table without type and storage_key
CREATE TABLE content (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  published BOOLEAN NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER,
  tags TEXT DEFAULT '[]'
);

-- Create indexes for content table
CREATE INDEX idx_content_published ON content(published, created_at);
CREATE INDEX idx_content_slug ON content(slug);

-- Create attachment table
CREATE TABLE attachment (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  type TEXT NOT NULL,           -- 'post', 'music', 'illustration', 'video', 'live'
  storage_key TEXT,             -- R2 path for media files (images, audio, video)
  body TEXT,                    -- Text content (markdown for posts, lyrics for music, etc.)
  metadata TEXT DEFAULT '{}',   -- JSON: mimeType, aspectRatio, duration, width, height, alt, etc.
  order_index INTEGER NOT NULL, -- Display order (0-based, determines content type via first attachment)
  created_at INTEGER NOT NULL,
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
);

-- Create indexes for attachment table
CREATE INDEX idx_attachment_content ON attachment(content_id);
CREATE INDEX idx_attachment_order ON attachment(content_id, order_index);
CREATE INDEX idx_attachment_type ON attachment(content_id, type);
