const router = require("express").Router();
const { getCart, addItem, updateItem, removeItem, clearCart } = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getCart);
router.post("/", protect, addItem);
router.put("/:itemId", protect, updateItem);
router.delete("/:itemId", protect, removeItem);
router.delete("/", protect, clearCart);

module.exports = router;