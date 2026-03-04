const router = require("express").Router();
const { getProductReviews, addReview, updateReview, deleteReview, getMyReviews } = require("../controllers/reviewController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/my", protect, getMyReviews);
router.get("/:productId", getProductReviews);
router.post("/:productId", protect, addReview);
router.put("/:reviewId", protect, updateReview);
router.delete("/:reviewId", protect, deleteReview);

module.exports = router;