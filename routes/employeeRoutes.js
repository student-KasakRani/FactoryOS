const express = require("express");

const {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    updateEmployeeStatus,
    markAttendance,
    getEmployeeAttendance,
    getAttendanceAnalytics
} = require("../controllers/employeeController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// Employee management
router.post(
    "/",
    protect,
    authorize("admin", "manager"),
    createEmployee
);

router.get(
    "/",
    protect,
    getEmployees
);

router.get(
    "/attendance/analytics",
    protect,
    authorize("admin", "manager"),
    getAttendanceAnalytics
);

router.post(
    "/attendance",
    protect,
    authorize("admin", "manager"),
    markAttendance
);

router.get(
    "/:employeeId/attendance",
    protect,
    authorize("admin", "manager"),
    getEmployeeAttendance
);

router.get(
    "/:id",
    protect,
    getEmployeeById
);

router.put(
    "/:id",
    protect,
    authorize("admin", "manager"),
    updateEmployee
);

router.patch(
    "/:id/status",
    protect,
    authorize("admin", "manager"),
    updateEmployeeStatus
);

module.exports = router;