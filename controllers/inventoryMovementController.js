const InventoryMovement = require("../models/InventoryMovement");
const RawMaterial = require("../models/RawMaterial");
const Machine = require("../models/Machine");
const Production = require("../models/Production");


// ===============================
// CREATE INVENTORY MOVEMENT
// ===============================
const createInventoryMovement = async (req, res) => {
    try {
        const {
            rawMaterialId,
            movementType,
            quantity,
            referenceType,
            referenceId,
            machineId,
            productionId,
            reason,
            notes
        } = req.body;


        // Basic validation
        if (
            !rawMaterialId ||
            !movementType ||
           quantity === undefined ||
            !referenceType
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Raw material, movement type, quantity and reference type are required."
            });
        }


       if (movementType !== "adjustment" && quantity <= 0) {
    return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0."
    });
}

if (movementType === "adjustment" && Number(quantity) === 0) {
    return res.status(400).json({
        success: false,
        message: "Adjustment quantity cannot be zero."
    });
}


        // Check factory
        if (!req.user.factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }


        // Find raw material
        const rawMaterial = await RawMaterial.findOne({
            _id: rawMaterialId,
            factory: req.user.factoryId,
            isActive: true
        });


        if (!rawMaterial) {
            return res.status(404).json({
                success: false,
                message: "Raw material not found."
            });
        }
       
        // ===============================
// VALIDATE MACHINE
// ===============================
let machine = null;

if (machineId) {
    machine = await Machine.findOne({
        _id: machineId,
        factory: req.user.factoryId,
        isActive: true
    });

    if (!machine) {
        return res.status(404).json({
            success: false,
            message: "Machine not found."
        });
    }
}


// ===============================
// VALIDATE PRODUCTION
// ===============================
let production = null;

if (productionId) {
    production = await Production.findOne({
        _id: productionId,
        factory: req.user.factoryId
    });

    if (!production) {
        return res.status(404).json({
            success: false,
            message: "Production record not found."
        });
    }
}

        const previousStock = rawMaterial.currentStock;
        let currentStock;


        // ===============================
        // STOCK IN
        // ===============================
        if (
            movementType === "purchase_in" ||
            movementType === "manual_in"
        ) {
            currentStock = previousStock + Number(quantity);
        }


        // ===============================
        // STOCK OUT
        // ===============================
        else if (
            movementType === "production_out" ||
              movementType === "wastage_out" ||
            movementType === "manual_out"
        ) {

            if (Number(quantity) > previousStock) {
                return res.status(400).json({
                    success: false,
                    message: "Insufficient stock."
                });
            }

            currentStock = previousStock - Number(quantity);
        }


        // ===============================
        // ADJUSTMENT
        // ===============================
        else if (movementType === "adjustment") {

            const adjustment = Number(quantity);

            if (adjustment === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Adjustment quantity cannot be zero."
                });
            }

            currentStock = previousStock + adjustment;

            if (currentStock < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Stock cannot become negative."
                });
            }
        }


        else {
            return res.status(400).json({
                success: false,
                message: "Invalid movement type."
            });
        }


        // Update raw material stock
        rawMaterial.currentStock = currentStock;

        await rawMaterial.save();


        // Create movement history
       const movement = await InventoryMovement.create({
    factory: req.user.factoryId,
    rawMaterial: rawMaterial._id,
    machine: machine ? machine._id : undefined,
    production: production ? production._id : undefined,
    movementType,
   quantity:
  movementType === "adjustment"
    ? Number(quantity)
    : Math.abs(Number(quantity)),
    previousStock,
    currentStock,
    referenceType,
    referenceId,
    reason,
    notes,
    createdBy: req.user.id
});


        // Populate response
        await movement.populate([
    {
        path: "rawMaterial",
        select: "name materialCode unit currentStock unitCost"
    },
    {
        path: "machine",
        select: "name machineCode status"
    },
    {
        path: "production",
        select: "productName productionDate shift"
    },
    {
        path: "createdBy",
        select: "name email role"
    }
]);


        res.status(201).json({
            success: true,
            message: "Inventory movement created successfully.",
            movement
        });


    } catch (error) {

        console.error(
            "Create Inventory Movement Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while creating inventory movement."
        });
    }
};



// ===============================
// GET INVENTORY MOVEMENTS
// ===============================
const getInventoryMovements = async (req, res) => {
    try {

        if (!req.user.factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }


        const { rawMaterialId, movementType } = req.query;


        const filter = {
            factory: req.user.factoryId
        };


        if (rawMaterialId) {
            filter.rawMaterial = rawMaterialId;
        }


        if (movementType) {
            filter.movementType = movementType;
        }


        const movements = await InventoryMovement.find(filter)
            .populate(
                "rawMaterial",
                "name materialCode unit currentStock"
            )
            .populate(
                "createdBy",
                "name email role"
            )
            .sort({ createdAt: -1 });


        res.json({
            success: true,
            count: movements.length,
            movements
        });


    } catch (error) {

        console.error(
            "Get Inventory Movements Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while fetching inventory movements."
        });
    }
};



// ===============================
// GET MOVEMENT BY ID
// ===============================
const getInventoryMovementById = async (req, res) => {
    try {

        const movement = await InventoryMovement.findOne({
            _id: req.params.id,
            factory: req.user.factoryId
        })
            .populate(
                "rawMaterial",
                "name materialCode unit currentStock"
            )
            .populate(
                "createdBy",
                "name email role"
            );


        if (!movement) {
            return res.status(404).json({
                success: false,
                message: "Inventory movement not found."
            });
        }


        res.json({
            success: true,
            movement
        });


    } catch (error) {

        console.error(
            "Get Inventory Movement Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while fetching inventory movement."
        });
    }
};



module.exports = {
    createInventoryMovement,
    getInventoryMovements,
    getInventoryMovementById
};