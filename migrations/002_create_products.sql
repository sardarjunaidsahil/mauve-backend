CREATE TABLE IF NOT EXISTS products (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    description     TEXT,
    price           INTEGER      NOT NULL,   -- stored in paisa (PKR * 100)
    original_price  INTEGER      NOT NULL,
    discount        INTEGER      NOT NULL DEFAULT 0,
    category        VARCHAR(50)  NOT NULL,   -- men, women, footwear, accessories
    sub_category    VARCHAR(100) NOT NULL,
    article_no      VARCHAR(50),
    model_info      VARCHAR(255),
    images          TEXT[]       NOT NULL DEFAULT '{}',
    sizes           TEXT[]       NOT NULL DEFAULT '{}',
    colors          TEXT[]       NOT NULL DEFAULT '{}',
    stock           INTEGER      NOT NULL DEFAULT 0,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    is_featured     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category     ON products(category);
CREATE INDEX idx_products_sub_category ON products(sub_category);
CREATE INDEX idx_products_is_active    ON products(is_active);
CREATE INDEX idx_products_slug         ON products(slug);

CREATE TRIGGER products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at();