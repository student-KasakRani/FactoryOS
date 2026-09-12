const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");


const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const factoryRoutes = require("./routes/factoryRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const machineRoutes = require("./routes/machineRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const rawMaterialRoutes = require("./routes/rawMaterialRoutes");
const productionRoutes = require("./routes/productionRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const inventoryMovementRoutes = require("./routes/inventoryMovementRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const productRoutes = require("./routes/productRoutes");

dotenv.config();

const app = express();

// ===============================
// DATABASE
// ===============================

connectDB();


// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/factories", factoryRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/raw-materials", rawMaterialRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/inventory-movements", inventoryMovementRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/products", productRoutes);

// ===============================
// HEALTH CHECK
// ===============================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "FactoryOS Backend is running 🚀"
    });
});

// ===============================
// SERVER
// ===============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`FactoryOS Backend running on port ${PORT}`);
});