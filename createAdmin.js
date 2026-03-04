require("dotenv").config();
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function createAdmin() {
    const email = "admin@mauve.com";   // ← Admin email
    const password = "Mauve@Admin123";    // ← Admin password
    const firstName = "Admin";
    const lastName = "MAUVE";

    try {
        const hash = await bcrypt.hash(password, 12);

        await pool.query(`
            INSERT INTO users (first_name, last_name, email, password, role)
            VALUES ($1, $2, $3, $4, 'admin')
            ON CONFLICT (email)
            DO UPDATE SET password = $4, role = 'admin', first_name = $1, last_name = $2
        `, [firstName, lastName, email, hash]);

        console.log("✅ Admin created successfully!");
        console.log("📧 Email:   ", email);
        console.log("🔑 Password:", password);
        console.log("👤 Role:     admin");
    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        pool.end();
    }
}

createAdmin();