const express = require("express");

const {
    createEmployee
} = require("../controllers/employeeController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// ===============================
// CREATE EMPLOYEE
// ===============================

router.post(
    "/",
    protect,
    authorize("admin", "manager"),
    createEmployee
);

module.exports = router;