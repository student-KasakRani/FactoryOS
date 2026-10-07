const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Factory = require("../models/Factory");

const router = express.Router();

// ======================================================
// SIGNUP - CREATE NEW FACTORY + OWNER ACCOUNT
// ======================================================

router.post("/signup", async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const {
            name,
            email,
            password,
            factoryName
        } = req.body;

        // Basic validation
        if (!name || !email || !password || !factoryName) {
            return res.status(400).json({
                success: false,
                message:
                    "Owner name, email, password and factory name are required."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        const normalizedEmail = email
            .toLowerCase()
            .trim();

        const normalizedFactoryName = factoryName.trim();

        // Check duplicate user
        const existingUser = await User.findOne({
            email: normalizedEmail
        }).session(session);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // Generate a unique factory code
        let factoryCode;
        let codeExists = true;

        while (codeExists) {
            factoryCode =
                "FAC-" +
                Math.random()
                    .toString(36)
                    .substring(2, 8)
                    .toUpperCase();

            const existingFactory = await Factory.findOne({
                factoryCode
            }).session(session);

            codeExists = !!existingFactory;
        }

        let createdUser;
        let createdFactory;

        await session.withTransaction(async () => {

            // Step 1: Create owner/admin user temporarily
            const users = await User.create(
                [
                    {
                        name: name.trim(),
                        email: normalizedEmail,
                        password: hashedPassword,
                        role: "admin",
                        factoryId: null,
                        factoryName: normalizedFactoryName,
                        isActive: true
                    }
                ],
                { session }
            );

            createdUser = users[0];

            // Step 2: Create factory with this user as owner
            const factories = await Factory.create(
                [
                    {
                        name: normalizedFactoryName,
                        owner: createdUser._id,
                        factoryCode,
                        industry: "Plastic & Packaging",
                        country: "India",
                        email: normalizedEmail,
                        isActive: true
                    }
                ],
                { session }
            );

            createdFactory = factories[0];

            // Step 3: Attach factory to owner account
            createdUser.factoryId =
                createdFactory._id;

            createdUser.factoryName =
                createdFactory.name;

            await createdUser.save({ session });
        });

        // Create JWT for automatic login
        const token = jwt.sign(
            {
                id: createdUser._id,
                role: createdUser.role,
                factoryId: createdFactory._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.status(201).json({
            success: true,
            message: "Factory account created successfully.",
            token,
            user: {
                id: createdUser._id,
                name: createdUser.name,
                email: createdUser.email,
                role: createdUser.role,
                factoryId: createdUser.factoryId,
                factoryName: createdUser.factoryName,
                isActive: createdUser.isActive
            },
            factory: {
                id: createdFactory._id,
                name: createdFactory.name,
                factoryCode: createdFactory.factoryCode,
                industry: createdFactory.industry,
                country: createdFactory.country,
                isActive: createdFactory.isActive
            }
        });

    } catch (error) {
        console.error("Signup Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during factory signup."
        });
    } finally {
        await session.endSession();
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