const mongoose = require("mongoose");

const purchaseItemSchema = new mongoose.Schema(
    {
        rawMaterial: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RawMaterial",
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 0.01
        },

        unit: {
            type: String,
            required: true,
            trim: true
        },

        unitCost: {
            type: Number,
            required: true,
            min: 0
        },

        receivedQuantity: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    { _id: true }
);

const purchaseSchema = new mongoose.Schema(
    {
        factory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Factory",
            required: true
        },

        purchaseOrderNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },

        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: true
        },

        orderDate: {
            type: Date,
            default: Date.now
        },

        expectedDeliveryDate: {
            type: Date
        },

        items: {
            type: [purchaseItemSchema],
            required: true,
            validate: {
                validator: function (items) {
                    return items.length > 0;
                },
                message: "Purchase order must contain at least one item."
            }
        },

        subtotal: {
            type: Number,
            default: 0,
            min: 0
        },

        tax: {
            type: Number,
            default: 0,
            min: 0
        },

        totalAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        status: {
            type: String,
            enum: [
                "draft",
                "pending",
                "ordered",
                "partially_received",
                "received",
                "cancelled"
            ],
            default: "draft"
        },

        notes: {
            type: String,
            trim: true
        },

      // ===============================
// SUPPLIER BILLING VERIFICATION
// ===============================

actualBillAmount: {
    type: Number,
    default: null,
    min: 0
},

billingStatus: {
    type: String,
    enum: [
        "not_verified",
        "verified",
        "billing_mismatch"
    ],
    default: "not_verified"
},

billingDifference: {
    type: Number,
    default: 0
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

purchaseSchema.index(
    { factory: 1, purchaseOrderNumber: 1 },
    { unique: true }
);

module.exports = mongoose.model("Purchase", purchaseSchema);