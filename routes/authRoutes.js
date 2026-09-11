const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Factory = require("../models/Factory");

const router = express.Router();

// ======================================================
// SIGNUP
// ======================================================

router.post("/signup", async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            factoryId
        } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check existing user
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists."
            });
        }

        // Factory is optional for public signup.
        // If factoryId is provided, verify it.
        let factory = null;

        if (factoryId) {
            factory = await Factory.findOne({
                _id: factoryId,
                isActive: true
            });

            if (!factory) {
                return res.status(404).json({
                    success: false,
                    message: "Factory not found or inactive."
                });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // IMPORTANT:
        // Public signup can ONLY create employee accounts.
        // Admin/manager accounts must NOT be created by simply
        // sending role: "admin" or role: "manager".
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "employee",
            factoryId: factory ? factory._id : null,
            factoryName: factory ? factory.name : "",
            isActive: true
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                factoryId: user.factoryId,
                factoryName: user.factoryName,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error("Signup Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error during signup."
        });
    }
});


// ======================================================
// LOGIN
// ======================================================

router.post("/login", async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Find user
        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Check active account
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive."
            });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                factoryId: user.factoryId || null
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                factoryId: user.factoryId,
                factoryName: user.factoryName,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error("Login Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error during login."
        });
    }
});


module.exports = router;