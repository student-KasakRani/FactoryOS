const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },

        factory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Factory",
            required: true
        },

        date: {
            type: Date,
            required: true
        },

        shift: {
            type: String,
            enum: ["morning", "evening", "night"],
            required: true
        },

        status: {
            type: String,
            enum: ["present", "absent", "on_leave"],
            required: true
        },

        checkIn: {
            type: Date
        },

        checkOut: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

attendanceSchema.index(
    { employee: 1, date: 1 },
    { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);