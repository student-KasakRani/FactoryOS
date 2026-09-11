const Factory = require("../models/Factory");

const createFactory = async (req, res) => {
    try {
        const {
            name,
            factoryCode,
            industry,
            address,
            city,
            state,
            country,
            contactNumber,
            email
        } = req.body;

        if (!name || !factoryCode) {
            return res.status(400).json({
                success: false,
                message: "Factory name and factory code are required."
            });
        }

        const existingFactory = await Factory.findOne({
            factoryCode: factoryCode.toUpperCase()
        });

        if (existingFactory) {
            return res.status(409).json({
                success: false,
                message: "Factory code already exists."
            });
        }

        const factory = await Factory.create({
            name,
            factoryCode: factoryCode.toUpperCase(),
            industry,
            address,
            city,
            state,
            country,
            contactNumber,
            email,
            owner: req.user.id
        });

        res.status(201).json({
            success: true,
            message: "Factory created successfully.",
            factory
        });

    } catch (error) {
        console.error("Create Factory Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error while creating factory."
        });
    }
};

module.exports = {
    createFactory
};