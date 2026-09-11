const mongoose = require("mongoose");

const factorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        factoryCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        industry: {
            type: String,
            default: "Plastic & Packaging"
        },

        address: {
            type: String,
            trim: true
        },

        city: {
            type: String,
            trim: true
        },

        state: {
            type: String,
            trim: true
        },

        country: {
            type: String,
            default: "India"
        },

        contactNumber: {
            type: String,
            trim: true
        },

        email: {
            type: String,
            trim: true,
            lowercase: true
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Factory", factorySchema);