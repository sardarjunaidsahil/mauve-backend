const jwt = require("jsonwebtoken");

// Verify JWT token
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, email, role }
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Token invalid or expired" });
    }
};

// Admin only
const adminOnly = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ success: false, message: "Admin access required" });
    }
    next();
};

module.exports = { protect, adminOnly };