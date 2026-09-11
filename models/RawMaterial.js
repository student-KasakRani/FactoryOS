const mongoose = require("mongoose");

const rawMaterialSchema = new mongoose.Schema(
    {
        factory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Factory",
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        materialCode: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },

        category: {
            type: String,
            trim: true
        },

        unit: {
            type: String,
            enum: [
                "kg",
                "gram",
                "ton",
                "liter",
                "piece",
                "meter"
            ],
            required: true
        },

        currentStock: {
            type: Number,
            default: 0,
            min: 0
        },

        minimumStock: {
            type: Number,
            default: 0,
            min: 0
        },

        reorderLevel: {
            type: Number,
            default: 0,
            min: 0
        },

        unitCost: {
            type: Number,
            default: 0,
            min: 0
        },

        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier"
        },

        description: {
            type: String,
            trim: true
        },

        isActive: {
            type: Boolean,
            default: true
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

rawMaterialSchema.index(
    { factory: 1, materialCode: 1 },
    { unique: true }
);

module.exports = mongoose.model("RawMaterial", rawMaterialSchema);