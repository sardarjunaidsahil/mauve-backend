const router = require("express").Router();
const {
    register, login,
    verifyEmail, resendVerificationCode,
    forgotPassword, resetPassword,
    getMe, changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/resend-code", resendVerificationCode);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);
router.post("/change-password", protect, changePassword);

module.exports = router;