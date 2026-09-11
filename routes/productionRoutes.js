const express = require("express");

const {
    createProduction,
    getProductionRecords,
    getProductionById,
    updateProductionStatus
} = require("../controllers/productionController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE PRODUCTION
router.post(
    "/",
    protect,
    authorize("admin", "manager"),
    createProduction
);

// GET ALL PRODUCTION
router.get(
    "/",
    protect,
    getProductionRecords
);

// GET PRODUCTION BY ID
router.get(
    "/:id",
    protect,
    getProductionById
);

// UPDATE PRODUCTION STATUS
router.put(
    "/:id/status",
    protect,
    authorize("admin", "manager"),
    updateProductionStatus
);

module.exports = router;