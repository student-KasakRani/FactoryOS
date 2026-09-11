const express = require("express");

const {
    createPurchase,
    getPurchases,
    getPurchaseById,
    updatePurchaseStatus,
    receivePurchase,
     verifySupplierBill
} = require("../controllers/purchaseController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();


// Create Purchase Order
router.post(
    "/",
    protect,
    authorize("admin", "manager"),
    createPurchase
);


// Get all Purchase Orders
router.get(
    "/",
    protect,
    getPurchases
);


// Get Purchase Order by ID
router.get(
    "/:id",
    protect,
    getPurchaseById
);


// Update Purchase Order status
router.put(
    "/:id/status",
    protect,
    authorize("admin", "manager"),
    updatePurchaseStatus
);


// Receive purchased material
router.put(
    "/:id/receive",
    protect,
    authorize("admin", "manager"),
    receivePurchase
);

// Verify supplier bill / detect wrong billing

router.put(
    "/:id/verify-bill",
    protect,
    authorize("admin", "manager"),
    verifySupplierBill
);

module.exports = router;