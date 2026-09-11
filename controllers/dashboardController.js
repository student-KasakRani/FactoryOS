const Machine = require("../models/Machine");
const RawMaterial = require("../models/RawMaterial");
const Purchase = require("../models/Purchase");
const Production = require("../models/Production");
const InventoryMovement = require("../models/InventoryMovement");


// ======================================================
// GET DASHBOARD SUMMARY
// ======================================================

const getDashboardSummary = async (req, res) => {
    try {

        const factoryId = req.user.factoryId;

        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }


        // ===============================
        // MACHINE SUMMARY
        // ===============================

        const totalMachines = await Machine.countDocuments({
            factory: factoryId,
            isActive: true
        });

        const runningMachines = await Machine.countDocuments({
            factory: factoryId,
            status: "running",
            isActive: true
        });

        const maintenanceMachines = await Machine.countDocuments({
            factory: factoryId,
            status: "maintenance",
            isActive: true
        });


        // ===============================
        // RAW MATERIAL SUMMARY
        // ===============================

        const totalRawMaterials = await RawMaterial.countDocuments({
            factory: factoryId,
            isActive: true
        });

        const lowStockMaterials = await RawMaterial.find({
            factory: factoryId,
            isActive: true,
            $expr: {
                $lte: [
                    "$currentStock",
                    "$reorderLevel"
                ]
            }
        }).select(
            "name materialCode currentStock reorderLevel unit"
        );


        // ===============================
        // PURCHASE SUMMARY
        // ===============================

        const pendingPurchases = await Purchase.countDocuments({
            factory: factoryId,
            status: {
                $in: [
                    "pending",
                    "ordered",
                    "partially_received"
                ]
            }
        });


        // ===============================
        // TODAY'S PRODUCTION
        // ===============================

        const today = new Date();

        const startOfToday = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

        const endOfToday = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1
        );

        const todaysProductions = await Production.find({
            factory: factoryId,
            productionDate: {
                $gte: startOfToday,
                $lt: endOfToday
            }
        });

        const todayProductionCount =
            todaysProductions.length;

        const todayProducedQuantity =
            todaysProductions.reduce(
                (total, production) =>
                    total + production.producedQuantity,
                0
            );


        // ===============================
        // RECENT INVENTORY MOVEMENTS
        // ===============================

        const recentInventoryMovements =
            await InventoryMovement.find({
                factory: factoryId
            })
                .sort({
                    createdAt: -1
                })
                .limit(5)
                .populate(
                    "rawMaterial",
                    "name materialCode unit"
                )
                .populate(
                    "createdBy",
                    "name role"
                );


        // ===============================
        // RESPONSE
        // ===============================

        return res.json({
            success: true,

            dashboard: {

                machines: {
                    total: totalMachines,
                    running: runningMachines,
                    maintenance: maintenanceMachines
                },

                inventory: {
                    totalRawMaterials,
                    lowStockCount:
                        lowStockMaterials.length,
                    lowStockMaterials
                },

                purchases: {
                    pending: pendingPurchases
                },

                production: {
                    todayCount:
                        todayProductionCount,
                    todayProducedQuantity
                },

                recentInventoryMovements
            }
        });

    } catch (error) {

        console.error(
            "Dashboard Summary Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching dashboard summary."
        });
    }
};


module.exports = {
    getDashboardSummary
};