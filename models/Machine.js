const mongoose = require("mongoose");

const machineSchema = new mongoose.Schema(
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

        machineCode: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },

        machineType: {
            type: String,
            enum: [
                "computerized",
                "iot",
                "manual",
                "other"
            ],
            required: true
        },

        category: {
            type: String,
            trim: true
        },

        manufacturer: {
            type: String,
            trim: true
        },

        modelNumber: {
            type: String,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "running",
                "idle",
                "maintenance",
                "breakdown",
                "offline"
            ],
            default: "offline"
        },

        location: {
            type: String,
            trim: true
        },

        // For computerized/network-connected machines
        network: {
            ipAddress: {
                type: String,
                trim: true
            },

            port: {
                type: Number
            },

            protocol: {
                type: String,
                trim: true
            }
        },

        // For IoT-connected machines
        iot: {
            enabled: {
                type: Boolean,
                default: false
            },

            sensorId: {
                type: String,
                trim: true
            },

            sensorType: {
                type: String,
                trim: true
            }
        },

        lastMaintenanceDate: {
            type: Date
        },

        nextMaintenanceDate: {
            type: Date
        },

        lastHealthCheck: {
            type: Date
        },

        notes: {
            type: String,
            trim: true
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

machineSchema.index(
    { factory: 1, machineCode: 1 },
    { unique: true }
);

module.exports = mongoose.model("Machine", machineSchema);