const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/stats", protect, adminOnly, async (req, res) => {
    try {
        const [ordersResult, productsResult, customersResult, revenueResult] = await Promise.all([
            pool.query("SELECT COUNT(*)::int as count FROM orders"),
            pool.query("SELECT COUNT(*)::int as count FROM products"),
            pool.query("SELECT COUNT(*)::int as count FROM users WHERE role = 'customer'"),
            pool.query("SELECT COALESCE(SUM(total), 0)::numeric as total FROM orders WHERE status = 'delivered'"),
        ]);

        res.json({
            success: true,
            stats: {
                totalOrders: ordersResult.rows[0].count,
                totalProducts: productsResult.rows[0].count,
                totalCustomers: customersResult.rows[0].count,
                totalRevenue: parseFloat(revenueResult.rows[0].total),
            },
        });
    } catch (err) {
        console.error("Stats error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;