const router = require("express").Router();
const { getProducts, getNewArrivals, getFeatured, getProduct, createProduct, updateProduct } = require("../controllers/productController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/", getProducts);
router.get("/new-arrivals", getNewArrivals);
router.get("/featured", getFeatured);
router.get("/:slugOrId", getProduct);
router.post("/", protect, adminOnly, upload.array("images", 5), createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, async (req, res, next) => {
    try {
        await require("../models/productModel").deleteProduct(req.params.id);
        res.json({ success: true, message: "Product deleted" });
    } catch (err) { next(err); }
}); 

module.exports = router;