const productModel = require("../models/productModel");
const cloudinary = require("../config/cloudinary");

// Helper — images field ko hamesha array banao
const parseImages = (images) => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    try { return JSON.parse(images); } catch { return [images]; }
};

// @GET /api/products
const getProducts = async (req, res, next) => {
    try {
        const { category, subCategory, sortBy, minPrice, maxPrice, sizes, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const result = await productModel.getAll({
            category,
            subCategory,
            sortBy,
            minPrice: minPrice ? parseInt(minPrice) : null,
            maxPrice: maxPrice ? parseInt(maxPrice) : null,
            sizes: sizes ? sizes.split(",") : null,
            limit: parseInt(limit),
            offset,
        });

        res.json({
            success: true,
            products: result.products.map(p => ({ ...p, images: parseImages(p.images) })),
            total: result.total,
            page: parseInt(page),
            pages: Math.ceil(result.total / limit),
        });
    } catch (err) {
        next(err);
    }
};

// @GET /api/products/new-arrivals
const getNewArrivals = async (req, res, next) => {
    try {
        const products = await productModel.getNewArrivals(req.query.limit || 8);
        res.json({
            success: true,
            products: products.map(p => ({ ...p, images: parseImages(p.images) })),
        });
    } catch (err) {
        next(err);
    }
};

// @GET /api/products/featured
const getFeatured = async (req, res, next) => {
    try {
        const products = await productModel.getFeatured(req.query.limit || 8);
        res.json({
            success: true,
            products: products.map(p => ({ ...p, images: parseImages(p.images) })),
        });
    } catch (err) {
        next(err);
    }
};

// UUID check helper
const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// @GET /api/products/:slugOrId
const getProduct = async (req, res, next) => {
    try {
        const { slugOrId } = req.params;
        let product;

        if (isUUID(slugOrId)) {
            product = await productModel.findById(slugOrId);
        } else {
            product = await productModel.findBySlug(slugOrId);
        }

        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        res.json({ success: true, product: { ...product, images: parseImages(product.images) } });
    } catch (err) {
        next(err);
    }
};

// @POST /api/products  (admin)
const createProduct = async (req, res, next) => {
    try {
        const { name, description, price, originalPrice, discount, category,
            subCategory, articleNo, modelInfo, sizes, colors, stock } = req.body;

        if (!name || !price || !category || !subCategory) {
            return res.status(400).json({ success: false, message: "name, price, category, subCategory required" });
        }

        // Cloudinary file upload ya direct URL dono support
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map((f) => f.path);
        } else if (req.body.images) {
            images = parseImages(req.body.images);
        }

        const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();

        const product = await productModel.create({
            name, slug, description, price: parseInt(price),
            originalPrice: parseInt(originalPrice) || parseInt(price),
            discount: parseInt(discount) || 0,
            category, subCategory, articleNo, modelInfo,
            images: images,
            sizes: typeof sizes === "string" ? sizes.split(",") : sizes,
            colors: typeof colors === "string" ? colors.split(",") : colors,
            stock: parseInt(stock) || 0,
        });

        res.status(201).json({ success: true, product: { ...product, images: parseImages(product.images) } });
    } catch (err) {
        next(err);
    }
};

// @PUT /api/products/:id  (admin)
const updateProduct = async (req, res, next) => {
    try {
        const product = await productModel.update(req.params.id, req.body);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        res.json({ success: true, product: { ...product, images: parseImages(product.images) } });
    } catch (err) {
        next(err);
    }
};

module.exports = { getProducts, getNewArrivals, getFeatured, getProduct, createProduct, updateProduct };