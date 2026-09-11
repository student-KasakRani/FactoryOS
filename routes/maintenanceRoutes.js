const express = require("express");

const {
    createMaintenance,
     getMaintenanceTasks,
      getMaintenanceById,
      updateMaintenanceStatus
} = require("../controllers/maintenanceController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/",
    protect,
    getMaintenanceTasks
);

router.get(
    "/:id",
    protect,
    getMaintenanceById
);

router.post(
    "/",
    protect,
    authorize("admin", "manager"),
    createMaintenance
);

router.put(
    "/:id/status",
    protect,
    authorize("admin", "manager"),
    updateMaintenanceStatus
);

module.exports = router;