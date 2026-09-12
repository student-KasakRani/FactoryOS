const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
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

        productCode: {
            type: String,
            required: true,
            trim: true
        },

        unit: {
            type: String,
            default: "units",
            trim: true
        },

        standardProductionQuantity: {
            type: Number,
            required: true,
            min: 0
        },

        rawMaterials: [
            {
                rawMaterial: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "RawMaterial",
                    required: true
                },

                standardQuantity: {
                    type: Number,
                    required: true,
                    min: 0
                },

                unit: {
                    type: String,
                    required: true,
                    trim: true
                }
            }
        ],

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

productSchema.index(
    { factory: 1, productCode: 1 },
    { unique: true }
);

module.exports = mongoose.model("Product", productSchema);