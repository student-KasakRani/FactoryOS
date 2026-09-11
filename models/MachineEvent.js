const mongoose = require("mongoose");

const machineEventSchema = new mongoose.Schema(
    {
        machine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Machine",
            required: true
        },

        factory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Factory",
            required: true
        },

        eventType: {
            type: String,
            enum: [
                "status_change",
                "breakdown",
                "maintenance",
                "health_check"
            ],
            required: true
        },

        previousStatus: {
            type: String,
            trim: true
        },

        newStatus: {
            type: String,
            trim: true
        },

        reason: {
            type: String,
            trim: true
        },

        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        startedAt: {
            type: Date,
            default: Date.now
        },

        resolvedAt: {
            type: Date
        },

        notes: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("MachineEvent", machineEventSchema);