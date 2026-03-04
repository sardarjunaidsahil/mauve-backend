CREATE TABLE IF NOT EXISTS orders (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
    payment_method  VARCHAR(20) NOT NULL DEFAULT 'cod'
                    CHECK (payment_method IN ('cod', 'card', 'baadmay')),
    payment_status  VARCHAR(20) NOT NULL DEFAULT 'unpaid'
                    CHECK (payment_status IN ('unpaid','paid','refunded')),

    -- Pricing
    subtotal        INTEGER     NOT NULL,
    shipping_fee    INTEGER     NOT NULL DEFAULT 0,
    discount_amount INTEGER     NOT NULL DEFAULT 0,
    total           INTEGER     NOT NULL,

    -- Shipping address (snapshot at order time)
    full_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20)  NOT NULL,
    address         TEXT         NOT NULL,
    city            VARCHAR(100) NOT NULL,
    province        VARCHAR(100) NOT NULL,

    notes           TEXT,
    tracking_no     VARCHAR(100),
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id    UUID    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id  UUID    REFERENCES products(id) ON DELETE SET NULL,

    -- Snapshot at order time
    name        VARCHAR(255) NOT NULL,
    image       TEXT         NOT NULL,
    price       INTEGER      NOT NULL,
    size        VARCHAR(20)  NOT NULL,
    color       VARCHAR(50)  NOT NULL,
    quantity    INTEGER      NOT NULL CHECK (quantity > 0),
    subtotal    INTEGER      NOT NULL
);

CREATE INDEX idx_orders_user_id   ON orders(user_id);
CREATE INDEX idx_orders_status    ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at();