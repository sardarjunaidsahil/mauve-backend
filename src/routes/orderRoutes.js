const router = require("express").Router();
const { createOrder, getMyOrders, getOrder, getAllOrders, updateOrderStatus } = require("../controllers/orderController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/", protect, createOrder);
router.get("/", protect, getMyOrders);
router.get("/admin/all", protect, adminOnly, getAllOrders);
router.get("/:id", protect, getOrder);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

module.exports = router;