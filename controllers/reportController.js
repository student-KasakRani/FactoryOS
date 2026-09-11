const Production = require("../models/Production");
const RawMaterial = require("../models/RawMaterial");
const Machine = require("../models/Machine");
const Purchase = require("../models/Purchase");
const InventoryMovement = require("../models/InventoryMovement");

// ======================================================
// PRODUCTION REPORT
// ======================================================

const getProductionReport = async (req, res) => {
    try {

        const factoryId = req.user.factoryId;

        const { startDate, endDate } = req.query;

        const filter = {
            factory: factoryId
        };

        // Date filtering
        if (startDate || endDate) {

            filter.productionDate = {};

            if (startDate) {
                filter.productionDate.$gte =
                    new Date(startDate);
            }

            if (endDate) {
                const end = new Date(endDate);

                end.setHours(23, 59, 59, 999);

                filter.productionDate.$lte = end;
            }
        }


        // Get production records
        const productions = await Production.find(filter)
            .populate(
                "machine",
                "name machineCode"
            )
            .sort({
                productionDate: -1
            });


        // Calculate totals
        const totalTargetQuantity =
            productions.reduce(
                (total, item) =>
                    total + item.targetQuantity,
                0
            );

        const totalProducedQuantity =
            productions.reduce(
                (total, item) =>
                    total + item.producedQuantity,
                0
            );

        const totalRejectedQuantity =
            productions.reduce(
                (total, item) =>
                    total + item.rejectedQuantity,
                0
            );


        // Production efficiency
        const efficiency =
            totalTargetQuantity > 0
                ? Number(
                    (
                        totalProducedQuantity /
                        totalTargetQuantity
                    * 100
                    ).toFixed(2)
                )
                : 0;


        return res.json({
            success: true,

            report: {

                summary: {
                    totalProductionRecords:
                        productions.length,

                    totalTargetQuantity,

                    totalProducedQuantity,

                    totalRejectedQuantity,

                    productionEfficiency:
                        efficiency
                },

                productions
            }
        });

    } catch (error) {

        console.error(
            "Production Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while generating production report."
        });
    }
};

// ======================================================
// INVENTORY REPORT
// ======================================================

const getInventoryReport = async (req, res) => {
    try {

        const factoryId = req.user.factoryId;

        // Get all active raw materials
        const rawMaterials = await RawMaterial.find({
            factory: factoryId,
            isActive: true
        }).sort({
            name: 1
        });


        // Low stock materials
        const lowStockMaterials = rawMaterials.filter(
            material =>
                material.currentStock <= material.reorderLevel
        );


        // Total inventory value
        const totalInventoryValue =
            rawMaterials.reduce(
                (total, material) =>
                    total +
                    (
                        material.currentStock *
                        material.unitCost
                    ),
                0
            );


        // Total current stock
        const totalStockQuantity =
            rawMaterials.reduce(
                (total, material) =>
                    total + material.currentStock,
                0
            );


        return res.json({
            success: true,

            report: {

                summary: {
                    totalRawMaterials:
                        rawMaterials.length,

                    lowStockCount:
                        lowStockMaterials.length,

                    totalStockQuantity,

                    totalInventoryValue
                },

                lowStockMaterials,

                rawMaterials
            }
        });

    } catch (error) {

        console.error(
            "Inventory Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while generating inventory report."
        });
    }
};

// ======================================================
// MACHINE REPORT
// ======================================================

const getMachineReport = async (req, res) => {
    try {

        const factoryId = req.user.factoryId;

        // Get all active machines
        const machines = await Machine.find({
            factory: factoryId,
            isActive: true
        }).sort({
            name: 1
        });


        // Machine status counts
        const runningMachines = machines.filter(
            machine => machine.status === "running"
        );

        const maintenanceMachines = machines.filter(
            machine => machine.status === "maintenance"
        );

        const stoppedMachines = machines.filter(
            machine => machine.status === "stopped"
        );


        return res.json({
            success: true,

            report: {

                summary: {
                    totalMachines: machines.length,
                    runningMachines: runningMachines.length,
                    maintenanceMachines: maintenanceMachines.length,
                    stoppedMachines: stoppedMachines.length
                },

                machines
            }
        });

    } catch (error) {

        console.error(
            "Machine Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while generating machine report."
        });
    }
};

// ======================================================
// WASTAGE REPORT
// ======================================================

const getWastageReport = async (req, res) => {
    try {

        const factoryId = req.user.factoryId;

        const { startDate, endDate } = req.query;

        const filter = {
            factory: factoryId,
            movementType: "wastage_out"
        };

        // Date filtering
        if (startDate || endDate) {

            filter.createdAt = {};

            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        // Get wastage movements
        const wastageMovements = await InventoryMovement.find(filter)
            .populate(
                "rawMaterial",
                "name materialCode unit unitCost"
            )
            .populate(
                "machine",
                "name machineCode status"
            )
            .populate(
                "production",
                "productName productionDate shift"
            )
            .populate(
                "createdBy",
                "name email role"
            )
            .sort({
                createdAt: -1
            });


        // Total wastage quantity
        const totalWastage = wastageMovements.reduce(
            (total, movement) =>
                total + movement.quantity,
            0
        );


        // Estimated wastage loss
        const estimatedWastageLoss =
            wastageMovements.reduce(
                (total, movement) => {

                    const unitCost =
                        movement.rawMaterial?.unitCost || 0;

                    return total +
                        (movement.quantity * unitCost);
                },
                0
            );


        // Material-wise wastage
        const materialWiseMap = {};

        wastageMovements.forEach(movement => {

            if (!movement.rawMaterial) return;

            const materialId =
                movement.rawMaterial._id.toString();

            if (!materialWiseMap[materialId]) {

                materialWiseMap[materialId] = {
                    rawMaterialId:
                        movement.rawMaterial._id,

                    materialName:
                        movement.rawMaterial.name,

                    materialCode:
                        movement.rawMaterial.materialCode,

                    unit:
                        movement.rawMaterial.unit,

                    totalWastage: 0,

                    estimatedLoss: 0
                };
            }

            materialWiseMap[materialId].totalWastage +=
                movement.quantity;

            materialWiseMap[materialId].estimatedLoss +=
                movement.quantity *
                (movement.rawMaterial.unitCost || 0);
        });


        const materialWise =
            Object.values(materialWiseMap);


        // Machine-wise wastage
        const machineWiseMap = {};

        wastageMovements.forEach(movement => {

            const machineId =
                movement.machine?._id
                    ? movement.machine._id.toString()
                    : "unassigned";


            if (!machineWiseMap[machineId]) {

                machineWiseMap[machineId] = {

                    machineId:
                        movement.machine?._id || null,

                    machineName:
                        movement.machine?.name ||
                        "Unassigned",

                    machineCode:
                        movement.machine?.machineCode ||
                        null,

                    totalWastage: 0,

                    estimatedLoss: 0
                };
            }


            machineWiseMap[machineId].totalWastage +=
                movement.quantity;


            const unitCost =
                movement.rawMaterial?.unitCost || 0;


            machineWiseMap[machineId].estimatedLoss +=
                movement.quantity * unitCost;
        });


        const machineWise =
            Object.values(machineWiseMap);


        // Total production material consumption
        const productionOutFilter = {
            factory: factoryId,
            movementType: "production_out"
        };


        if (startDate || endDate) {

            productionOutFilter.createdAt = {};

            if (startDate) {
                productionOutFilter.createdAt.$gte =
                    new Date(startDate);
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);

                productionOutFilter.createdAt.$lte = end;
            }
        }


        const productionOutMovements =
            await InventoryMovement.find(
                productionOutFilter
            ).select("quantity");


        const totalProductionConsumption =
            productionOutMovements.reduce(
                (total, movement) =>
                    total + movement.quantity,
                0
            );


        // Wastage percentage
        const totalMaterialUsage =
            totalProductionConsumption +
            totalWastage;


        const wastagePercentage =
            totalMaterialUsage > 0
                ? Number(
                    (
                        totalWastage /
                        totalMaterialUsage *
                        100
                    ).toFixed(2)
                )
                : 0;


        return res.json({
            success: true,

            report: {

                summary: {

                    totalWastage,

                    estimatedWastageLoss,

                    totalProductionConsumption,

                    totalMaterialUsage,

                    wastagePercentage
                },

                materialWise,

                machineWise,

                wastageMovements
            }
        });

    } catch (error) {

        console.error(
            "Wastage Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while generating wastage report."
        });
    }
};

// ======================================================
// PURCHASE REPORT
// ======================================================

const getPurchaseReport = async (req, res) => {
    try {

        const factoryId = req.user.factoryId;

        const purchases = await Purchase.find({
            factory: factoryId
        })
            .populate(
                "supplier",
                "name supplierCode"
            )
            .sort({
                orderDate: -1
            });


        // Status counts
        const pendingPurchases = purchases.filter(
            purchase => purchase.status === "pending"
        );

        const orderedPurchases = purchases.filter(
            purchase => purchase.status === "ordered"
        );

        const partiallyReceivedPurchases = purchases.filter(
            purchase => purchase.status === "partially_received"
        );

        const receivedPurchases = purchases.filter(
            purchase => purchase.status === "received"
        );


        // Total purchase amount
        const totalPurchaseAmount = purchases.reduce(
            (total, purchase) =>
                total + purchase.totalAmount,
            0
        );


        return res.json({
            success: true,

            report: {

                summary: {
                    totalPurchases: purchases.length,

                    pendingPurchases: pendingPurchases.length,

                    orderedPurchases: orderedPurchases.length,

                    partiallyReceivedPurchases:
                        partiallyReceivedPurchases.length,

                    receivedPurchases:
                        receivedPurchases.length,

                    totalPurchaseAmount
                },

                purchases
            }
        });

    } catch (error) {

        console.error(
            "Purchase Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while generating purchase report."
        });
    }
};

module.exports = {
    getProductionReport,
    getInventoryReport,
    getMachineReport,
    getPurchaseReport,
    getWastageReport
};