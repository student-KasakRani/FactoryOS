const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema(
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

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        maintenanceType: {
            type: String,
            enum: [
                "preventive",
                "corrective",
                "breakdown",
                "routine"
            ],
            required: true
        },

        priority: {
            type: String,
            enum: [
                "low",
                "medium",
                "high",
                "critical"
            ],
            default: "medium"
        },

        status: {
            type: String,
            enum: [
                "scheduled",
                "in_progress",
                "completed",
                "cancelled"
            ],
            default: "scheduled"
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        scheduledDate: {
            type: Date
        },

        startedAt: {
            type: Date
        },

        completedAt: {
            type: Date
        },

        estimatedCost: {
            type: Number,
            default: 0,
            min: 0
        },

        actualCost: {
            type: Number,
            default: 0,
            min: 0
        },

        workNotes: {
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

module.exports = mongoose.model("Maintenance", maintenanceSchema);