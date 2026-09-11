const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        factory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Factory",
            required: true
        },

        employeeId: {
            type: String,
            required: true,
            trim: true
        },

        department: {
            type: String,
            enum: [
                "Production",
                "Inventory",
                "Maintenance",
                "Accounts",
                "Management",
                "Quality",
                "Other"
            ],
            default: "Other"
        },

        designation: {
            type: String,
            trim: true
        },

        phone: {
            type: String,
            trim: true
        },

        joiningDate: {
            type: Date,
            default: Date.now
        },

        status: {
            type: String,
            enum: ["active", "inactive", "on_leave"],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);

employeeSchema.index(
    { factory: 1, employeeId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Employee", employeeSchema);