// ===============================
// FactoryOS Demo / Dummy Data
// ===============================


// ===============================
// DASHBOARD
// ===============================

const dashboardData = {

    totalProduction: 12480,

    todaysRevenue: 284750,

    activeMachines: 18,

    totalMachines: 24,

    stockItems: 36,

    lowStockItems: 4,

    wastage: 2.8

};


// ===============================
// INVENTORY / RAW MATERIAL
// ===============================

const inventoryData = [

    {
        id: "RM001",
        name: "Plastic Granules",
        category: "Raw Material",
        stock: 1250,
        unit: "kg",
        minimumStock: 1000,
        status: "In Stock",
        wastage: 2.4
    },

    {
        id: "RM002",
        name: "Printing Ink",
        category: "Consumable",
        stock: 180,
        unit: "L",
        minimumStock: 250,
        status: "Low Stock",
        wastage: 4.8
    },

    {
        id: "RM003",
        name: "Packaging Material",
        category: "Packaging",
        stock: 6200,
        unit: "pcs",
        minimumStock: 3000,
        status: "In Stock",
        wastage: 1.7
    },

    {
        id: "RM004",
        name: "Aluminium Sheets",
        category: "Raw Material",
        stock: 420,
        unit: "kg",
        minimumStock: 500,
        status: "Low Stock",
        wastage: 3.2
    },

    {
        id: "RM005",
        name: "Adhesive",
        category: "Consumable",
        stock: 320,
        unit: "L",
        minimumStock: 200,
        status: "In Stock",
        wastage: 2.1
    },

    {
        id: "RM006",
        name: "Cardboard Rolls",
        category: "Packaging",
        stock: 1450,
        unit: "pcs",
        minimumStock: 800,
        status: "In Stock",
        wastage: 1.3
    }

];


// ===============================
// MACHINES
// ===============================

const machinesData = [

    {
        id: "M001",
        name: "Extruder Machine",
        status: "Running",
        temperature: 78,
        efficiency: 96,
        rpm: 1450,
        lastUpdated: "08 Aug 2026, 09:15 AM"
    },

    {
        id: "M002",
        name: "Printing Machine",
        status: "Breakdown Alert",
        temperature: 92,
        efficiency: 68,
        rpm: 1120,
        lastUpdated: "08 Aug 2026, 10:42 AM"
    },

    {
        id: "M003",
        name: "Cutting Machine",
        status: "Running",
        temperature: 64,
        efficiency: 91,
        rpm: 1280,
        lastUpdated: "08 Aug 2026, 11:05 AM"
    },

    {
        id: "M004",
        name: "Packaging Machine",
        status: "Breakdown Alert",
        temperature: 87,
        efficiency: 72,
        rpm: 980,
        lastUpdated: "08 Aug 2026, 11:38 AM"
    },

    {
        id: "M005",
        name: "Sealing Machine",
        status: "Running",
        temperature: 59,
        efficiency: 94,
        rpm: 1350,
        lastUpdated: "08 Aug 2026, 12:10 PM"
    }

];


// ===============================
// MACHINE BREAKDOWN ALERTS
// ===============================

const machineAlerts = [

    {
        machineId: "M002",
        machineName: "Printing Machine",
        status: "Breakdown Alert",
        timestamp: "10:42 AM"
    },

    {
        machineId: "M004",
        machineName: "Packaging Machine",
        status: "Breakdown Alert",
        timestamp: "11:38 AM"
    }

];