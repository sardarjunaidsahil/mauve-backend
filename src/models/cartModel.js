const pool = require("../config/db");

const cartModel = {

    // Get or create cart for user
    async getOrCreate(userId) {
        let { rows } = await pool.query(
            `SELECT * FROM cart WHERE user_id = $1`, [userId]
        );
        if (!rows[0]) {
            const res = await pool.query(
                `INSERT INTO cart (user_id) VALUES ($1) RETURNING *`, [userId]
            );
            rows = res.rows;
        }
        return rows[0];
    },

    // Get cart with items + product details
    async getWithItems(userId) {
        const cart = await cartModel.getOrCreate(userId);
        const { rows } = await pool.query(
            `SELECT ci.id, ci.quantity, ci.size, ci.color,
                    p.id AS product_id, p.name, p.price, p.original_price,
                    p.discount, p.images, p.slug
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.cart_id = $1`,
            [cart.id]
        );
        return { cartId: cart.id, items: rows };
    },

    // Add or update item
    async addItem(userId, { productId, size, color, quantity }) {
        const cart = await cartModel.getOrCreate(userId);
        const { rows } = await pool.query(
            `INSERT INTO cart_items (cart_id, product_id, size, color, quantity)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (cart_id, product_id, size, color)
             DO UPDATE SET quantity = cart_items.quantity + $5
             RETURNING *`,
            [cart.id, productId, size, color, quantity]
        );
        return rows[0];
    },

    // Update quantity
    async updateItem(userId, itemId, quantity) {
        const cart = await cartModel.getOrCreate(userId);
        if (quantity < 1) return cartModel.removeItem(userId, itemId);
        const { rows } = await pool.query(
            `UPDATE cart_items SET quantity = $1
             WHERE id = $2 AND cart_id = $3 RETURNING *`,
            [quantity, itemId, cart.id]
        );
        return rows[0] || null;
    },

    // Remove item
    async removeItem(userId, itemId) {
        const cart = await cartModel.getOrCreate(userId);
        await pool.query(
            `DELETE FROM cart_items WHERE id = $1 AND cart_id = $2`,
            [itemId, cart.id]
        );
    },

    // Clear cart
    async clear(userId) {
        const cart = await cartModel.getOrCreate(userId);
        await pool.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cart.id]);
    },
};

module.exports = cartModel;