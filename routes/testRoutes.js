const express = require("express");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();


// Any logged-in user
router.get("/protected", protect, (req, res) => {
    res.json({
        success: true,
        message: "You are authenticated 🔐",
        user: req.user
    });
});


// Admin only
router.get(
    "/admin",
    protect,
    authorize("admin"),
    (req, res) => {
        res.json({
            success: true,
            message: "Welcome FactoryOS Admin 👑",
            user: req.user
        });
    }
);


module.exports = router;