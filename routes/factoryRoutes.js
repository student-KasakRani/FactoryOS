const express = require("express");

const {
    createFactory
} = require("../controllers/factoryController");

const {
    createMachine,
    getMachines,
    getMachineById
} = require("../controllers/machineController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// ===============================
// CREATE FACTORY
// ===============================

router.post(
    "/",
    protect,
    authorize("admin"),
    createFactory
);

router.get(
    "/",
    protect,
    getMachines
);

router.get(
    "/:id",
    protect,
    getMachineById
);

module.exports = router;