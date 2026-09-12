const Product = require("../models/Product");
const RawMaterial = require("../models/RawMaterial");

// ======================================================
// CREATE PRODUCT
// ======================================================

const createProduct = async (req, res) => {
    try {
        const {
            name,
            productCode,
            unit,
            standardProductionQuantity,
            rawMaterials
        } = req.body;

        const factoryId = req.user.factoryId;
        const createdBy = req.user._id || req.user.id;

        if (
            !factoryId ||
            !createdBy ||
            !name ||
            !productCode ||
            standardProductionQuantity === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Product name, product code and standard production quantity are required."
            });
        }

        const standardQty = Number(standardProductionQuantity);

        if (
            Number.isNaN(standardQty) ||
            standardQty <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Standard production quantity must be greater than 0."
            });
        }

        if (!Array.isArray(rawMaterials) || rawMaterials.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "At least one raw material standard is required."
            });
        }

        // Prevent duplicate raw materials
        const materialIds = rawMaterials.map(
            item => String(item.rawMaterial)
        );

        const uniqueMaterialIds = new Set(materialIds);

        if (materialIds.length !== uniqueMaterialIds.size) {
            return res.status(400).json({
                success: false,
                message:
                    "Duplicate raw material is not allowed in the same product."
            });
        }

        const validatedRawMaterials = [];

        for (const item of rawMaterials) {
            if (
                !item.rawMaterial ||
                item.standardQuantity === undefined ||
                !item.unit
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Raw material, standard quantity and unit are required."
                });
            }

            const quantity = Number(item.standardQuantity);

            if (Number.isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Standard raw material quantity must be greater than 0."
                });
            }

            const material = await RawMaterial.findOne({
                _id: item.rawMaterial,
                factory: factoryId,
                isActive: true
            });

            if (!material) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Raw material not found in your factory."
                });
            }

            validatedRawMaterials.push({
                rawMaterial: material._id,
                standardQuantity: quantity,
                unit: item.unit
            });
        }

        // Prevent duplicate product code inside same factory
        const existingProduct = await Product.findOne({
            factory: factoryId,
            productCode: productCode.trim().toUpperCase()
        });

        if (existingProduct) {
            return res.status(409).json({
                success: false,
                message:
                    "Product code already exists in your factory."
            });
        }

        const product = await Product.create({
            factory: factoryId,
            name: name.trim(),
            productCode: productCode.trim().toUpperCase(),
            unit: unit || "units",
            standardProductionQuantity: standardQty,
            rawMaterials: validatedRawMaterials,
            createdBy
        });

        await product.populate([
            {
                path: "rawMaterials.rawMaterial",
                select: "name materialCode unit unitCost currentStock"
            },
            {
                path: "createdBy",
                select: "name email role"
            }
        ]);

        return res.status(201).json({
            success: true,
            message: "Product standard created successfully.",
            product
        });

    } catch (error) {
        console.error(
            "Create Product Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while creating product standard."
        });
    }
};


// ======================================================
// GET ALL PRODUCTS
// ======================================================

const getProducts = async (req, res) => {
    try {
        const factoryId = req.user.factoryId;

        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message:
                    "User is not assigned to a factory."
            });
        }

        const products = await Product.find({
            factory: factoryId,
            isActive: true
        })
            .populate(
                "rawMaterials.rawMaterial",
                "name materialCode unit unitCost currentStock"
            )
            .populate(
                "createdBy",
                "name email role"
            )
            .sort({ name: 1 });

        return res.json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error(
            "Get Products Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching products."
        });
    }
};


// ======================================================
// GET PRODUCT BY ID
// ======================================================

const getProductById = async (req, res) => {
    try {
        const factoryId = req.user.factoryId;

        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message:
                    "User is not assigned to a factory."
            });
        }

        const product = await Product.findOne({
            _id: req.params.id,
            factory: factoryId,
            isActive: true
        })
            .populate(
                "rawMaterials.rawMaterial",
                "name materialCode unit unitCost currentStock"
            )
            .populate(
                "createdBy",
                "name email role"
            );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        return res.json({
            success: true,
            product
        });

    } catch (error) {
        console.error(
            "Get Product By ID Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching product."
        });
    }
};


module.exports = {
    createProduct,
    getProducts,
    getProductById
};