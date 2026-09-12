const mongoose = require("mongoose");
const Production = require("../models/Production");
const Machine = require("../models/Machine");
const RawMaterial = require("../models/RawMaterial");
const InventoryMovement = require("../models/InventoryMovement");
const Product = require("../models/Product");

// ======================================================
// CREATE PRODUCTION
// ======================================================

const createProduction = async (req, res) => {
    try {
        const {
            machineId,
            productId,
            productionDate,
            shift,
            productName,
            targetQuantity,
            producedQuantity,
            rejectedQuantity,
            unit,
            status,
            notes,
            rawMaterials
        } = req.body;

        const factoryId = req.user.factoryId;
        const createdBy = req.user._id || req.user.id;

        // Required fields
        if (
            !factoryId ||
            !createdBy ||
            !machineId ||
            !productId ||
            !productionDate ||
            !shift ||
            !productName ||
            targetQuantity === undefined ||
            producedQuantity === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Machine, product, production date, shift, product name, target quantity and produced quantity are required."
            });
        }

        // Validate shift
        const allowedShifts = [
            "morning",
            "evening",
            "night"
        ];

        if (!allowedShifts.includes(shift)) {
            return res.status(400).json({
                success: false,
                message: "Invalid shift."
            });
        }

        // Validate quantities
        const target = Number(targetQuantity);
        const produced = Number(producedQuantity);
        const rejected = Number(rejectedQuantity || 0);

        if (
            Number.isNaN(target) ||
            Number.isNaN(produced) ||
            Number.isNaN(rejected) ||
            target < 0 ||
            produced < 0 ||
            rejected < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Production quantities must be valid non-negative numbers."
            });
        }

        // Produced quantity should not exceed target
        if (produced > target) {
            return res.status(400).json({
                success: false,
                message: "Produced quantity cannot exceed target quantity."
            });
        }

        // Check machine belongs to user's factory
        const machine = await Machine.findOne({
            _id: machineId,
            factory: factoryId,
            isActive: true
        });

        if (!machine) {
            return res.status(404).json({
                success: false,
                message: "Machine not found in your factory."
            });
        }

        // --------------------------------------------------
        // CHECK PRODUCT
        // --------------------------------------------------

        const product = await Product.findOne({
            _id: productId,
            factory: factoryId,
            isActive: true
        }).populate("rawMaterials.rawMaterial", "name materialCode unit");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found in your factory."
            });
        }

        if (
            !product.standardProductionQuantity ||
            product.standardProductionQuantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Product standard production quantity must be greater than 0."
            });
        }

        // --------------------------------------------------
        // VALIDATE RAW MATERIALS
        // --------------------------------------------------

        if (!Array.isArray(rawMaterials) || rawMaterials.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one raw material is required for production."
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
                    "Duplicate raw material is not allowed in the same production record."
            });
        }

        const materialsToConsume = [];
        const materialUsageAnalysis = [];

        for (const item of rawMaterials) {
            if (
                !item.rawMaterial ||
                item.quantity === undefined
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Raw material and quantity are required."
                });
            }

            const quantity = Number(item.quantity);

            if (Number.isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Raw material quantity must be greater than 0."
                });
            }

            // Check raw material belongs to same factory
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

            // Check stock
            if (material.currentStock < quantity) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Insufficient stock for ${material.name}. Available: ${material.currentStock} ${material.unit}`
                });
            }

            // --------------------------------------------------
            // FIND PRODUCT STANDARD FOR THIS RAW MATERIAL
            // --------------------------------------------------

            const productStandard = product.rawMaterials.find(
                standardItem =>
                    String(standardItem.rawMaterial._id) ===
                    String(item.rawMaterial)
            );

            if (!productStandard) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${material.name} is not defined in the raw material standard for ${product.name}.`
                });
            }

            const actualUnit = (item.unit || material.unit).trim();
            const standardUnit = productStandard.unit.trim();

            // Unit must match because we are not doing automatic conversion
            if (
                actualUnit.toLowerCase() !==
                standardUnit.toLowerCase()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Unit mismatch for ${material.name}. Product standard uses ${standardUnit}, but production uses ${actualUnit}.`
                });
            }

            // --------------------------------------------------
            // EXPECTED VS ACTUAL USAGE
            // --------------------------------------------------

            const expectedQuantity =
                (target / product.standardProductionQuantity) *
                productStandard.standardQuantity;

            const difference =
                quantity - expectedQuantity;

            const usagePercentage =
                expectedQuantity > 0
                    ? (quantity / expectedQuantity) * 100
                    : 0;

            const usageStatus =
                quantity <= expectedQuantity
                    ? "within_standard"
                    : "above_standard";

            materialUsageAnalysis.push({
                rawMaterial: material._id,
                expectedQuantity: Number(
                    expectedQuantity.toFixed(2)
                ),
                actualQuantity: Number(
                    quantity.toFixed(2)
                ),
                difference: Number(
                    difference.toFixed(2)
                ),
                usagePercentage: Number(
                    usagePercentage.toFixed(2)
                ),
                status: usageStatus,
                unit: actualUnit
            });

            materialsToConsume.push({
                material,
                quantity,
                unit: actualUnit
            });
        }

        // --------------------------------------------------
        // VALIDATE STATUS
        // --------------------------------------------------

        const allowedStatuses = [
            "planned",
            "in_progress",
            "completed",
            "cancelled"
        ];

        const productionStatus = status || "planned";

        if (!allowedStatuses.includes(productionStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid production status."
            });
        }

        // --------------------------------------------------
        // CREATE PRODUCTION RECORD
        // --------------------------------------------------

        const production = await Production.create({
            factory: factoryId,
            machine: machineId,
            product: productId,
            productionDate,
            shift,
            productName,
            targetQuantity: target,
            producedQuantity: produced,
            rejectedQuantity: rejected,
            unit: unit || product.unit || "units",
            status: productionStatus,
            notes,
            rawMaterials,
            materialUsageAnalysis,
            createdBy
        });

        // --------------------------------------------------
        // CONSUME STOCK ONLY IF COMPLETED
        // --------------------------------------------------

        if (productionStatus === "completed") {
            for (const item of materialsToConsume) {
                const previousStock =
                    item.material.currentStock;

                item.material.currentStock -= item.quantity;

                await item.material.save();

                await InventoryMovement.create({
                    factory: factoryId,
                    rawMaterial: item.material._id,
                    machine: machineId,
                    production: production._id,
                    movementType: "production_out",
                    quantity: item.quantity,
                    previousStock,
                    currentStock: item.material.currentStock,
                    referenceType: "production",
                    referenceId: production._id,
                    reason:
                        "Raw material consumed for production",
                    notes:
                        `Material used for production: ${productName}`,
                    createdBy
                });
            }
        }

        // --------------------------------------------------
        // POPULATE USEFUL INFORMATION
        // --------------------------------------------------

        await production.populate([
            {
                path: "machine",
                select: "name machineCode status"
            },
            {
                path: "product",
                select:
                    "name productCode unit standardProductionQuantity rawMaterials"
            },
            {
                path: "materialUsageAnalysis.rawMaterial",
                select: "name materialCode unit"
            },
            {
                path: "createdBy",
                select: "name email role"
            }
        ]);

        return res.status(201).json({
            success: true,
            message:
                "Production record created successfully.",
            production
        });

    } catch (error) {
        console.error(
            "Create Production Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while creating production record."
        });
    }
};

// ======================================================
// GET ALL PRODUCTION
// ======================================================

const getProductionRecords = async (req, res) => {
    try {
        const factoryId = req.user.factoryId;

        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const productionRecords = await Production.find({
            factory: factoryId
        })
            .sort({
                productionDate: -1,
                createdAt: -1
            })
            .populate(
    "machine",
    "name machineCode status"
)
.populate(
    "product",
    "name productCode unit standardProductionQuantity"
)
.populate(
    "materialUsageAnalysis.rawMaterial",
    "name materialCode unit"
)
.populate(
    "createdBy",
    "name email role"
);

        return res.json({
            success: true,
            count: productionRecords.length,
            productionRecords
        });

    } catch (error) {
        console.error("Get Production Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching production records."
        });
    }
};


// ======================================================
// GET PRODUCTION BY ID
// ======================================================

const getProductionById = async (req, res) => {
    try {
        const factoryId = req.user.factoryId;

        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const production = await Production.findOne({
            _id: req.params.id,
            factory: factoryId
        })
            .populate(
                "machine",
                "name machineCode status"
            )
            .populate(
                "createdBy",
                "name email role"
            );

        if (!production) {
            return res.status(404).json({
                success: false,
                message: "Production record not found."
            });
        }

        return res.json({
            success: true,
            production
        });

    } catch (error) {
        console.error("Get Production By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching production record."
        });
    }
};


const updateProductionStatus = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const {
            status,
            producedQuantity,
            rejectedQuantity,
            notes
        } = req.body;

        const factoryId = req.user.factoryId;
        const createdBy = req.user._id || req.user.id;

        const allowedStatuses = [
            "planned",
            "in_progress",
            "completed",
            "cancelled"
        ];

        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        if (!createdBy) {
            return res.status(400).json({
                success: false,
                message: "User information is missing."
            });
        }

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid production status."
            });
        }

        let updatedProduction;

        await session.withTransaction(async () => {

            const production = await Production.findOne({
                _id: req.params.id,
                factory: factoryId
            })
                .populate({
                    path: "product",
                    populate: {
                        path: "rawMaterials.rawMaterial",
                        select: "name materialCode unit"
                    }
                })
                .session(session);

            if (!production) {
                const error = new Error(
                    "Production record not found in your factory."
                );
                error.statusCode = 404;
                throw error;
            }

            // Product must exist for new production records
            if (!production.product) {
                const error = new Error(
                    "Product information is missing for this production record."
                );
                error.statusCode = 400;
                throw error;
            }

            const product = production.product;

            // ------------------------------------------
            // VALIDATE PRODUCED QUANTITY
            // ------------------------------------------

            if (producedQuantity !== undefined) {
                const produced = Number(producedQuantity);

                if (
                    Number.isNaN(produced) ||
                    !Number.isFinite(produced) ||
                    produced < 0
                ) {
                    const error = new Error(
                        "Produced quantity must be a valid non-negative number."
                    );
                    error.statusCode = 400;
                    throw error;
                }

                if (produced > production.targetQuantity) {
                    const error = new Error(
                        "Produced quantity cannot exceed target quantity."
                    );
                    error.statusCode = 400;
                    throw error;
                }

                production.producedQuantity = produced;
            }

            // ------------------------------------------
            // VALIDATE REJECTED QUANTITY
            // ------------------------------------------

            if (rejectedQuantity !== undefined) {
                const rejected = Number(rejectedQuantity);

                if (
                    Number.isNaN(rejected) ||
                    !Number.isFinite(rejected) ||
                    rejected < 0
                ) {
                    const error = new Error(
                        "Rejected quantity must be a valid non-negative number."
                    );
                    error.statusCode = 400;
                    throw error;
                }

                production.rejectedQuantity = rejected;
            }

            const previousStatus = production.status;

            // ------------------------------------------
            // RE-CALCULATE MATERIAL USAGE ANALYSIS
            // ------------------------------------------

            const materialUsageAnalysis = [];

            for (const item of production.rawMaterials) {

                const material = await RawMaterial.findOne({
                    _id: item.rawMaterial,
                    factory: factoryId,
                    isActive: true
                }).session(session);

                if (!material) {
                    const error = new Error(
                        "Raw material not found in your factory."
                    );
                    error.statusCode = 404;
                    throw error;
                }

                const quantity = Number(item.quantity);

                if (
                    Number.isNaN(quantity) ||
                    !Number.isFinite(quantity) ||
                    quantity <= 0
                ) {
                    const error = new Error(
                        `Invalid raw material quantity for ${material.name}.`
                    );
                    error.statusCode = 400;
                    throw error;
                }

                // Find product standard
                const productStandard = product.rawMaterials.find(
                    standardItem =>
                        String(standardItem.rawMaterial._id) ===
                        String(item.rawMaterial)
                );

                if (!productStandard) {
                    const error = new Error(
                        `${material.name} is not defined in the raw material standard for ${product.name}.`
                    );
                    error.statusCode = 400;
                    throw error;
                }

                const actualUnit = (
                    item.unit || material.unit
                ).trim();

                const standardUnit =
                    productStandard.unit.trim();

                if (
                    actualUnit.toLowerCase() !==
                    standardUnit.toLowerCase()
                ) {
                    const error = new Error(
                        `Unit mismatch for ${material.name}. Product standard uses ${standardUnit}, but production uses ${actualUnit}.`
                    );
                    error.statusCode = 400;
                    throw error;
                }

                // Expected quantity according to product standard
                const expectedQuantity =
                    (
                        production.targetQuantity /
                        product.standardProductionQuantity
                    ) *
                    productStandard.standardQuantity;

                const difference =
                    quantity - expectedQuantity;

                const usagePercentage =
                    expectedQuantity > 0
                        ? (quantity / expectedQuantity) * 100
                        : 0;

                const usageStatus =
                    quantity <= expectedQuantity
                        ? "within_standard"
                        : "above_standard";

                materialUsageAnalysis.push({
                    rawMaterial: material._id,
                    expectedQuantity: Number(
                        expectedQuantity.toFixed(2)
                    ),
                    actualQuantity: Number(
                        quantity.toFixed(2)
                    ),
                    difference: Number(
                        difference.toFixed(2)
                    ),
                    usagePercentage: Number(
                        usagePercentage.toFixed(2)
                    ),
                    status: usageStatus,
                    unit: actualUnit
                });

                // ------------------------------------------
                // CONSUME STOCK WHEN COMPLETED
                // ------------------------------------------

                if (
                    status === "completed" &&
                    previousStatus !== "completed"
                ) {

                    if (material.currentStock < quantity) {
                        const error = new Error(
                            `Insufficient stock for ${material.name}. Available: ${material.currentStock} ${material.unit}`
                        );
                        error.statusCode = 400;
                        throw error;
                    }

                    const previousStock =
                        material.currentStock;

                    material.currentStock -= quantity;

                    await material.save({ session });

                    await InventoryMovement.create(
                        [
                            {
                                factory: factoryId,
                                rawMaterial: material._id,
                                machine: production.machine,
                                production: production._id,
                                movementType: "production_out",
                                quantity,
                                previousStock,
                                currentStock:
                                    material.currentStock,
                                referenceType: "production",
                                referenceId:
                                    production._id,
                                reason:
                                    "Raw material consumed for completed production",
                                notes:
                                    `Material used for production: ${production.productName}`,
                                createdBy
                            }
                        ],
                        { session }
                    );
                }
            }

            // Save updated usage analysis
            production.materialUsageAnalysis =
                materialUsageAnalysis;

            // Update status
            production.status = status;

            if (notes !== undefined) {
                production.notes = notes;
            }

            await production.save({ session });

            updatedProduction = production;
        });

        // ------------------------------------------
        // POPULATE AFTER SUCCESSFUL TRANSACTION
        // ------------------------------------------

        await updatedProduction.populate([
            {
                path: "machine",
                select: "name machineCode status"
            },
            {
                path: "product",
                select:
                    "name productCode unit standardProductionQuantity rawMaterials"
            },
            {
                path: "materialUsageAnalysis.rawMaterial",
                select: "name materialCode unit"
            },
            {
                path: "createdBy",
                select: "name email role"
            }
        ]);

        return res.json({
            success: true,
            message:
                "Production status updated successfully.",
            production: updatedProduction
        });

    } catch (error) {
        console.error(
            "Update Production Status Error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Server error while updating production status."
        });

    } finally {
        await session.endSession();
    }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    createProduction,
    getProductionRecords,
    getProductionById,
    updateProductionStatus
};