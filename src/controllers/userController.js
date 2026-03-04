const userModel = require("../models/userModel");

// @GET /api/users/profile
const getProfile = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({
            success: true,
            user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, phone: user.phone },
        });
    } catch (err) { next(err); }
};

// @PUT /api/users/profile
const updateProfile = async (req, res, next) => {
    try {
        const { firstName, lastName, phone } = req.body;
        if (!firstName || !lastName) {
            return res.status(400).json({ success: false, message: "First name and last name required" });
        }
        const user = await userModel.update(req.user.id, { firstName, lastName, phone });
        res.json({
            success: true,
            message: "Profile updated",
            user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, phone: user.phone },
        });
    } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile };