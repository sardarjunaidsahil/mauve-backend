CREATE TABLE IF NOT EXISTS cart (
    id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID    NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
    id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id     UUID    NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
    product_id  UUID    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size        VARCHAR(20) NOT NULL,
    color       VARCHAR(50) NOT NULL,
    quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(cart_id, product_id, size, color)
);

CREATE INDEX idx_cart_user       ON cart(user_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

CREATE TRIGGER cart_updated_at
BEFORE UPDATE ON cart
FOR EACH ROW EXECUTE FUNCTION update_updated_at();