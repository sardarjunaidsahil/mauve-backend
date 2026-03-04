const pool = require("../config/db");

const userModel = {

    // Create user
    async create({ firstName, lastName, email, password, phone }) {
        const { rows } = await pool.query(
            `INSERT INTO users (first_name, last_name, email, password, phone)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, first_name, last_name, email, phone, role, created_at`,
            [firstName, lastName, email, password, phone || null]
        );
        return rows[0];
    },

    // Find by email (includes password for auth)
    async findByEmail(email) {
        const { rows } = await pool.query(
            `SELECT * FROM users WHERE email = $1`, [email]
        );
        return rows[0] || null;
    },

    // Find by ID (no password)
    async findById(id) {
        const { rows } = await pool.query(
            `SELECT id, first_name, last_name, email, phone, role, created_at
             FROM users WHERE id = $1`, [id]
        );
        return rows[0] || null;
    },

    // Update profile
    async update(id, { firstName, lastName, phone }) {
        const { rows } = await pool.query(
            `UPDATE users SET first_name=$1, last_name=$2, phone=$3
             WHERE id=$4
             RETURNING id, first_name, last_name, email, phone, role`,
            [firstName, lastName, phone, id]
        );
        return rows[0] || null;
    },

    // Update password
    async updatePassword(id, hashedPassword) {
        await pool.query(
            `UPDATE users SET password=$1 WHERE id=$2`,
            [hashedPassword, id]
        );
    },
};

module.exports = userModel;