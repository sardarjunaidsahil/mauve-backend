const orderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const pool = require("../config/db");
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require("../services/emailService");

// @POST /api/orders
const createOrder = async (req, res, next) => {
    try {
        const { items, pricing, address, paymentMethod = "cod", notes } = req.body;

        if (!items?.length || !pricing || !address)
            return res.status(400).json({ success: false, message: "items, pricing, address required" });
        if (!address.fullName || !address.phone || !address.address || !address.city || !address.province)
            return res.status(400).json({ success: false, message: "Complete address required" });

        const order = await orderModel.create({
            userId: req.user.id,
            items, pricing, address, paymentMethod, notes,
        });

        // Clear user cart after order
        await cartModel.clear(req.user.id);

        // Send confirmation email
        const { rows } = await pool.query(
            "SELECT email, first_name FROM users WHERE id=$1", [req.user.id]
        );
        if (rows[0]) {
            await sendOrderConfirmationEmail({
                to: rows[0].email,
                name: rows[0].first_name,
                order: {
                    ...order,
                    items,
                    full_name: address.fullName,
                    phone: address.phone,
                    address: address.address,
                    city: address.city,
                    province: address.province,
                    subtotal: pricing.subtotal,
                    shipping_fee: pricing.shippingFee,
                    discount_amount: pricing.discount,
                    total: pricing.total,
                },
            });
        }

        res.status(201).json({ success: true, order });
    } catch (err) { next(err); }
};

// @GET /api/orders
const getMyOrders = async (req, res, next) => {
    try {
        const orders = await orderModel.findByUser(req.user.id);
        res.json({ success: true, orders });
    } catch (err) { next(err); }
};

// @GET /api/orders/:id
const getOrder = async (req, res, next) => {
    try {
        const order = await orderModel.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        if (order.user_id !== req.user.id && req.user.role !== "admin")
            return res.status(403).json({ success: false, message: "Not authorized" });
        res.json({ success: true, order });
    } catch (err) { next(err); }
};

// @GET /api/orders/admin/all  (admin only)
const getAllOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const offset = (page - 1) * limit;

        const { rows } = await pool.query(
            `SELECT o.*, u.email, u.first_name || ' ' || u.last_name AS full_name, u.phone
             FROM orders o LEFT JOIN users u ON o.user_id = u.id
             ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        const count = await pool.query("SELECT COUNT(*) FROM orders");
        const total = parseInt(count.rows[0].count);

        // Attach items to each order
        const ordersWithItems = await Promise.all(rows.map(async (order) => {
            const items = await pool.query("SELECT * FROM order_items WHERE order_id=$1", [order.id]);
            return { ...order, items: items.rows };
        }));

        res.json({ success: true, orders: ordersWithItems, total, pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

// @PUT /api/orders/:id/status  (admin only) — sends email notification
const updateOrderStatus = async (req, res, next) => {
    try {
        const { status, tracking_no } = req.body;

        const { rows } = await pool.query(
            `UPDATE orders SET status=$1, tracking_no=COALESCE($2, tracking_no), updated_at=NOW()
             WHERE id=$3 RETURNING *`,
            [status, tracking_no || null, req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ success: false, message: "Order not found" });

        const order = rows[0];

        // Send status update email to customer
        const user = await pool.query(
            "SELECT email, first_name FROM users WHERE id=$1", [order.user_id]
        );
        if (user.rows[0]) {
            await sendOrderStatusEmail({
                to: user.rows[0].email,
                name: user.rows[0].first_name,
                order,
                newStatus: status,
                trackingNo: tracking_no || order.tracking_no,
            });
        }

        res.json({ success: true, order });
    } catch (err) { next(err); }
};

module.exports = { createOrder, getMyOrders, getOrder, getAllOrders, updateOrderStatus };