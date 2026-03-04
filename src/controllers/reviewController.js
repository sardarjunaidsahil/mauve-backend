const pool = require("../config/db");

// @GET /api/reviews/:productId — Get all reviews for a product
const getProductReviews = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { rows } = await pool.query(
            `SELECT r.*, u.first_name, u.last_name,
                    LEFT(u.first_name, 1) || LEFT(u.last_name, 1) AS initials
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.product_id = $1
             ORDER BY r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [productId, limit, offset]
        );

        const count = await pool.query(
            "SELECT COUNT(*) FROM reviews WHERE product_id=$1", [productId]
        );

        // Rating summary
        const summary = await pool.query(
            `SELECT
                COUNT(*) AS total,
                ROUND(AVG(rating), 1) AS average,
                COUNT(*) FILTER (WHERE rating=5) AS five,
                COUNT(*) FILTER (WHERE rating=4) AS four,
                COUNT(*) FILTER (WHERE rating=3) AS three,
                COUNT(*) FILTER (WHERE rating=2) AS two,
                COUNT(*) FILTER (WHERE rating=1) AS one
             FROM reviews WHERE product_id=$1`,
            [productId]
        );

        res.json({
            success: true,
            reviews: rows,
            total: parseInt(count.rows[0].count),
            pages: Math.ceil(parseInt(count.rows[0].count) / limit),
            summary: summary.rows[0],
        });
    } catch (err) { next(err); }
};

// @POST /api/reviews/:productId — Add a review (logged in users)
const addReview = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { rating, title, body } = req.body;
        const userId = req.user.id;

        if (!rating || rating < 1 || rating > 5)
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
        if (!body?.trim())
            return res.status(400).json({ success: false, message: "Review text is required" });

        // Check if product exists
        const product = await pool.query("SELECT id FROM products WHERE id=$1", [productId]);
        if (!product.rows[0])
            return res.status(404).json({ success: false, message: "Product not found" });

        // One review per user per product
        const existing = await pool.query(
            "SELECT id FROM reviews WHERE user_id=$1 AND product_id=$2",
            [userId, productId]
        );
        if (existing.rows[0])
            return res.status(409).json({ success: false, message: "You have already reviewed this product" });

        const { rows } = await pool.query(
            `INSERT INTO reviews (user_id, product_id, rating, title, body)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [userId, productId, rating, title?.trim() || null, body.trim()]
        );

        // Update product average rating
        await updateProductRating(productId);

        // Return with user info
        const userInfo = await pool.query(
            "SELECT first_name, last_name FROM users WHERE id=$1", [userId]
        );
        const u = userInfo.rows[0];

        res.status(201).json({
            success: true,
            review: {
                ...rows[0],
                first_name: u.first_name,
                last_name: u.last_name,
                initials: `${u.first_name[0]}${u.last_name?.[0] || ""}`,
            },
        });
    } catch (err) { next(err); }
};

// @PUT /api/reviews/:reviewId — Edit own review
const updateReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const { rating, title, body } = req.body;
        const userId = req.user.id;

        if (!rating || rating < 1 || rating > 5)
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
        if (!body?.trim())
            return res.status(400).json({ success: false, message: "Review text is required" });

        const { rows } = await pool.query(
            `UPDATE reviews SET rating=$1, title=$2, body=$3, updated_at=NOW()
             WHERE id=$4 AND user_id=$5 RETURNING *`,
            [rating, title?.trim() || null, body.trim(), reviewId, userId]
        );
        if (!rows[0])
            return res.status(404).json({ success: false, message: "Review not found or not authorized" });

        await updateProductRating(rows[0].product_id);
        res.json({ success: true, review: rows[0] });
    } catch (err) { next(err); }
};

// @DELETE /api/reviews/:reviewId — Delete own review (or admin)
const deleteReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === "admin";

        const query = isAdmin
            ? "DELETE FROM reviews WHERE id=$1 RETURNING *"
            : "DELETE FROM reviews WHERE id=$1 AND user_id=$2 RETURNING *";
        const params = isAdmin ? [reviewId] : [reviewId, userId];

        const { rows } = await pool.query(query, params);
        if (!rows[0])
            return res.status(404).json({ success: false, message: "Review not found or not authorized" });

        await updateProductRating(rows[0].product_id);
        res.json({ success: true, message: "Review deleted" });
    } catch (err) { next(err); }
};

// @GET /api/reviews/my — Get current user's reviews
const getMyReviews = async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT r.*, p.name AS product_name, p.slug, p.images
             FROM reviews r
             JOIN products p ON r.product_id = p.id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, reviews: rows });
    } catch (err) { next(err); }
};

// Helper: recalculate product avg rating
const updateProductRating = async (productId) => {
    await pool.query(
        `UPDATE products SET
            rating = (SELECT ROUND(AVG(rating),1) FROM reviews WHERE product_id=$1),
            review_count = (SELECT COUNT(*) FROM reviews WHERE product_id=$1)
         WHERE id=$1`,
        [productId]
    );
};

module.exports = { getProductReviews, addReview, updateReview, deleteReview, getMyReviews };