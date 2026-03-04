const router = require("express").Router();
const { getProfile, updateProfile } = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const pool = require("../config/db");

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Admin — all customers list
router.get("/admin/all", protect, adminOnly, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const offset = (page - 1) * limit;

        const { rows } = await pool.query(
            `SELECT id, first_name, last_name, email, phone, role, created_at
             FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        const count = await pool.query(`SELECT COUNT(*) FROM users`);
        const total = parseInt(count.rows[0].count);

        res.json({ success: true, users: rows, total, pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
});

module.exports = router;