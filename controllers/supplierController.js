const Supplier = require("../models/Supplier");

const createSupplier = async (req, res) => {
    try {
        const {
            name,
            supplierCode,
            contactPerson,
            phone,
            email,
            address,
            gstNumber,
            paymentTerms,
            notes
        } = req.body;

        if (!name || !supplierCode) {
            return res.status(400).json({
                success: false,
                message: "Supplier name and supplier code are required."
            });
        }

        if (!req.user.factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const code = supplierCode.toUpperCase();

        const existingSupplier = await Supplier.findOne({
            factory: req.user.factoryId,
            supplierCode: code
        });

        if (existingSupplier) {
            return res.status(409).json({
                success: false,
                message: "Supplier code already exists in this factory."
            });
        }

        const supplier = await Supplier.create({
            factory: req.user.factoryId,
            name,
            supplierCode: code,
            contactPerson,
            phone,
            email,
            address,
            gstNumber,
            paymentTerms,
            notes,
            createdBy: req.user.id
        });

        const populatedSupplier = await Supplier.findById(supplier._id)
            .populate("createdBy", "name email role");

        res.status(201).json({
            success: true,
            message: "Supplier created successfully.",
            supplier: populatedSupplier
        });

    } catch (error) {
        console.error("Create Supplier Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error while creating supplier."
        });
    }
};


const getSuppliers = async (req, res) => {
    try {
        if (!req.user.factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const suppliers = await Supplier.find({
            factory: req.user.factoryId,
            isActive: true
        })
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: suppliers.length,
            suppliers
        });

    } catch (error) {
        console.error("Get Suppliers Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error while fetching suppliers."
        });
    }
};


const getSupplierById = async (req, res) => {
    try {
        if (!req.user.factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const supplier = await Supplier.findOne({
            _id: req.params.id,
            factory: req.user.factoryId,
            isActive: true
        })
            .populate("createdBy", "name email role");

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found."
            });
        }

        res.json({
            success: true,
            supplier
        });

    } catch (error) {
    console.error("Get Supplier Error:", error.message);

    if (error.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: "Invalid supplier ID."
        });
    }

    res.status(500).json({
        success: false,
        message: "Server error while fetching supplier."
    });
}
};


const updateSupplier = async (req, res) => {
    try {
        if (!req.user.factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const allowedFields = [
            "name",
            "contactPerson",
            "phone",
            "email",
            "address",
            "gstNumber",
            "paymentTerms",
            "notes"
        ];

        const updateData = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields provided for update."
            });
        }

        const supplier = await Supplier.findOneAndUpdate(
            {
                _id: req.params.id,
                factory: req.user.factoryId,
                isActive: true
            },
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).populate("createdBy", "name email role");

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found."
            });
        }

        res.json({
            success: true,
            message: "Supplier updated successfully.",
            supplier
        });

    } catch (error) {
        console.error("Update Supplier Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error while updating supplier."
        });
    }
};


const deactivateSupplier = async (req, res) => {
    try {
        if (!req.user.factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const supplier = await Supplier.findOneAndUpdate(
            {
                _id: req.params.id,
                factory: req.user.factoryId,
                isActive: true
            },
            {
                isActive: false
            },
            {
                new: true
            }
        );

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found."
            });
        }

        res.json({
            success: true,
            message: "Supplier deactivated successfully.",
            supplier: {
                id: supplier._id,
                name: supplier.name,
                supplierCode: supplier.supplierCode,
                isActive: supplier.isActive
            }
        });

    } catch (error) {
        console.error("Deactivate Supplier Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error while deactivating supplier."
        });
    }
};


module.exports = {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deactivateSupplier
};