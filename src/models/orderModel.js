const pool = require("../config/db");

const orderModel = {

    // Create order + items in transaction
    async create({ userId, items, pricing, address, paymentMethod, notes }) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Create order
            const { rows: [order] } = await client.query(
                `INSERT INTO orders
     (user_id, subtotal, shipping_fee, discount_amount, total,
      full_name, phone, address, city, province,
      payment_method, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
                [
                    userId,
                    pricing.subtotal,
                    pricing.shippingFee,      // ← shipping_fee column
                    pricing.discountAmount,   // ← discount_amount column
                    pricing.total,
                    address.fullName,         // ← full_name column
                    address.phone,
                    address.address,
                    address.city,
                    address.province,
                    paymentMethod,            // ← payment_method column
                    notes
                ]
            );

            // Insert order items
            for (const item of items) {
                await client.query(
                    `INSERT INTO order_items
                     (order_id, product_id, name, image, price, size, color, quantity, subtotal)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                    [order.id, item.productId, item.name, item.image,
                    item.price, item.size, item.color, item.quantity,
                    item.price * item.quantity]
                );
            }

            await client.query("COMMIT");
            return order;
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    },

    // Get order by ID with items
    async findById(id) {
        const { rows: [order] } = await pool.query(
            `SELECT * FROM orders WHERE id = $1`, [id]
        );
        if (!order) return null;

        const { rows: items } = await pool.query(
            `SELECT * FROM order_items WHERE order_id = $1`, [id]
        );
        return { ...order, items };
    },

    // Get user orders
    async findByUser(userId) {
        const { rows } = await pool.query(
            `SELECT o.*, 
                    json_agg(json_build_object(
                        'id', oi.id, 'name', oi.name,
                        'image', oi.image, 'price', oi.price,
                        'size', oi.size, 'color', oi.color,
                        'quantity', oi.quantity
                    )) AS items
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = $1
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [userId]
        );
        return rows;
    },

    // Update order status
    async updateStatus(id, status) {
        const { rows } = await pool.query(
            `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        );
        return rows[0] || null;
    },

    // Get all orders (admin)
    async getAll({ status, limit = 20, offset = 0 }) {
        const conditions = status ? `WHERE o.status = '${status}'` : "";
        const { rows } = await pool.query(
            `SELECT o.*, u.first_name, u.last_name, u.email
             FROM orders o LEFT JOIN users u ON o.user_id = u.id
             ${conditions}
             ORDER BY o.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        return rows;
    },
};

module.exports = orderModel;