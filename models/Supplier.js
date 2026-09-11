const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
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

        supplierCode: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },

        contactPerson: {
            type: String,
            trim: true
        },

        phone: {
            type: String,
            trim: true
        },

        email: {
            type: String,
            trim: true,
            lowercase: true
        },

        address: {
            type: String,
            trim: true
        },

        gstNumber: {
            type: String,
            trim: true,
            uppercase: true
        },

        paymentTerms: {
            type: String,
            trim: true
        },

        notes: {
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

supplierSchema.index(
    { factory: 1, supplierCode: 1 },
    { unique: true }
);

module.exports = mongoose.model("Supplier", supplierSchema);