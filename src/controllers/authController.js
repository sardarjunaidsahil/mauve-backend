const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const pool = require("../config/db");
const {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
} = require("../services/emailService");

const generateToken = (user) =>
    jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// @POST /api/auth/register
const register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;
        if (!firstName || !lastName || !email || !password)
            return res.status(400).json({ success: false, message: "All fields are required" });
        if (password.length < 6)
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

        const existing = await userModel.findByEmail(email);
        if (existing?.is_verified)
            return res.status(409).json({ success: false, message: "Email already registered" });

        const hashedPassword = await bcrypt.hash(password, 12);
        const code = generateCode();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        if (existing && !existing.is_verified) {
            await pool.query(
                `UPDATE users SET first_name=$1, last_name=$2, password=$3, phone=$4,
                 verification_code=$5, verification_code_expires=$6, updated_at=NOW() WHERE email=$7`,
                [firstName, lastName, hashedPassword, phone || null, code, expiry, email]
            );
        } else {
            await pool.query(
                `INSERT INTO users (first_name, last_name, email, password, phone, verification_code, verification_code_expires, is_verified)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE)`,
                [firstName, lastName, email, hashedPassword, phone || null, code, expiry]
            );
        }

        await sendVerificationEmail({ to: email, name: firstName, code });
        res.status(201).json({ success: true, message: "Verification code sent to your email", email });
    } catch (err) { next(err); }
};

// @POST /api/auth/verify-email
const verifyEmail = async (req, res, next) => {
    try {
        const { email, code } = req.body;
        if (!email || !code)
            return res.status(400).json({ success: false, message: "Email and code are required" });

        const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
        const user = rows[0];
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (user.is_verified) return res.status(400).json({ success: false, message: "Email already verified" });
        if (user.verification_code !== code)
            return res.status(400).json({ success: false, message: "Invalid verification code" });
        if (new Date() > new Date(user.verification_code_expires))
            return res.status(400).json({ success: false, message: "Code expired. Please register again." });

        await pool.query(
            "UPDATE users SET is_verified=TRUE, verification_code=NULL, verification_code_expires=NULL WHERE email=$1",
            [email]
        );
        await sendWelcomeEmail({ to: email, name: user.first_name });

        const token = generateToken(user);
        res.json({
            success: true, message: "Email verified successfully!", token,
            user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role },
        });
    } catch (err) { next(err); }
};

// @POST /api/auth/resend-code
const resendVerificationCode = async (req, res, next) => {
    try {
        const { email } = req.body;
        const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
        const user = rows[0];
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (user.is_verified) return res.status(400).json({ success: false, message: "Already verified" });

        const code = generateCode();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);
        await pool.query(
            "UPDATE users SET verification_code=$1, verification_code_expires=$2 WHERE email=$3",
            [code, expiry, email]
        );
        await sendVerificationEmail({ to: email, name: user.first_name, code });
        res.json({ success: true, message: "New verification code sent" });
    } catch (err) { next(err); }
};

// @POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ success: false, message: "Email and password required" });

        const user = await userModel.findByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password)))
            return res.status(401).json({ success: false, message: "Invalid email or password" });

        if (!user.is_verified)
            return res.status(403).json({
                success: false, message: "Please verify your email first",
                needsVerification: true, email: user.email,
            });

        const token = generateToken(user);
        res.json({
            success: true, message: "Login successful", token,
            user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role },
        });
    } catch (err) { next(err); }
};

// @POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: "Email is required" });

        const { rows } = await pool.query("SELECT * FROM users WHERE email=$1 AND is_verified=TRUE", [email]);
        const user = rows[0];

        // Always return success (prevent email enumeration)
        if (!user) return res.json({ success: true, message: "If this email exists, a reset code has been sent" });

        const code = generateCode();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        await pool.query(
            "UPDATE users SET verification_code=$1, verification_code_expires=$2 WHERE email=$3",
            [code, expiry, email]
        );
        await sendPasswordResetEmail({ to: email, name: user.first_name, code });

        res.json({ success: true, message: "Reset code sent to your email" });
    } catch (err) { next(err); }
};

// @POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
    try {
        const { email, code, newPassword } = req.body;
        if (!email || !code || !newPassword)
            return res.status(400).json({ success: false, message: "All fields required" });
        if (newPassword.length < 6)
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

        const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
        const user = rows[0];

        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });
        if (user.verification_code !== code)
            return res.status(400).json({ success: false, message: "Invalid reset code" });
        if (new Date() > new Date(user.verification_code_expires))
            return res.status(400).json({ success: false, message: "Reset code expired. Please try again." });

        const hashed = await bcrypt.hash(newPassword, 12);
        await pool.query(
            "UPDATE users SET password=$1, verification_code=NULL, verification_code_expires=NULL WHERE email=$2",
            [hashed, email]
        );

        res.json({ success: true, message: "Password reset successfully! You can now login." });
    } catch (err) { next(err); }
};

// @GET /api/auth/me
const getMe = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({
            success: true,
            user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, phone: user.phone, role: user.role },
        });
    } catch (err) { next(err); }
};

// @POST /api/auth/change-password
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword)
            return res.status(400).json({ success: false, message: "Both fields required" });
        if (newPassword.length < 6)
            return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });

        const user = await userModel.findByEmail(req.user.email);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch)
            return res.status(401).json({ success: false, message: "Current password is incorrect" });

        const hashed = await bcrypt.hash(newPassword, 12);
        await userModel.updatePassword(req.user.id, hashed);
        res.json({ success: true, message: "Password updated successfully" });
    } catch (err) { next(err); }
};

module.exports = {
    register, login, verifyEmail, resendVerificationCode,
    forgotPassword, resetPassword,
    getMe, changePassword,
};