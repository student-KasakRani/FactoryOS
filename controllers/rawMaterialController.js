const RawMaterial = require("../models/RawMaterial");


// ======================================================
// CREATE RAW MATERIAL
// ======================================================

const createRawMaterial = async (req, res) => {
    try {
        const {
            name,
            materialCode,
            category,
            unit,
            currentStock,
            minimumStock,
            reorderLevel,
            unitCost,
            supplier,
            description
        } = req.body;

        if (!name || !materialCode || !unit) {
            return res.status(400).json({
                success: false,
                message: "Name, material code and unit are required."
            });
        }

        if (!req.user.factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const existingMaterial = await RawMaterial.findOne({
            factory: req.user.factoryId,
            materialCode: materialCode.toUpperCase()
        });

        if (existingMaterial) {
            return res.status(409).json({
                success: false,
                message: "Material code already exists in this factory."
            });
        }

        const rawMaterial = await RawMaterial.create({
            factory: req.user.factoryId,
            name,
            materialCode: materialCode.toUpperCase(),
            category,
            unit,
            currentStock: currentStock || 0,
            minimumStock: minimumStock || 0,
            reorderLevel: reorderLevel || 0,
            unitCost: unitCost || 0,
            supplier,
            description,
            createdBy: req.user.id
        });

        await rawMaterial.populate([
            {
                path: "createdBy",
                select: "name email role"
            },
            {
                path: "supplier",
                select: "name companyName email phone"
            }
        ]);

        return res.status(201).json({
            success: true,
            message: "Raw material created successfully.",
            rawMaterial
        });

    } catch (error) {
        console.error("Create Raw Material Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating raw material."
        });
    }
};


// ======================================================
// GET ALL RAW MATERIALS
// ======================================================

const getRawMaterials = async (req, res) => {
    try {
        const factoryId = req.user.factoryId;

        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const rawMaterials = await RawMaterial.find({
            factory: factoryId,
            isActive: true
        })
            .sort({ createdAt: -1 })
            .populate("createdBy", "name email role")
            .populate("supplier", "name companyName email phone");

        return res.json({
            success: true,
            count: rawMaterials.length,
            rawMaterials
        });

    } catch (error) {
        console.error("Get Raw Materials Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching raw materials."
        });
    }
};

const updateRawMaterialStock = async (req, res) => {
    try {
        const { quantity, operation, notes } = req.body;

        if (!quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0."
            });
        }

        if (!["add", "remove"].includes(operation)) {
            return res.status(400).json({
                success: false,
                message: "Operation must be either add or remove."
            });
        }

        const rawMaterial = await RawMaterial.findOne({
            _id: req.params.id,
            factory: req.user.factoryId,
            isActive: true
        });

        if (!rawMaterial) {
            return res.status(404).json({
                success: false,
                message: "Raw material not found."
            });
        }

        const previousStock = rawMaterial.currentStock;

        if (operation === "add") {
            rawMaterial.currentStock += Number(quantity);
        }

        if (operation === "remove") {
            if (Number(quantity) > rawMaterial.currentStock) {
                return res.status(400).json({
                    success: false,
                    message: "Insufficient stock."
                });
            }

            rawMaterial.currentStock -= Number(quantity);
        }

        await rawMaterial.save();

        let stockStatus = "healthy";

        if (rawMaterial.currentStock <= rawMaterial.reorderLevel) {
            stockStatus = "reorder_required";
        } else if (rawMaterial.currentStock <= rawMaterial.minimumStock) {
            stockStatus = "low";
        }

        return res.json({
            success: true,
            message: "Raw material stock updated successfully.",
            stock: {
                materialId: rawMaterial._id,
                materialCode: rawMaterial.materialCode,
                name: rawMaterial.name,
                previousStock,
                currentStock: rawMaterial.currentStock,
                unit: rawMaterial.unit,
                operation,
                quantity: Number(quantity),
                stockStatus,
                notes: notes || ""
            }
        });

    } catch (error) {
        console.error("Update Raw Material Stock Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating raw material stock."
        });
    }
};

const getLowStockMaterials = async (req, res) => {
    try {
        if (!req.user.factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const materials = await RawMaterial.find({
            factory: req.user.factoryId,
            isActive: true,
            $expr: {
                $lte: ["$currentStock", "$reorderLevel"]
            }
        })
            .populate("supplier", "name email phone")
            .sort({ currentStock: 1 });

        const alerts = materials.map(material => ({
            materialId: material._id,
            materialCode: material.materialCode,
            name: material.name,
            category: material.category,
            currentStock: material.currentStock,
            minimumStock: material.minimumStock,
            reorderLevel: material.reorderLevel,
            unit: material.unit,
            unitCost: material.unitCost,
            supplier: material.supplier || null,
            status: "reorder_required"
        }));

        res.json({
            success: true,
            count: alerts.length,
            alerts
        });

    } catch (error) {
        console.error("Get Low Stock Materials Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error while fetching low stock materials."
        });
    }
};

module.exports = {
    createRawMaterial,
    getRawMaterials,
    updateRawMaterialStock,
     getLowStockMaterials
};