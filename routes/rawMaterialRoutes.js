const express = require("express");

const {
    createRawMaterial,
    getRawMaterials,
     updateRawMaterialStock,
     getLowStockMaterials
} = require("../controllers/rawMaterialController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();


// CREATE RAW MATERIAL
router.post(
    "/",
    protect,
    authorize("admin", "manager"),
    createRawMaterial
);


// GET ALL RAW MATERIALS
router.get(
    "/",
    protect,
    getRawMaterials
);

router.get(
    "/alerts/low-stock",
    protect,
    getLowStockMaterials
);

router.put(
    "/:id/stock",
    protect,
    authorize("admin", "manager"),
    updateRawMaterialStock
);


module.exports = router;