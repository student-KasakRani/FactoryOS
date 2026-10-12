const mongoose = require("mongoose");

const productionSchema = new mongoose.Schema(
    {
        factory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Factory",
            required: true
        },

        machine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Machine",
            required: true
        },

        product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
},

        productionDate: {
            type: Date,
            required: true
        },

        shift: {
            type: String,
            enum: ["morning", "evening", "night"],
            required: true
        },

        productName: {
            type: String,
            required: true,
            trim: true
        },

        targetQuantity: {
            type: Number,
            required: true,
            min: 0
        },

        producedQuantity: {
            type: Number,
            required: true,
            min: 0
        },

        rejectedQuantity: {
            type: Number,
            default: 0,
            min: 0
        },

        unit: {
            type: String,
            default: "units",
            trim: true
        },

        status: {
            type: String,
            enum: ["planned", "in_progress", "completed", "cancelled"],
            default: "planned"
        },

        notes: {
            type: String,
            trim: true
        },

        rawMaterials: [
    {
        rawMaterial: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RawMaterial",
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 0
        },

        unit: {
            type: String,
            trim: true
        }
    }
],

      materialUsageAnalysis: [
    {
        rawMaterial: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RawMaterial",
            required: true
        },

        expectedQuantity: {
            type: Number,
            required: true,
            min: 0
        },

        actualQuantity: {
            type: Number,
            required: true,
            min: 0
        },

        difference: {
            type: Number,
            required: true
        },

        usagePercentage: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            enum: [
                "within_standard",
                "above_standard"
            ],
            required: true
        },

        unit: {
            type: String,
            required: true,
            trim: true
        }
    }
],

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

module.exports = mongoose.model("Production", productionSchema);