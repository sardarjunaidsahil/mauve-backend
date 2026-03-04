const cartModel = require("../models/cartModel");

// @GET /api/cart
const getCart = async (req, res, next) => {
    try {
        const cart = await cartModel.getWithItems(req.user.id);
        res.json({ success: true, ...cart });
    } catch (err) { next(err); }
};

// @POST /api/cart
const addItem = async (req, res, next) => {
    try {
        const { productId, size, color, quantity = 1 } = req.body;
        if (!productId || !size || !color) {
            return res.status(400).json({ success: false, message: "productId, size, color required" });
        }
        const item = await cartModel.addItem(req.user.id, { productId, size, color, quantity });
        res.status(201).json({ success: true, item });
    } catch (err) { next(err); }
};

// @PUT /api/cart/:itemId
const updateItem = async (req, res, next) => {
    try {
        const { quantity } = req.body;
        if (!quantity) return res.status(400).json({ success: false, message: "quantity required" });
        const item = await cartModel.updateItem(req.user.id, req.params.itemId, parseInt(quantity));
        res.json({ success: true, item });
    } catch (err) { next(err); }
};

// @DELETE /api/cart/:itemId
const removeItem = async (req, res, next) => {
    try {
        await cartModel.removeItem(req.user.id, req.params.itemId);
        res.json({ success: true, message: "Item removed" });
    } catch (err) { next(err); }
};

// @DELETE /api/cart
const clearCart = async (req, res, next) => {
    try {
        await cartModel.clear(req.user.id);
        res.json({ success: true, message: "Cart cleared" });
    } catch (err) { next(err); }
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };