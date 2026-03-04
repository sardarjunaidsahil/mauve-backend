require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

// ── Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Routes ───────────────────────────────────────────────────────────
const loadRoute = (routePath, mountPath) => {
    try {
        const route = require(path.join(__dirname, routePath));
        if (typeof route !== "function") {
            console.error(`❌ Route not a function: ${routePath}`);
            return;
        }
        app.use(mountPath, route);
        console.log(`✅ Route loaded: ${mountPath}`);
    } catch (err) {
        console.error(`❌ Failed to load route ${mountPath}:`, err.message);
    }
};

loadRoute("./routes/authRoutes", "/api/auth");
loadRoute("./routes/productRoutes", "/api/products");
loadRoute("./routes/orderRoutes", "/api/orders");
loadRoute("./routes/cartRoutes", "/api/cart");
loadRoute("./routes/userRoutes", "/api/users");
loadRoute("./routes/adminRoutes", "/api/admin");
loadRoute("./routes/reviewRoutes", "/api/reviews");

// ── Health Check ────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "MAUVE API is running 🚀" });
});

// ── 404 ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global Error Handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error("❌ Error:", err.message);
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal server error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
});

module.exports = app;