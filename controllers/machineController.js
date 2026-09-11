const Machine = require("../models/Machine");
const Factory = require("../models/Factory");
const MachineEvent = require("../models/MachineEvent");

// ======================================================
// CREATE MACHINE
// ======================================================

const createMachine = async (req, res) => {
    try {
        const {
            name,
            machineCode,
            machineType,
            category,
            manufacturer,
            modelNumber,
            status,
            location,
            network,
            iot,
            lastMaintenanceDate,
            nextMaintenanceDate,
            notes
        } = req.body;

        const factoryId = req.user.factoryId;

        // Factory ID comes from authenticated user
        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        // Required fields
        if (!name || !machineCode || !machineType) {
            return res.status(400).json({
                success: false,
                message:
                    "Machine name, machine code and machine type are required."
            });
        }

        // Check factory
        const factory = await Factory.findOne({
            _id: factoryId,
            isActive: true
        });

        if (!factory) {
            return res.status(404).json({
                success: false,
                message: "Factory not found or inactive."
            });
        }

        const normalizedMachineCode = machineCode
            .trim()
            .toUpperCase();

        // Prevent duplicate machine code inside same factory
        const existingMachine = await Machine.findOne({
            factory: factoryId,
            machineCode: normalizedMachineCode,
            isActive: true
        });

        if (existingMachine) {
            return res.status(409).json({
                success: false,
                message: "Machine code already exists in this factory."
            });
        }

        // Create machine
        const machine = await Machine.create({
            factory: factoryId,
            name: name.trim(),
            machineCode: normalizedMachineCode,
            machineType,
            category,
            manufacturer,
            modelNumber,
            status: status || "offline",
            location,
            network,
            iot,
            lastMaintenanceDate,
            nextMaintenanceDate,
            notes,
            isActive: true
        });

        return res.status(201).json({
            success: true,
            message: "Machine created successfully.",
            machine
        });

    } catch (error) {
        console.error("Create Machine Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating machine."
        });
    }
};


// ======================================================
// GET ALL MACHINES
// ======================================================

const getMachines = async (req, res) => {
    try {
        const factoryId = req.user.factoryId;

        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const machines = await Machine.find({
            factory: factoryId,
            isActive: true
        }).sort({ createdAt: -1 });

        return res.json({
            success: true,
            count: machines.length,
            machines
        });

    } catch (error) {
        console.error("Get Machines Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching machines."
        });
    }
};


// ======================================================
// GET MACHINE BY ID
// ======================================================

const getMachineById = async (req, res) => {
    try {
        const factoryId = req.user.factoryId;

        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        // IMPORTANT:
        // Machine must belong to logged-in user's factory
        const machine = await Machine.findOne({
            _id: req.params.id,
            factory: factoryId,
            isActive: true
        });

        if (!machine) {
            return res.status(404).json({
                success: false,
                message: "Machine not found."
            });
        }

        return res.json({
            success: true,
            machine
        });

    } catch (error) {
        console.error("Get Machine Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching machine."
        });
    }
};


// ======================================================
// UPDATE MACHINE STATUS
// ======================================================

const updateMachineStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const factoryId = req.user.factoryId;

        const allowedStatuses = [
            "running",
            "idle",
            "maintenance",
            "breakdown",
            "offline"
        ];

        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid machine status."
            });
        }

        // IMPORTANT:
        // Only allow machine belonging to user's factory
        const machine = await Machine.findOne({
            _id: req.params.id,
            factory: factoryId,
            isActive: true
        });

        if (!machine) {
            return res.status(404).json({
                success: false,
                message: "Machine not found."
            });
        }

        const previousStatus = machine.status;

        machine.status = status;
        machine.lastHealthCheck = new Date();

        await machine.save();

        // Create event only when status actually changes
        if (previousStatus !== status) {
            await MachineEvent.create({
                machine: machine._id,
                factory: machine.factory,
                eventType:
                    status === "breakdown"
                        ? "breakdown"
                        : status === "maintenance"
                            ? "maintenance"
                            : "status_change",
                previousStatus,
                newStatus: status,
                reportedBy: req.user._id,
                startedAt: new Date()
            });
        }

        return res.json({
            success: true,
            message: "Machine status updated successfully.",
            machine: {
                id: machine._id,
                name: machine.name,
                machineCode: machine.machineCode,
                status: machine.status,
                lastHealthCheck: machine.lastHealthCheck
            }
        });

    } catch (error) {
        console.error("Update Machine Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating machine status."
        });
    }
};


// ======================================================
// GET MACHINE EVENTS
// ======================================================

const getMachineEvents = async (req, res) => {
    try {
        const { machineId } = req.params;
        const factoryId = req.user.factoryId;

        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        // IMPORTANT:
        // Check machine + factory together
        const machine = await Machine.findOne({
            _id: machineId,
            factory: factoryId,
            isActive: true
        });

        if (!machine) {
            return res.status(404).json({
                success: false,
                message: "Machine not found."
            });
        }

        const events = await MachineEvent.find({
            machine: machineId,
            factory: factoryId
        })
            .sort({ createdAt: -1 })
            .populate("reportedBy", "name email role");

        const eventsWithDuration = events.map((event) => {
            let downtimeMinutes = null;

            if (event.startedAt && event.resolvedAt) {
                downtimeMinutes = Math.round(
                    (event.resolvedAt - event.startedAt) /
                    (1000 * 60)
                );
            }

            return {
                ...event.toObject(),
                downtimeMinutes
            };
        });

        return res.json({
            success: true,
            count: eventsWithDuration.length,
            events: eventsWithDuration
        });

    } catch (error) {
        console.error("Get Machine Events Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching machine events."
        });
    }
};


// ======================================================
// RESOLVE MACHINE BREAKDOWN
// ======================================================

const resolveMachineBreakdown = async (req, res) => {
    try {
        const { reason, notes } = req.body;
        const factoryId = req.user.factoryId;

        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        // IMPORTANT:
        // Only machine belonging to user's factory
        const machine = await Machine.findOne({
            _id: req.params.id,
            factory: factoryId,
            isActive: true
        });

        if (!machine) {
            return res.status(404).json({
                success: false,
                message: "Machine not found."
            });
        }

        if (machine.status !== "breakdown") {
            return res.status(400).json({
                success: false,
                message: "Machine is not currently in breakdown."
            });
        }

        const breakdownEvent = await MachineEvent.findOne({
            machine: machine._id,
            factory: factoryId,
            eventType: "breakdown",
            resolvedAt: { $exists: false }
        }).sort({ startedAt: -1 });

        if (!breakdownEvent) {
            return res.status(404).json({
                success: false,
                message: "Active breakdown event not found."
            });
        }

        const resolvedAt = new Date();

        breakdownEvent.resolvedAt = resolvedAt;

        if (reason) {
            breakdownEvent.reason = reason.trim();
        }

        if (notes) {
            breakdownEvent.notes = notes.trim();
        }

        await breakdownEvent.save();

        // Restore machine
        machine.status = "running";
        machine.lastHealthCheck = resolvedAt;

        await machine.save();

        return res.json({
            success: true,
            message: "Machine breakdown resolved successfully.",
            machine: {
                id: machine._id,
                name: machine.name,
                machineCode: machine.machineCode,
                status: machine.status,
                lastHealthCheck: machine.lastHealthCheck
            },
            breakdown: {
                eventId: breakdownEvent._id,
                startedAt: breakdownEvent.startedAt,
                resolvedAt: breakdownEvent.resolvedAt,
                reason: breakdownEvent.reason,
                notes: breakdownEvent.notes
            }
        });

    } catch (error) {
        console.error("Resolve Machine Breakdown Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while resolving machine breakdown."
        });
    }
};

// ===============================
// MACHINE HEALTH CHECK
// ===============================
const healthCheckMachine = async (req, res) => {
    try {
        const { temperature, vibration, pressure } = req.body;

        const machine = await Machine.findOne({
            _id: req.params.id,
            factory: req.user.factoryId,
            isActive: true
        });

        if (!machine) {
            return res.status(404).json({
                success: false,
                message: "Machine not found"
            });
        }

        // Basic validation
        if (
            temperature === undefined &&
            vibration === undefined &&
            pressure === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "At least one health reading is required"
            });
        }

        // Health rules
        let healthStatus = "healthy";
        let reason = "Machine health is normal";

        if (
            (temperature !== undefined && temperature >= 90) ||
            (vibration !== undefined && vibration >= 8) ||
            (pressure !== undefined && pressure >= 180)
        ) {
            healthStatus = "critical";
            reason = "Critical machine health reading detected";
        } else if (
            (temperature !== undefined && temperature >= 75) ||
            (vibration !== undefined && vibration >= 5) ||
            (pressure !== undefined && pressure >= 150)
        ) {
            healthStatus = "warning";
            reason = "Abnormal machine health reading detected";
        }

        const healthCheckTime = new Date();

        // Update last health check time
        machine.lastHealthCheck = healthCheckTime;
        await machine.save();

        // Create health check event
       // Create health check event
const healthEvent = await MachineEvent.create({
    machine: machine._id,
    factory: req.user.factoryId,
    eventType: "health_check",
    reason: reason,
    reportedBy: req.user.id,
    startedAt: healthCheckTime,
    notes: JSON.stringify({
        temperature,
        vibration,
        pressure,
        healthStatus,
        alert:
            healthStatus === "critical"
                ? "CRITICAL: Immediate machine inspection required"
                : healthStatus === "warning"
                ? "WARNING: Machine inspection recommended"
                : null
    })
});

        res.status(200).json({
            success: true,
            message: "Machine health check completed",
            health: {
    machineId: machine._id,
    machineName: machine.name,
    healthStatus,
    temperature,
    vibration,
    pressure,
    checkedAt: healthCheckTime,
    alert:
        healthStatus === "critical"
            ? {
                  level: "critical",
                  message: "Immediate machine inspection required"
              }
            : healthStatus === "warning"
            ? {
                  level: "warning",
                  message: "Machine inspection recommended"
              }
            : null
},
            event: healthEvent
        });

    } catch (error) {
        console.error("Health check error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ======================================================
// GET MACHINE HEALTH ALERTS
// ======================================================

const getMachineHealthAlerts = async (req, res) => {
    try {
        const factoryId = req.user.factoryId;

        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const events = await MachineEvent.find({
            factory: factoryId,
            eventType: "health_check"
        })
            .sort({ createdAt: -1 })
            .populate(
                "machine",
                "name machineCode status isActive"
            )
            .populate(
                "reportedBy",
                "name email role"
            );

        // --------------------------------------------------
        // Keep only the LATEST health check of each machine
        // --------------------------------------------------

        const latestHealthByMachine = new Map();

        events.forEach((event) => {
            const machineId = event.machine?._id?.toString();

            if (!machineId) return;

            // Because events are sorted newest first,
            // the first event for a machine is its latest check.
            if (!latestHealthByMachine.has(machineId)) {
                latestHealthByMachine.set(machineId, event);
            }
        });

        const alerts = [];

        latestHealthByMachine.forEach((event) => {
            // Ignore deleted/inactive machines
            if (!event.machine || event.machine.isActive === false) {
                return;
            }

            let healthData = {};

            try {
                healthData = JSON.parse(event.notes || "{}");
            } catch (error) {
                healthData = {};
            }

            // Only current WARNING / CRITICAL status
            if (
                healthData.healthStatus !== "warning" &&
                healthData.healthStatus !== "critical"
            ) {
                return;
            }

            alerts.push({
                eventId: event._id,

                machineId: event.machine._id,
                machineName: event.machine.name,
                machineCode: event.machine.machineCode,
                machineStatus: event.machine.status,

                level: healthData.healthStatus,

                temperature: healthData.temperature,
                vibration: healthData.vibration,
                pressure: healthData.pressure,

                message:
                    healthData.healthStatus === "critical"
                        ? "Immediate machine inspection required"
                        : "Machine inspection recommended",

                reason: event.reason,
                reportedBy: event.reportedBy,
                createdAt: event.createdAt
            });
        });

        // --------------------------------------------------
        // Summary
        // --------------------------------------------------

        const criticalAlerts = alerts.filter(
            (alert) => alert.level === "critical"
        );

        const warningAlerts = alerts.filter(
            (alert) => alert.level === "warning"
        );

        return res.json({
            success: true,

            count: alerts.length,

            summary: {
                total: alerts.length,
                critical: criticalAlerts.length,
                warning: warningAlerts.length
            },

            alerts
        });

    } catch (error) {
        console.error("Get Machine Health Alerts Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching machine health alerts.",
            error: error.message
        });
    }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    createMachine,
    getMachines,
    getMachineById,
    updateMachineStatus,
    getMachineEvents,
    resolveMachineBreakdown,
    healthCheckMachine,
    getMachineHealthAlerts
};






// const Machine = require("../models/Machine");
// const Factory = require("../models/Factory");
// const MachineEvent = require("../models/MachineEvent");

// // ======================================================
// // CREATE MACHINE
// // ======================================================

// const createMachine = async (req, res) => {
//     try {
//         const {
//             name,
//             machineCode,
//             machineType,
//             category,
//             manufacturer,
//             modelNumber,
//             status,
//             location,
//             network,
//             iot,
//             lastMaintenanceDate,
//             nextMaintenanceDate,
//             notes
//         } = req.body;

//         // Factory comes ONLY from authenticated user
//         const factoryId = req.user.factoryId;

//         if (!factoryId || !name || !machineCode || !machineType) {
//             return res.status(400).json({
//                 success: false,
//                 message:
//                     "User factory, machine name, machine code and machine type are required."
//             });
//         }

//         // Check factory
//         const factory = await Factory.findOne({
//             _id: factoryId,
//             isActive: true
//         });

//         if (!factory) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Factory not found or inactive."
//             });
//         }

//         const normalizedMachineCode = machineCode.trim().toUpperCase();

//         // Prevent duplicate machine code inside same factory
//         const existingMachine = await Machine.findOne({
//             factory: factoryId,
//             machineCode: normalizedMachineCode
//         });

//         if (existingMachine) {
//             return res.status(409).json({
//                 success: false,
//                 message: "Machine code already exists in this factory."
//             });
//         }

//         // Create machine
//         const machine = await Machine.create({
//             factory: factoryId,
//             name: name.trim(),
//             machineCode: normalizedMachineCode,
//             machineType,
//             category,
//             manufacturer,
//             modelNumber,
//             status: status || "offline",
//             location,
//             network,
//             iot,
//             lastMaintenanceDate,
//             nextMaintenanceDate,
//             notes
//         });

//         return res.status(201).json({
//             success: true,
//             message: "Machine created successfully.",
//             machine
//         });

//     } catch (error) {
//         console.error("Create Machine Error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Server error while creating machine."
//         });
//     }
// };


// // ======================================================
// // GET ALL MACHINES
// // ======================================================

// const getMachines = async (req, res) => {
//     try {
//         // Never trust factoryId from query/body
//         const factoryId = req.user.factoryId;

//         if (!factoryId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "User is not assigned to a factory."
//             });
//         }

//         const machines = await Machine.find({
//             factory: factoryId,
//             isActive: true
//         }).sort({ createdAt: -1 });

//         return res.json({
//             success: true,
//             count: machines.length,
//             machines
//         });

//     } catch (error) {
//         console.error("Get Machines Error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Server error while fetching machines."
//         });
//     }
// };


// // ======================================================
// // GET MACHINE BY ID
// // ======================================================

// const getMachineById = async (req, res) => {
//     try {
//         const factoryId = req.user.factoryId;

//         if (!factoryId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "User is not assigned to a factory."
//             });
//         }

//         // IMPORTANT:
//         // Machine must belong to authenticated user's factory
//         const machine = await Machine.findOne({
//             _id: req.params.id,
//             factory: factoryId,
//             isActive: true
//         });

//         if (!machine) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Machine not found."
//             });
//         }

//         return res.json({
//             success: true,
//             machine
//         });

//     } catch (error) {
//         console.error("Get Machine Error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Server error while fetching machine."
//         });
//     }
// };


// // ======================================================
// // UPDATE MACHINE STATUS
// // ======================================================

// const updateMachineStatus = async (req, res) => {
//     try {
//         const { status } = req.body;
//         const factoryId = req.user.factoryId;

//         const allowedStatuses = [
//             "running",
//             "idle",
//             "maintenance",
//             "breakdown",
//             "offline"
//         ];

//         if (!factoryId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "User is not assigned to a factory."
//             });
//         }

//         if (!status || !allowedStatuses.includes(status)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid machine status."
//             });
//         }

//         // Machine must belong to authenticated user's factory
//         const machine = await Machine.findOne({
//             _id: req.params.id,
//             factory: factoryId,
//             isActive: true
//         });

//         if (!machine) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Machine not found."
//             });
//         }

//         const previousStatus = machine.status;

//         machine.status = status;
//         machine.lastHealthCheck = new Date();

//         await machine.save();

//         // Create event only when status actually changes
//         if (previousStatus !== status) {
//             await MachineEvent.create({
//                 machine: machine._id,
//                 factory: factoryId,
//                 eventType:
//                     status === "breakdown"
//                         ? "breakdown"
//                         : status === "maintenance"
//                             ? "maintenance"
//                             : "status_change",
//                 previousStatus,
//                 newStatus: status,
//                 reportedBy: req.user._id,
//                 startedAt: new Date()
//             });
//         }

//         return res.json({
//             success: true,
//             message: "Machine status updated successfully.",
//             machine: {
//                 id: machine._id,
//                 name: machine.name,
//                 machineCode: machine.machineCode,
//                 status: machine.status,
//                 lastHealthCheck: machine.lastHealthCheck
//             }
//         });

//     } catch (error) {
//         console.error("Update Machine Status Error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Server error while updating machine status."
//         });
//     }
// };


// // ======================================================
// // GET MACHINE EVENTS
// // ======================================================

// const getMachineEvents = async (req, res) => {
//     try {
//         const factoryId = req.user.factoryId;
//         const { machineId } = req.params;

//         if (!factoryId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "User is not assigned to a factory."
//             });
//         }

//         // Verify machine belongs to authenticated user's factory
//         const machine = await Machine.findOne({
//             _id: machineId,
//             factory: factoryId,
//             isActive: true
//         });

//         if (!machine) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Machine not found."
//             });
//         }

//         const events = await MachineEvent.find({
//             machine: machineId,
//             factory: factoryId
//         })
//             .sort({ createdAt: -1 })
//             .populate("reportedBy", "name email role");

//         const eventsWithDuration = events.map((event) => {
//             let downtimeMinutes = null;

//             if (event.startedAt && event.resolvedAt) {
//                 downtimeMinutes = Math.round(
//                     (event.resolvedAt - event.startedAt) /
//                     (1000 * 60)
//                 );
//             }

//             return {
//                 ...event.toObject(),
//                 downtimeMinutes
//             };
//         });

//         return res.json({
//             success: true,
//             count: eventsWithDuration.length,
//             events: eventsWithDuration
//         });

//     } catch (error) {
//         console.error("Get Machine Events Error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Server error while fetching machine events."
//         });
//     }
// };


// // ======================================================
// // RESOLVE MACHINE BREAKDOWN
// // ======================================================

// const resolveMachineBreakdown = async (req, res) => {
//     try {
//         const { reason, notes } = req.body;
//         const factoryId = req.user.factoryId;

//         if (!factoryId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "User is not assigned to a factory."
//             });
//         }

//         // Machine must belong to authenticated user's factory
//         const machine = await Machine.findOne({
//             _id: req.params.id,
//             factory: factoryId,
//             isActive: true
//         });

//         if (!machine) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Machine not found."
//             });
//         }

//         if (machine.status !== "breakdown") {
//             return res.status(400).json({
//                 success: false,
//                 message: "Machine is not currently in breakdown."
//             });
//         }

//         // Find active breakdown only inside same factory
//         const breakdownEvent = await MachineEvent.findOne({
//             machine: machine._id,
//             factory: factoryId,
//             eventType: "breakdown",
//             resolvedAt: { $exists: false }
//         }).sort({ startedAt: -1 });

//         if (!breakdownEvent) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Active breakdown event not found."
//             });
//         }

//         const resolvedAt = new Date();

//         breakdownEvent.resolvedAt = resolvedAt;

//         if (reason) {
//             breakdownEvent.reason = reason;
//         }

//         if (notes) {
//             breakdownEvent.notes = notes;
//         }

//         await breakdownEvent.save();

//         // Restore machine
//         machine.status = "running";
//         machine.lastHealthCheck = resolvedAt;

//         await machine.save();

//         return res.json({
//             success: true,
//             message: "Machine breakdown resolved successfully.",
//             machine: {
//                 id: machine._id,
//                 name: machine.name,
//                 machineCode: machine.machineCode,
//                 status: machine.status,
//                 lastHealthCheck: machine.lastHealthCheck
//             },
//             breakdown: {
//                 eventId: breakdownEvent._id,
//                 startedAt: breakdownEvent.startedAt,
//                 resolvedAt: breakdownEvent.resolvedAt,
//                 reason: breakdownEvent.reason,
//                 notes: breakdownEvent.notes
//             }
//         });

//     } catch (error) {
//         console.error("Resolve Machine Breakdown Error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Server error while resolving machine breakdown."
//         });
//     }
// };


// // ======================================================
// // EXPORTS
// // ======================================================

// module.exports = {
//     createMachine,
//     getMachines,
//     getMachineById,
//     updateMachineStatus,
//     getMachineEvents,
//     resolveMachineBreakdown
// };