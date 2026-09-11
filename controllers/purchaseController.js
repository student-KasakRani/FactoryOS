const Purchase = require("../models/Purchase");
const Supplier = require("../models/Supplier");
const RawMaterial = require("../models/RawMaterial");
const InventoryMovement = require("../models/InventoryMovement");


// CREATE PURCHASE ORDER
const createPurchase = async (req, res) => {
    try {
        const {
            purchaseOrderNumber,
            supplier,
            expectedDeliveryDate,
            items,
            tax,
            notes
        } = req.body;

        if (!purchaseOrderNumber || !supplier || !items || !items.length) {
            return res.status(400).json({
                success: false,
                message: "Purchase order number, supplier and items are required."
            });
        }

        if (!req.user.factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const factoryId = req.user.factoryId;

        // Check supplier belongs to same factory
        const supplierExists = await Supplier.findOne({
            _id: supplier,
            factory: factoryId,
            isActive: true
        });

        if (!supplierExists) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found in this factory."
            });
        }

        let subtotal = 0;
        const purchaseItems = [];

        for (const item of items) {

            if (
                !item.rawMaterial ||
                !item.quantity ||
                item.quantity <= 0 ||
                item.unitCost === undefined ||
                item.unitCost < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid purchase item details."
                });
            }

            const material = await RawMaterial.findOne({
                _id: item.rawMaterial,
                factory: factoryId,
                isActive: true
            });

            if (!material) {
                return res.status(404).json({
                    success: false,
                    message: "Raw material not found in this factory."
                });
            }

            const itemTotal = item.quantity * item.unitCost;

            subtotal += itemTotal;

            purchaseItems.push({
                rawMaterial: material._id,
                quantity: item.quantity,
                unit: material.unit,
                unitCost: item.unitCost,
                receivedQuantity: 0
            });
        }

        const taxAmount = Number(tax) || 0;
        const totalAmount = subtotal + taxAmount;

        const existingPurchase = await Purchase.findOne({
            factory: factoryId,
            purchaseOrderNumber: purchaseOrderNumber.toUpperCase()
        });

        if (existingPurchase) {
            return res.status(409).json({
                success: false,
                message: "Purchase order number already exists in this factory."
            });
        }

        const purchase = await Purchase.create({
            factory: factoryId,
            purchaseOrderNumber: purchaseOrderNumber.toUpperCase(),
            supplier,
            expectedDeliveryDate,
            items: purchaseItems,
            subtotal,
            tax: taxAmount,
            totalAmount,
            status: "pending",
            notes,
            createdBy: req.user.id
        });

        const populatedPurchase = await Purchase.findById(purchase._id)
            .populate("supplier", "name supplierCode contactPerson phone email gstNumber")
            .populate("createdBy", "name email role")
            .populate("items.rawMaterial", "name materialCode unit currentStock");

        res.status(201).json({
            success: true,
            message: "Purchase order created successfully.",
            purchase: populatedPurchase
        });

    } catch (error) {
        console.error("Create Purchase Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error while creating purchase order."
        });
    }
};


// GET ALL PURCHASE ORDERS
const getPurchases = async (req, res) => {
    try {

        if (!req.user.factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const purchases = await Purchase.find({
            factory: req.user.factoryId
        })
            .populate(
                "supplier",
                "name supplierCode contactPerson phone email"
            )
            .populate(
                "createdBy",
                "name email role"
            )
            .populate(
                "items.rawMaterial",
                "name materialCode unit currentStock"
            )
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: purchases.length,
            purchases
        });

    } catch (error) {
        console.error("Get Purchases Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error while fetching purchase orders."
        });
    }
};


// GET PURCHASE BY ID
const getPurchaseById = async (req, res) => {
    try {

        if (!req.user.factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const purchase = await Purchase.findOne({
            _id: req.params.id,
            factory: req.user.factoryId
        })
            .populate(
                "supplier",
                "name supplierCode contactPerson phone email gstNumber address"
            )
            .populate(
                "createdBy",
                "name email role"
            )
            .populate(
                "items.rawMaterial",
                "name materialCode unit currentStock"
            );

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase order not found."
            });
        }

        res.json({
            success: true,
            purchase
        });

  } catch (error) {
    console.error("Get Purchase Error:", error.message);

    if (error.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: "Invalid purchase ID."
        });
    }

    res.status(500).json({
        success: false,
        message: "Server error while fetching purchase order."
    });
}
};


// UPDATE PURCHASE STATUS
const updatePurchaseStatus = async (req, res) => {
    try {

        const { status } = req.body;

        const allowedStatuses = [
            "draft",
            "pending",
            "ordered",
            "cancelled"
        ];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid purchase status."
            });
        }

        if (!req.user.factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const purchase = await Purchase.findOne({
            _id: req.params.id,
            factory: req.user.factoryId
        });

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase order not found."
            });
        }

        if (
            purchase.status === "received" ||
            purchase.status === "partially_received"
        ) {
            return res.status(400).json({
                success: false,
                message: "Received purchase order status cannot be changed this way."
            });
        }

        purchase.status = status;

        await purchase.save();

        res.json({
            success: true,
            message: "Purchase order status updated successfully.",
            purchase
        });

    } catch (error) {
        console.error("Update Purchase Status Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error while updating purchase order."
        });
    }
};


// RECEIVE PURCHASE MATERIAL
const receivePurchase = async (req, res) => {
    try {

        const { items } = req.body;

        if (!items || !items.length) {
            return res.status(400).json({
                success: false,
                message: "Received items are required."
            });
        }

        if (!req.user.factoryId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned to a factory."
            });
        }

        const purchase = await Purchase.findOne({
            _id: req.params.id,
            factory: req.user.factoryId
        });

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase order not found."
            });
        }

        if (purchase.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cancelled purchase order cannot receive material."
            });
        }

        if (purchase.status === "received") {
            return res.status(400).json({
                success: false,
                message: "Purchase order is already fully received."
            });
        }

        for (const receivedItem of items) {

            const purchaseItem = purchase.items.id(receivedItem.itemId);

            if (!purchaseItem) {
                return res.status(404).json({
                    success: false,
                    message: "Purchase item not found."
                });
            }

            const quantity = Number(receivedItem.quantity);

            if (!quantity || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Received quantity must be greater than zero."
                });
            }

            const remainingQuantity =
                purchaseItem.quantity - purchaseItem.receivedQuantity;

            if (quantity > remainingQuantity) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot receive more than remaining quantity. Remaining: ${remainingQuantity}`
                });
            }

            const material = await RawMaterial.findOne({
                _id: purchaseItem.rawMaterial,
                factory: req.user.factoryId,
                isActive: true
            });

            if (!material) {
                return res.status(404).json({
                    success: false,
                    message: "Raw material not found."
                });
            }

           // Store previous stock before updating
const previousStock = material.currentStock;

// Update purchase received quantity
purchaseItem.receivedQuantity += quantity;

// Automatically increase stock
material.currentStock += quantity;

await material.save();

// Create inventory movement history
await InventoryMovement.create({
    factory: req.user.factoryId,
    rawMaterial: material._id,
    movementType: "purchase_in",
    quantity,
    previousStock,
    currentStock: material.currentStock,
    referenceType: "purchase",
    referenceId: purchase._id,
    reason: "Purchase material received",
    notes: `Received ${quantity} ${material.unit} from purchase order ${purchase.purchaseOrderNumber}`,
    createdBy: req.user.id
});
        }

        // Check overall receiving status
        let totalOrdered = 0;
        let totalReceived = 0;

        purchase.items.forEach((item) => {
            totalOrdered += item.quantity;
            totalReceived += item.receivedQuantity;
        });

        if (totalReceived === 0) {
            purchase.status = "pending";
        } else if (totalReceived < totalOrdered) {
            purchase.status = "partially_received";
        } else {
            purchase.status = "received";
        }

        await purchase.save();

        const updatedPurchase = await Purchase.findById(purchase._id)
            .populate(
                "supplier",
                "name supplierCode contactPerson phone email"
            )
            .populate(
                "items.rawMaterial",
                "name materialCode unit currentStock"
            );

        res.json({
            success: true,
            message: "Purchase material received and stock updated successfully.",
            purchase: updatedPurchase
        });

    } catch (error) {
        console.error("Receive Purchase Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error while receiving purchase material."
        });
    }
};

// ===============================
// VERIFY SUPPLIER BILL
// ===============================

const verifySupplierBill = async (req, res) => {
    try {
        const { actualBillAmount } = req.body;

        if (actualBillAmount === undefined || actualBillAmount === null) {
            return res.status(400).json({
                success: false,
                message: "Actual bill amount is required."
            });
        }

        if (Number(actualBillAmount) < 0) {
            return res.status(400).json({
                success: false,
                message: "Actual bill amount cannot be negative."
            });
        }

        const purchase = await Purchase.findOne({
            _id: req.params.id,
            factory: req.user.factoryId
        });

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase order not found."
            });
        }

        const expectedAmount = purchase.totalAmount;
        const actualAmount = Number(actualBillAmount);

        const difference = actualAmount - expectedAmount;

        purchase.actualBillAmount = actualAmount;
        purchase.billingDifference = difference;

        // Allow a tiny decimal difference
        if (Math.abs(difference) < 0.01) {
            purchase.billingStatus = "verified";
        } else {
            purchase.billingStatus = "billing_mismatch";
        }

        await purchase.save();

        return res.status(200).json({
            success: true,
            message:
                purchase.billingStatus === "verified"
                    ? "Bill verified successfully. No billing mismatch found."
                    : "Billing mismatch detected!",
            billing: {
                purchaseOrderNumber: purchase.purchaseOrderNumber,
                expectedAmount,
                actualBillAmount: actualAmount,
                difference,
                billingStatus: purchase.billingStatus
            }
        });

    } catch (error) {
    console.error(
        "Verify Supplier Bill Error:",
        error.message
    );

    if (error.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: "Invalid purchase ID."
        });
    }

    return res.status(500).json({
        success: false,
        message:
            "Server error while verifying supplier bill."
    });
}
};


module.exports = {
    createPurchase,
    getPurchases,
    getPurchaseById,
    updatePurchaseStatus,
    receivePurchase,
    verifySupplierBill
};