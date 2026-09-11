const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Employee = require("../models/Employee");
const Factory = require("../models/Factory");

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
            factoryId
        } = req.body;

        if (!name || !email || !password || !employeeId || !factoryId) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password, employee ID and factory ID are required."
            });
        }

        // Check factory
        const factory = await Factory.findById(factoryId);

        if (!factory || !factory.isActive) {
            return res.status(404).json({
                success: false,
                message: "Factory not found or inactive."
            });
        }

        // Check user
        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "A user with this email already exists."
            });
        }

        // Check employee ID inside this factory
        const existingEmployee = await Employee.findOne({
            factory: factoryId,
            employeeId
        });

        if (existingEmployee) {
            return res.status(409).json({
                success: false,
                message: "Employee ID already exists in this factory."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create login user
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: "employee",
            factoryId,
            factoryName: factory.name
        });

        // Create employee profile
        const employee = await Employee.create({
            user: user._id,
            factory: factoryId,
            employeeId,
            department,
            designation,
            phone
        });

        res.status(201).json({
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
                status: employee.status
            }
        });

    } catch (error) {
        console.error("Create Employee Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error while creating employee."
        });
    }
};

module.exports = {
    createEmployee
};