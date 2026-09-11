const express = require("express");

const {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deactivateSupplier
} = require("../controllers/supplierController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/",
    protect,
    authorize("admin", "manager"),
    createSupplier
);

router.get(
    "/",
    protect,
    getSuppliers
);

router.get(
    "/:id",
    protect,
    getSupplierById
);

router.put(
    "/:id",
    protect,
    authorize("admin", "manager"),
    updateSupplier
);

router.delete(
    "/:id",
    protect,
    authorize("admin", "manager"),
    deactivateSupplier
);

module.exports = router;