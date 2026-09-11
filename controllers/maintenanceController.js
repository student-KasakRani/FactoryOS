const Maintenance = require("../models/Maintenance");
const Machine = require("../models/Machine");
const Factory = require("../models/Factory");
const User = require("../models/User");

// ======================================================
// CREATE MAINTENANCE TASK
// ======================================================

const createMaintenance = async (req, res) => {
    try {
        const {
            machineId,
            title,
            description,
            maintenanceType,
            priority,
            scheduledDate,
            estimatedCost,
            assignedTo
        } = req.body;

        const factoryId = req.user.factoryId;
        const createdBy = req.user._id || req.user.id;

        // Required fields
        if (
            !factoryId ||
            !createdBy ||
            !machineId ||
            !title ||
            !maintenanceType
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Factory, machine, title and maintenance type are required."
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

        // Check machine belongs to same factory
        const machine = await Machine.findOne({
            _id: machineId,
            factory: factoryId,
            isActive: true
        });

        if (!machine) {
            return res.status(404).json({
                success: false,
                message: "Machine not found in your factory."
            });
        }

        // Validate assigned employee if provided
        if (assignedTo) {
            const assignedUser = await User.findOne({
                _id: assignedTo,
                factoryId: factoryId,
                isActive: true
            });

            if (!assignedUser) {
                return res.status(400).json({
                    success: false,
                    message: "Assigned user does not belong to this factory."
                });
            }
        }

        // Create maintenance
        const maintenance = await Maintenance.create({
            machine: machineId,
            factory: factoryId,
            title,
            description,
            maintenanceType,
            priority: priority || "medium",
            status: "scheduled",
            assignedTo: assignedTo || undefined,
            scheduledDate,
            estimatedCost: estimatedCost || 0,
            actualCost: 0,
            createdBy
        });

        // Populate useful information
        await maintenance.populate([
            {
                path: "machine",
                select: "name machineCode status"
            },
            {
                path: "createdBy",
                select: "name email role"
            },
            {
                path: "assignedTo",
                select: "name email role"
            }
        ]);

        return res.status(201).json({
            success: true,
            message: "Maintenance task created successfully.",
            maintenance
        });

    } catch (error) {
        console.error("Create Maintenance Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating maintenance task."
        });
    }
};


// ======================================================
// GET ALL MAINTENANCE TASKS
// ======================================================

const getMaintenanceTasks = async (req, res) => {
    try {
        const factoryId = req.user.factoryId;

        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const maintenanceTasks = await Maintenance.find({
            factory: factoryId
        })
            .sort({ createdAt: -1 })
            .populate("machine", "name machineCode status")
            .populate("createdBy", "name email role")
            .populate("assignedTo", "name email role");

        return res.json({
            success: true,
            count: maintenanceTasks.length,
            maintenanceTasks
        });

    } catch (error) {
        console.error("Get Maintenance Tasks Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching maintenance tasks."
        });
    }
};


// ======================================================
// GET MAINTENANCE BY ID
// ======================================================

const getMaintenanceById = async (req, res) => {
    try {
        const factoryId = req.user.factoryId;

        if (!factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const maintenance = await Maintenance.findOne({
            _id: req.params.id,
            factory: factoryId
        })
            .populate("machine", "name machineCode status")
            .populate("createdBy", "name email role")
            .populate("assignedTo", "name email role");

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: "Maintenance task not found."
            });
        }

        return res.json({
            success: true,
            maintenance
        });

    } catch (error) {
        console.error("Get Maintenance By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching maintenance task."
        });
    }
};


// ======================================================
// UPDATE MAINTENANCE STATUS
// ======================================================

const updateMaintenanceStatus = async (req, res) => {
    try {
        const {
            status,
            actualCost,
            workNotes,
            assignedTo
        } = req.body;

        const factoryId = req.user.factoryId;

        const allowedStatuses = [
            "scheduled",
            "in_progress",
            "completed",
            "cancelled"
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
                message: "Invalid maintenance status."
            });
        }

        // Find maintenance only inside user's factory
        const maintenance = await Maintenance.findOne({
            _id: req.params.id,
            factory: factoryId
        });

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: "Maintenance task not found."
            });
        }

        // Validate assigned user if provided
        if (assignedTo) {
            const assignedUser = await User.findOne({
                _id: assignedTo,
                factoryId: factoryId,
                isActive: true
            });

            if (!assignedUser) {
                return res.status(400).json({
                    success: false,
                    message: "Assigned user does not belong to this factory."
                });
            }

            maintenance.assignedTo = assignedTo;
        }

        // Status
        maintenance.status = status;

        // Start time
        if (
            status === "in_progress" &&
            !maintenance.startedAt
        ) {
            maintenance.startedAt = new Date();
        }

        // Completion
        if (status === "completed") {
            maintenance.completedAt = new Date();

            if (actualCost !== undefined) {
                const cost = Number(actualCost);

                if (Number.isNaN(cost) || cost < 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Actual cost must be a valid positive number."
                    });
                }

                maintenance.actualCost = cost;
            }
        }

        // Actual cost for other statuses if supplied
        if (
            actualCost !== undefined &&
            status !== "completed"
        ) {
            const cost = Number(actualCost);

            if (Number.isNaN(cost) || cost < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Actual cost must be a valid positive number."
                });
            }

            maintenance.actualCost = cost;
        }

        // Work notes
        if (workNotes !== undefined) {
            maintenance.workNotes = workNotes;
        }

        await maintenance.save();

        await maintenance.populate([
            {
                path: "machine",
                select: "name machineCode status"
            },
            {
                path: "createdBy",
                select: "name email role"
            },
            {
                path: "assignedTo",
                select: "name email role"
            }
        ]);

        return res.json({
            success: true,
            message: "Maintenance status updated successfully.",
            maintenance
        });

    } catch (error) {
        console.error("Update Maintenance Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating maintenance status."
        });
    }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    createMaintenance,
    getMaintenanceTasks,
    getMaintenanceById,
    updateMaintenanceStatus
};







// const Machine = require("../models/Machine");
// const Factory = require("../models/Factory");
// const MachineEvent = require("../models/MachineEvent");

// ======================================================
// CREATE MACHINE
// ======================================================

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

//         // Factory comes from authenticated user
//         const factoryId = req.user.factoryId;

//         if (!factoryId || !name || !machineCode || !machineType) {
//             return res.status(400).json({
//                 success: false,
//                 message: "User factory, machine name, machine code and machine type are required."
//             });
//         }

//         // Check factory
//         const factory = await Factory.findById(factoryId);

//         if (!factory || !factory.isActive) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Factory not found or inactive."
//             });
//         }

        // Prevent duplicate machine code inside same factory
//         const existingMachine = await Machine.findOne({
//             factory: factoryId,
//             machineCode: machineCode.toUpperCase()
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
//             name,
//             machineCode: machineCode.toUpperCase(),
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

//         res.status(201).json({
//             success: true,
//             message: "Machine created successfully.",
//             machine
//         });

//     } catch (error) {
//         console.error("Create Machine Error:", error.message);

//         res.status(500).json({
//             success: false,
//             message: "Server error while creating machine."
//         });
//     }
// };


// ======================================================
// GET ALL MACHINES
// ======================================================

// const getMachines = async (req, res) => {
//     try {
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

//         res.json({
//             success: true,
//             count: machines.length,
//             machines
//         });

//     } catch (error) {
//         console.error("Get Machines Error:", error.message);

//         res.status(500).json({
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

//         res.json({
//             success: true,
//             machine
//         });

//     } catch (error) {
//         console.error("Get Machine Error:", error.message);

//         res.status(500).json({
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

//         // Find only inside user's factory
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

//         res.json({
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
//         console.error("Update Machine Status Error:", error.message);

//         res.status(500).json({
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

//         // Verify machine belongs to user's factory
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
//                     (event.resolvedAt - event.startedAt) / (1000 * 60)
//                 );
//             }

//             return {
//                 ...event.toObject(),
//                 downtimeMinutes
//             };
//         });

//         res.json({
//             success: true,
//             count: eventsWithDuration.length,
//             events: eventsWithDuration
//         });

//     } catch (error) {
//         console.error("Get Machine Events Error:", error.message);

//         res.status(500).json({
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

//         // Find machine only inside user's factory
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

//         // Find active breakdown event for this factory
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

//         res.json({
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
//         console.error("Resolve Machine Breakdown Error:", error.message);

//         res.status(500).json({
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