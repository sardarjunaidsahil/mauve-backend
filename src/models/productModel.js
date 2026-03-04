const pool = require("../config/db");

const productModel = {

    // Get all products with filters
    async getAll({ category, subCategory, sortBy, minPrice, maxPrice, sizes, limit = 20, offset = 0 }) {
        let conditions = ["p.is_active = TRUE"];
        const values = [];
        let i = 1;

        if (category) { conditions.push(`p.category = $${i++}`); values.push(category); }
        if (subCategory) { conditions.push(`p.sub_category = $${i++}`); values.push(subCategory); }
        if (minPrice) { conditions.push(`p.price >= $${i++}`); values.push(minPrice); }
        if (maxPrice) { conditions.push(`p.price <= $${i++}`); values.push(maxPrice); }
        if (sizes?.length) {
            conditions.push(`p.sizes && $${i++}::text[]`);
            values.push(sizes);
        }

        const orderMap = {
            "price_asc": "p.price ASC",
            "price_desc": "p.price DESC",
            "newest": "p.created_at DESC",
            "discount": "p.discount DESC",
            "default": "p.is_featured DESC, p.created_at DESC",
        };
        const order = orderMap[sortBy] || orderMap.default;
        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        const { rows } = await pool.query(
            `SELECT * FROM products p ${where} ORDER BY ${order}
             LIMIT $${i++} OFFSET $${i++}`,
            [...values, limit, offset]
        );

        const count = await pool.query(
            `SELECT COUNT(*) FROM products p ${where}`, values
        );

        return { products: rows, total: parseInt(count.rows[0].count) };
    },

    // Get single product by slug
    async findBySlug(slug) {
        const { rows } = await pool.query(
            `SELECT * FROM products WHERE slug = $1 AND is_active = TRUE`, [slug]
        );
        return rows[0] || null;
    },

    // Get by ID
    async findById(id) {
        const { rows } = await pool.query(
            `SELECT * FROM products WHERE id = $1`, [id]
        );
        return rows[0] || null;
    },

    // Create product
    async create(data) {
        const { name, slug, description, price, originalPrice, discount, category,
            subCategory, articleNo, modelInfo, images, sizes, colors, stock } = data;
        const { rows } = await pool.query(
            `INSERT INTO products
             (name, slug, description, price, original_price, discount, category,
              sub_category, article_no, model_info, images, sizes, colors, stock)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
             RETURNING *`,
            [name, slug, description, price, originalPrice, discount, category,
                subCategory, articleNo, modelInfo, images, sizes, colors, stock]
        );
        return rows[0];
    },

    // Update product
    async update(id, data) {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
        const { rows } = await pool.query(
            `UPDATE products SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );
        return rows[0] || null;
    },

    // Delete product
    async deleteProduct(id) {
        await pool.query(`DELETE FROM products WHERE id = $1`, [id]);
        return true;
    },

    // Featured products
    async getFeatured(limit = 8) {
        const { rows } = await pool.query(
            `SELECT * FROM products WHERE is_active = TRUE AND is_featured = TRUE
             ORDER BY created_at DESC LIMIT $1`, [limit]
        );
        return rows;
    },

    // New arrivals
    async getNewArrivals(limit = 8) {
        const { rows } = await pool.query(
            `SELECT * FROM products WHERE is_active = TRUE
             ORDER BY created_at DESC LIMIT $1`, [limit]
        );
        return rows;
    },
};

module.exports = productModel;