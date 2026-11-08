CREATE TABLE IF NOT EXISTS content_items (
  collection TEXT NOT NULL,
  id TEXT NOT NULL,
  title TEXT NOT NULL,
  data_json TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection, id)
);

CREATE INDEX IF NOT EXISTS content_items_public_order
  ON content_items (collection, published, sort_order, title);
