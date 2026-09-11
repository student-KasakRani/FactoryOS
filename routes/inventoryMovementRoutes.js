const express = require("express");

const {
    createInventoryMovement,
    getInventoryMovements,
    getInventoryMovementById
} = require("../controllers/inventoryMovementController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();


// Create inventory movement
router.post(
    "/",
    protect,
    authorize("admin", "manager"),
    createInventoryMovement
);


// Get inventory movement history
router.get(
    "/",
    protect,
    getInventoryMovements
);


// Get single movement
router.get(
    "/:id",
    protect,
    getInventoryMovementById
);


module.exports = router;