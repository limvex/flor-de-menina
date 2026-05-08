-- Habilita extensão de busca por trigrama (similaridade textual)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice trigrama no nome do produto (busca por texto livre)
CREATE INDEX IF NOT EXISTS idx_product_name_trgm
  ON "Product" USING gin (name gin_trgm_ops);

-- Índice trigrama na descrição do produto
CREATE INDEX IF NOT EXISTS idx_product_description_trgm
  ON "Product" USING gin (description gin_trgm_ops);

-- Índice composto para filtros do catálogo público
CREATE INDEX IF NOT EXISTS idx_product_active_deleted
  ON "Product" ("isActive", "deletedAt") WHERE "deletedAt" IS NULL;
