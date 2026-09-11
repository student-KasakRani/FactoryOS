const express = require("express");

const {
    getProductionReport,
    getInventoryReport,
    getMachineReport,
    getPurchaseReport,
     getWastageReport
} = require("../controllers/reportController");

const {
    protect
} = require("../middleware/authMiddleware");

const router = express.Router();


// PRODUCTION REPORT
router.get(
    "/production",
    protect,
    getProductionReport
);


// INVENTORY REPORT
router.get(
    "/inventory",
    protect,
    getInventoryReport
);


// MACHINE REPORT
router.get(
    "/machines",
    protect,
    getMachineReport
);


// PURCHASE REPORT
router.get(
    "/purchases",
    protect,
    getPurchaseReport
);

// WASTAGE REPORT

router.get(

    "/wastage",

    protect,

    getWastageReport

);

module.exports = router;