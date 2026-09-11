const mongoose = require("mongoose");

const inventoryMovementSchema = new mongoose.Schema(
    {
        factory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Factory",
            required: true
        },

        rawMaterial: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RawMaterial",
            required: true
        },
      
      machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Machine"
},

production: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Production"
},

        movementType: {
            type: String,
            enum: [
                "purchase_in",
                "production_out",
                "wastage_out",
                "manual_in",
                "manual_out",
                "adjustment"
            ],
            required: true
        },

        quantity: {
            type: Number,
            required: true
        },

        previousStock: {
            type: Number,
            required: true,
            min: 0
        },

        currentStock: {
            type: Number,
            required: true,
            min: 0
        },

        referenceType: {
            type: String,
            enum: [
                "purchase",
                "production",
                "manual",
                "adjustment"
            ],
            required: true
        },

        referenceId: {
            type: mongoose.Schema.Types.ObjectId
        },

        reason: {
            type: String,
            trim: true
        },

        notes: {
            type: String,
            trim: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

inventoryMovementSchema.index({
    factory: 1,
    rawMaterial: 1,
    createdAt: -1
});

inventoryMovementSchema.index({
    factory: 1,
    movementType: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "InventoryMovement",
    inventoryMovementSchema
);