const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Employee = require("../models/Employee");
const Factory = require("../models/Factory");
const Attendance = require("../models/Attendance");


// ======================================================
// CREATE EMPLOYEE
// ======================================================
const createEmployee = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            employeeId,
            department,
            designation,
            phone,
            currentShift
        } = req.body;

        if (!name || !email || !password || !employeeId) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password and employee ID are required."
            });
        }

        // Factory comes from logged-in user
        const factoryId = req.user.factoryId;

        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message: "Factory information missing from user account."
            });
        }

        const factory = await Factory.findById(factoryId);

        if (!factory || !factory.isActive) {
            return res.status(404).json({
                success: false,
                message: "Factory not found or inactive."
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "A user with this email already exists."
            });
        }

        const existingEmployee = await Employee.findOne({
            factory: factoryId,
            employeeId: employeeId.trim()
        });

        if (existingEmployee) {
            return res.status(409).json({
                success: false,
                message: "Employee ID already exists in this factory."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: "employee",
            factoryId,
            factoryName: factory.name
        });

        const employee = await Employee.create({
            user: user._id,
            factory: factoryId,
            employeeId: employeeId.trim(),
            department,
            designation,
            phone,
            currentShift: currentShift || "morning"
        });

        return res.status(201).json({
            success: true,
            message: "Employee created successfully.",
            employee: {
                id: employee._id,
                employeeId: employee.employeeId,
                name: user.name,
                email: user.email,
                role: user.role,
                factory: factory.name,
                department: employee.department,
                designation: employee.designation,
                phone: employee.phone,
                currentShift: employee.currentShift,
                joiningDate: employee.joiningDate,
                status: employee.status
            }
        });

    } catch (error) {
        console.error("Create Employee Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating employee."
        });
    }
};


// ======================================================
// GET ALL EMPLOYEES
// ======================================================
const getEmployees = async (req, res) => {
    try {
        const factoryId = req.user.factoryId;

        const employees = await Employee.find({
            factory: factoryId
        })
            .populate("user", "name email role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: employees.length,
            employees: employees.map((employee) => ({
                id: employee._id,
                employeeId: employee.employeeId,
                name: employee.user?.name || "",
                email: employee.user?.email || "",
                role: employee.user?.role || "",
                department: employee.department,
                designation: employee.designation,
                phone: employee.phone,
                currentShift: employee.currentShift,
                joiningDate: employee.joiningDate,
                status: employee.status
            }))
        });

    } catch (error) {
        console.error("Get Employees Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching employees."
        });
    }
};


// ======================================================
// GET SINGLE EMPLOYEE
// ======================================================
const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const factoryId = req.user.factoryId;

        const employee = await Employee.findOne({
            _id: id,
            factory: factoryId
        }).populate("user", "name email role");

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found."
            });
        }

        return res.status(200).json({
            success: true,
            employee: {
                id: employee._id,
                employeeId: employee.employeeId,
                name: employee.user?.name || "",
                email: employee.user?.email || "",
                role: employee.user?.role || "",
                department: employee.department,
                designation: employee.designation,
                phone: employee.phone,
                currentShift: employee.currentShift,
                joiningDate: employee.joiningDate,
                status: employee.status
            }
        });

    } catch (error) {
        console.error("Get Employee Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching employee."
        });
    }
};


// ======================================================
// UPDATE EMPLOYEE
// ======================================================
const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const factoryId = req.user.factoryId;

        const {
            name,
            email,
            password,
            department,
            designation,
            phone,
            currentShift
        } = req.body;

        const employee = await Employee.findOne({
            _id: id,
            factory: factoryId
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found."
            });
        }

        const user = await User.findById(employee.user);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Employee user account not found."
            });
        }


        // Update User fields
        if (name !== undefined) {
            user.name = name.trim();
        }

        if (email !== undefined) {
            const newEmail = email.toLowerCase().trim();

            const existingUser = await User.findOne({
                email: newEmail,
                _id: { $ne: user._id }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "This email is already in use."
                });
            }

            user.email = newEmail;
        }

        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();


        // Update Employee fields
        if (department !== undefined) {
            employee.department = department;
        }

        if (designation !== undefined) {
            employee.designation = designation;
        }

        if (phone !== undefined) {
            employee.phone = phone;
        }

        if (currentShift !== undefined) {
            employee.currentShift = currentShift;
        }

        await employee.save();

        return res.status(200).json({
            success: true,
            message: "Employee updated successfully.",
            employee: {
                id: employee._id,
                employeeId: employee.employeeId,
                name: user.name,
                email: user.email,
                role: user.role,
                department: employee.department,
                designation: employee.designation,
                phone: employee.phone,
                currentShift: employee.currentShift,
                joiningDate: employee.joiningDate,
                status: employee.status
            }
        });

    } catch (error) {
        console.error("Update Employee Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating employee."
        });
    }
};


// ======================================================
// UPDATE EMPLOYEE STATUS
// ======================================================
const updateEmployeeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const factoryId = req.user.factoryId;

        const allowedStatuses = [
            "active",
            "inactive",
            "on_leave"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee status."
            });
        }

        const employee = await Employee.findOneAndUpdate(
            {
                _id: id,
                factory: factoryId
            },
            {
                status
            },
            {
                new: true,
                runValidators: true
            }
        ).populate("user", "name email role");

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Employee status updated successfully.",
            employee: {
                id: employee._id,
                employeeId: employee.employeeId,
                name: employee.user?.name || "",
                status: employee.status
            }
        });

    } catch (error) {
        console.error("Update Employee Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating employee status."
        });
    }
};


// ======================================================
// MARK / UPDATE ATTENDANCE
// ======================================================
const markAttendance = async (req, res) => {
    try {
        const {
            employeeId,
            date,
            shift,
            status,
            checkIn,
            checkOut
        } = req.body;

        const factoryId = req.user.factoryId;

        if (!employeeId || !date || !shift || !status) {
            return res.status(400).json({
                success: false,
                message: "Employee ID, date, shift and status are required."
            });
        }

        const allowedShifts = [
            "morning",
            "evening",
            "night"
        ];

        const allowedStatuses = [
            "present",
            "absent",
            "on_leave"
        ];

        if (!allowedShifts.includes(shift)) {
            return res.status(400).json({
                success: false,
                message: "Invalid shift."
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid attendance status."
            });
        }

        const employee = await Employee.findOne({
            employeeId,
            factory: factoryId
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found."
            });
        }

        // Normalize date to start of day
        const attendanceDate = new Date(date);

        if (Number.isNaN(attendanceDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid attendance date."
            });
        }

        attendanceDate.setUTCHours(0, 0, 0, 0);

        const attendance = await Attendance.findOneAndUpdate(
            {
                employee: employee._id,
                factory: factoryId,
                date: attendanceDate
            },
            {
                employee: employee._id,
                factory: factoryId,
                date: attendanceDate,
                shift,
                status,
                checkIn: checkIn || null,
                checkOut: checkOut || null
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "Attendance saved successfully.",
            attendance
        });

    } catch (error) {
        console.error("Mark Attendance Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while saving attendance."
        });
    }
};


// ======================================================
// GET EMPLOYEE ATTENDANCE
// ======================================================
const getEmployeeAttendance = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const factoryId = req.user.factoryId;

        const employee = await Employee.findOne({
            employeeId,
            factory: factoryId
        }).populate("user", "name email");

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found."
            });
        }

        const attendance = await Attendance.find({
            employee: employee._id,
            factory: factoryId
        })
            .sort({ date: -1 });

        return res.status(200).json({
            success: true,
            employee: {
                employeeId: employee.employeeId,
                name: employee.user?.name || ""
            },
            count: attendance.length,
            attendance
        });

    } catch (error) {
        console.error("Get Employee Attendance Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching attendance."
        });
    }
};


// ======================================================
// ATTENDANCE ANALYTICS
// ======================================================
const getAttendanceAnalytics = async (req, res) => {
    try {
        const factoryId = req.user.factoryId;

        const today = new Date();

        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 6);
        startDate.setUTCHours(0, 0, 0, 0);

        const endDate = new Date(today);
        endDate.setUTCHours(23, 59, 59, 999);

        const attendance = await Attendance.find({
            factory: factoryId,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).populate({
            path: "employee",
            populate: {
                path: "user",
                select: "name"
            }
        });

        const present = attendance.filter(
            item => item.status === "present"
        ).length;

        const absent = attendance.filter(
            item => item.status === "absent"
        ).length;

        const onLeave = attendance.filter(
            item => item.status === "on_leave"
        ).length;

        const total = attendance.length;

        const attendancePercentage =
            total > 0
                ? Number(((present / total) * 100).toFixed(2))
                : 0;


        // Employee-wise performance
        const employeeStats = {};

        attendance.forEach((record) => {
            if (!record.employee) return;

            const employeeKey = record.employee._id.toString();

            if (!employeeStats[employeeKey]) {
                employeeStats[employeeKey] = {
                    employeeId: record.employee.employeeId,
                    name: record.employee.user?.name || "Unknown",
                    total: 0,
                    present: 0
                };
            }

            employeeStats[employeeKey].total += 1;

            if (record.status === "present") {
                employeeStats[employeeKey].present += 1;
            }
        });

        const performerList = Object.values(employeeStats)
            .map((employee) => ({
                ...employee,
                attendancePercentage:
                    employee.total > 0
                        ? Number(
                            (
                                (employee.present / employee.total) *
                                100
                            ).toFixed(2)
                        )
                        : 0
            }))
            .sort(
                (a, b) =>
                    b.attendancePercentage -
                    a.attendancePercentage
            );

        return res.status(200).json({
            success: true,
            period: {
                from: startDate,
                to: endDate
            },
            summary: {
                total,
                present,
                absent,
                onLeave,
                attendancePercentage
            },
            employees: performerList
        });

    } catch (error) {
        console.error("Attendance Analytics Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while calculating attendance analytics."
        });
    }
};


module.exports = {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    updateEmployeeStatus,
    markAttendance,
    getEmployeeAttendance,
    getAttendanceAnalytics
};