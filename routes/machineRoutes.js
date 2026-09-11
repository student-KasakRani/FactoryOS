const express = require("express");

const {
    createMachine,
    getMachines,
    getMachineById,
    updateMachineStatus,
    getMachineEvents,
    resolveMachineBreakdown,
    healthCheckMachine,
    getMachineHealthAlerts
} = require("../controllers/machineController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/",
    protect,
    authorize("admin", "manager"),
    createMachine
);

router.get(
    "/",
    protect,
    getMachines
);

router.get(
    "/:machineId/events",
    protect,
    getMachineEvents
);

router.get(
    "/:id",
    protect,
    getMachineById
);

router.put(
    "/:id/status",
    protect,
    authorize("admin", "manager"),
    updateMachineStatus
);

router.put(
    "/:id/resolve-breakdown",
    protect,
    authorize("admin", "manager"),
    resolveMachineBreakdown
);

router.post(
    "/:id/health-check",
    protect,
    healthCheckMachine
);

router.get(
    "/alerts/health",
    protect,
    getMachineHealthAlerts
);

module.exports = router;