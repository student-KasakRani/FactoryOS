// ======================================================
// FACTORYOS - DASHBOARD
// REAL BACKEND DATA
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    const apiBase = "http://localhost:5000/api";

    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");

    const loadingBox =
        document.getElementById("dashboardLoading");

    const errorBox =
        document.getElementById("dashboardError");


    // --------------------------------------------------
    // AUTH HEADER
    // --------------------------------------------------

    function getHeaders() {

        return {
            "Content-Type": "application/json",
            ...(token
                ? {
                    Authorization: `Bearer ${token}`
                }
                : {})
        };

    }


    // --------------------------------------------------
    // API REQUEST
    // --------------------------------------------------

    async function apiRequest(endpoint) {

        const response = await fetch(
            `${apiBase}${endpoint}`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to fetch dashboard data."
            );

        }

        return data;

    }


    // --------------------------------------------------
    // NUMBER FORMAT
    // --------------------------------------------------

    function formatNumber(value) {

        return Number(value || 0)
            .toLocaleString("en-IN");

    }


    // --------------------------------------------------
    // DISPLAY ERROR
    // --------------------------------------------------

    function showError(message) {

        if (!errorBox) return;

        errorBox.textContent = message;
        errorBox.classList.remove("hidden");

    }


    // --------------------------------------------------
    // STOCK ALERTS
    // --------------------------------------------------

    function renderStockAlerts(materials) {

        const list =
            document.getElementById(
                "stockAlertsList"
            );

        const badge =
            document.getElementById(
                "stockAlertBadge"
            );

        if (!list) return;

        list.innerHTML = "";

        const count =
            materials.length;

        if (badge) {
            badge.textContent = count;
        }


        if (count === 0) {

            list.innerHTML = `
                <div class="rounded-xl bg-emerald-50 border border-emerald-200 p-4">

                    <div class="flex items-center gap-3">

                        <div class="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <i class="fas fa-check"></i>
                        </div>

                        <div>

                            <p class="font-semibold text-emerald-800">
                                Stock looks healthy
                            </p>

                            <p class="text-xs text-emerald-600 mt-1">
                                No raw materials are below reorder level.
                            </p>

                        </div>

                    </div>

                </div>
            `;

            return;

        }


        materials.forEach(material => {

            const div =
                document.createElement("div");

            div.className =
                "rounded-xl bg-red-50 border border-red-200 p-4";


            div.innerHTML = `

                <div class="flex items-start justify-between gap-3">

                    <div>

                        <p class="font-semibold text-slate-800">
                            ${material.name}
                        </p>

                        <p class="text-sm text-red-600 mt-1">
                            ${formatNumber(material.currentStock)}
                            ${material.unit}
                            remaining
                        </p>

                    </div>

                    <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                        Low Stock
                    </span>

                </div>

            `;

            list.appendChild(div);

        });

    }


    // --------------------------------------------------
    // RECENT ACTIVITY
    // --------------------------------------------------

    function renderRecentActivity(movements) {

        const list =
            document.getElementById(
                "recentActivityList"
            );

        if (!list) return;

        list.innerHTML = "";


        if (!movements.length) {

            list.innerHTML = `
                <p class="text-sm text-slate-500">
                    No recent inventory activity.
                </p>
            `;

            return;

        }


        movements
            .slice(0, 5)
            .forEach(movement => {

                const isOut =
                    movement.movementType ===
                    "production_out";


                const iconClass =
                    isOut
                        ? "fa-arrow-down"
                        : "fa-arrow-up";


                const iconContainer =
                    isOut
                        ? "bg-red-50 text-red-600"
                        : "bg-emerald-50 text-emerald-600";


                const div =
                    document.createElement("div");


                div.className =
                    "flex items-start gap-3";


                div.innerHTML = `

                    <div class="w-9 h-9 rounded-lg ${iconContainer} flex items-center justify-center flex-shrink-0">

                        <i class="fas ${iconClass}"></i>

                    </div>


                    <div class="min-w-0">

                        <p class="text-sm font-semibold text-slate-800 truncate">

                            ${movement.rawMaterial?.name || "Raw Material"}

                        </p>


                        <p class="text-xs text-slate-500 mt-1">

                            ${movement.movementType}

                            ·

                            ${formatNumber(movement.quantity)}
                            ${movement.rawMaterial?.unit || ""}

                        </p>

                    </div>

                `;


                list.appendChild(div);

            });

    }


    // --------------------------------------------------
    // PRODUCTION CHART
    // --------------------------------------------------

    let productionChart = null;


    function renderProductionChart(records) {

        const canvas =
            document.getElementById(
                "productionChart"
            );

        if (!canvas) return;


        if (productionChart) {

            productionChart.destroy();

        }


        const today =
            new Date();


        today.setHours(
            0,
            0,
            0,
            0
        );


        const lastSevenDays = [];


        for (let i = 6; i >= 0; i--) {

            const date =
                new Date(today);


            date.setDate(
                today.getDate() - i
            );


            lastSevenDays.push(date);

        }


        const labels =
            lastSevenDays.map(date => {

                return date.toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short"
                    }
                );

            });


        const values =
            lastSevenDays.map(date => {

                const dateKey =
                    date.toISOString()
                        .split("T")[0];


                return records
                    .filter(record => {

                        const recordDate =
                            new Date(
                                record.productionDate
                            )
                            .toISOString()
                            .split("T")[0];

                        return recordDate === dateKey;

                    })
                    .reduce(
                        (
                            total,
                            record
                        ) =>
                            total +
                            Number(
                                record.producedQuantity || 0
                            ),
                        0
                    );

            });


        productionChart =
            new Chart(
                canvas,
                {
                    type: "line",

                    data: {

                        labels,

                        datasets: [
                            {
                                label:
                                    "Production",

                                data:
                                    values,

                                borderColor:
                                    "#0891b2",

                                backgroundColor:
                                    "rgba(8,145,178,0.10)",

                                fill: true,

                                tension: 0.35,

                                pointRadius: 4,

                                pointHoverRadius: 6,

                                borderWidth: 2

                            }
                        ]

                    },


                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        plugins: {

                            legend: {
                                display: false
                            }

                        },


                        scales: {

                            x: {

                                grid: {
                                    display: false
                                },

                                ticks: {
                                    color: "#64748b"
                                }

                            },


                            y: {

                                beginAtZero: true,

                                grid: {
                                    color:
                                        "#e2e8f0"
                                },

                                ticks: {
                                    color:
                                        "#64748b"
                                }

                            }

                        }

                    }

                }
            );

    }


    // --------------------------------------------------
    // LOAD DASHBOARD
    // --------------------------------------------------

    async function loadDashboard() {

        try {

            // ------------------------------------------
            // TOKEN CHECK
            // ------------------------------------------

            if (!token) {

                throw new Error(
                    "Login required. Please login first."
                );

            }


            // ------------------------------------------
            // PARALLEL API CALLS
            // ------------------------------------------

            const [
                dashboardResponse,
                productionResponse,
                wastageResponse
            ] = await Promise.all([

                apiRequest(
                    "/dashboard"
                ),

                apiRequest(
                    "/production"
                ),

                apiRequest(
                    "/reports/wastage"
                )

            ]);


            const dashboard =
                dashboardResponse.dashboard ||
                {};


            const productionRecords =
                productionResponse.productionRecords ||
                [];


            // ------------------------------------------
            // KPI DATA
            // ------------------------------------------

            const productionToday =
                dashboard.production?.todayProducedQuantity ||
                0;


            const todayCount =
                dashboard.production?.todayCount ||
                0;


            const runningMachines =
                dashboard.machines?.running ||
                0;


            const totalMachines =
                dashboard.machines?.total ||
                0;


            const maintenanceMachines =
                dashboard.machines?.maintenance ||
                0;


            const lowStockCount =
                dashboard.inventory?.lowStockCount ||
                0;


            const totalRawMaterials =
                dashboard.inventory?.totalRawMaterials ||
                0;


            const pendingPurchases =
                dashboard.purchases?.pending ||
                0;


            // ------------------------------------------
            // UPDATE KPI CARDS
            // ------------------------------------------

            document.getElementById(
                "todayProduction"
            ).textContent =
                formatNumber(
                    productionToday
                );


            document.getElementById(
                "todayProductionMeta"
            ).textContent =
                `${todayCount} production record${todayCount === 1 ? "" : "s"} today`;


            document.getElementById(
                "runningMachines"
            ).textContent =
                formatNumber(
                    runningMachines
                );


            document.getElementById(
                "machineMeta"
            ).textContent =
                `${totalMachines} total machine${totalMachines === 1 ? "" : "s"}`;


            document.getElementById(
                "lowStockCount"
            ).textContent =
                formatNumber(
                    lowStockCount
                );


            document.getElementById(
                "stockMeta"
            ).textContent =
                `${totalRawMaterials} raw material${totalRawMaterials === 1 ? "" : "s"} tracked`;


            document.getElementById(
                "pendingPurchases"
            ).textContent =
                formatNumber(
                    pendingPurchases
                );


            document.getElementById(
                "purchaseMeta"
            ).textContent =
                pendingPurchases === 0
                    ? "No purchase orders pending"
                    : "Purchase orders need attention";


            // ------------------------------------------
            // MACHINE OVERVIEW
            // ------------------------------------------

            document.getElementById(
                "machineRunningValue"
            ).textContent =
                formatNumber(
                    runningMachines
                );


            document.getElementById(
                "machineMaintenanceValue"
            ).textContent =
                formatNumber(
                    maintenanceMachines
                );


            document.getElementById(
                "machineTotalValue"
            ).textContent =
                formatNumber(
                    totalMachines
                );


            // ------------------------------------------
            // STOCK ALERTS
            // ------------------------------------------

            renderStockAlerts(
                dashboard.inventory?.lowStockMaterials ||
                []
            );


            // ------------------------------------------
            // RECENT ACTIVITY
            // ------------------------------------------

            renderRecentActivity(
                dashboard.recentInventoryMovements ||
                []
            );


            // ------------------------------------------
            // PRODUCTION CHART
            // ------------------------------------------

            renderProductionChart(
                productionRecords
            );


            // ------------------------------------------
            // WASTAGE
            // ------------------------------------------

            const wastage =
                wastageResponse.report ||
                wastageResponse.wastageReport ||
                wastageResponse;


            const wastagePercentage =
                Number(
                    wastage.wastagePercentage ||
                    0
                );


            const estimatedLoss =
                Number(
                    wastage.estimatedLoss ||
                    0
                );


            document.getElementById(
                "wastagePercentage"
            ).textContent =
                `${wastagePercentage.toFixed(2)}%`;


            document.getElementById(
                "wastageDetails"
            ).textContent =
                `Estimated material loss: ₹${estimatedLoss.toLocaleString("en-IN")}`;


            // ------------------------------------------
            // USER INFO
            // ------------------------------------------

            try {

                const storedUser =
                    JSON.parse(
                        localStorage.getItem(
                            "user"
                        )
                    );


                if (storedUser) {

                    const name =
                        storedUser.name ||
                        "Factory Admin";


                    const role =
                        storedUser.role ||
                        "Administrator";


                    document.getElementById(
                        "userName"
                    ).textContent =
                        name;


                    document.getElementById(
                        "userRole"
                    ).textContent =
                        role;


                    document.getElementById(
                        "userAvatar"
                    ).textContent =
                        name
                            .charAt(0)
                            .toUpperCase();

                }

            } catch (error) {

                console.warn(
                    "User information unavailable."
                );

            }


            // ------------------------------------------
            // HIDE LOADING
            // ------------------------------------------

            if (loadingBox) {

                loadingBox.classList.add(
                    "hidden"
                );

            }

        } catch (error) {

            console.error(
                "Dashboard Load Error:",
                error
            );


            if (loadingBox) {

                loadingBox.classList.add(
                    "hidden"
                );

            }


            showError(
                error.message ||
                "Unable to load dashboard data."
            );

        }

    }


    // --------------------------------------------------
    // START
    // --------------------------------------------------

    loadDashboard();

});



// =========================================
// FACTORYOS - INVENTORY PAGE
// PART 1
// Data + Table + Cards + Search
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------------------
    // Inventory Data
    // -----------------------------------------

    let inventory = JSON.parse(
        localStorage.getItem("factoryInventory")
    ) || [

        {
            id: "MAT001",
            name: "Plastic Granules",
            category: "Raw Material",
            quantity: 950,
            unit: "Kg",
            minimum: 300,
            supplier: "ABC Polymers",
            price: 250
        },

        {
            id: "MAT002",
            name: "Printing Ink",
            category: "Chemical",
            quantity: 80,
            unit: "L",
            minimum: 100,
            supplier: "ColorTech",
            price: 800
        },

        {
            id: "MAT003",
            name: "Packaging Rolls",
            category: "Packing",
            quantity: 420,
            unit: "Rolls",
            minimum: 120,
            supplier: "Pack India",
            price: 275
        },

        {
            id: "MAT004",
            name: "Adhesive",
            category: "Chemical",
            quantity: 120,
            unit: "Kg",
            minimum: 150,
            supplier: "ChemSupply",
            price: 450
        },

        {
            id: "MAT005",
            name: "Packaging Labels",
            category: "Packing",
            quantity: 60,
            unit: "Boxes",
            minimum: 100,
            supplier: "LabelPro",
            price: 180
        }

    ];


    // -----------------------------------------
    // Save Inventory
    // -----------------------------------------

    function saveInventory() {

        localStorage.setItem(
            "factoryInventory",
            JSON.stringify(inventory)
        );

    }


    // -----------------------------------------
    // Find Inventory Table
    // -----------------------------------------

    const tableBody =
        document.querySelector("table tbody");


    const searchInput =
        document.querySelector(
            'input[placeholder="Search Material..."]'
        );


    // -----------------------------------------
    // Status
    // -----------------------------------------

    function getInventoryStatus(item) {

        if (item.quantity <= item.minimum) {

            return `
                <span class="bg-red-500/20 text-red-400
                    px-3 py-1 rounded-full text-sm">
                    Low Stock
                </span>
            `;

        }


        return `
            <span class="bg-green-500/20 text-green-400
                px-3 py-1 rounded-full text-sm">
                In Stock
            </span>
        `;

    }


    // -----------------------------------------
    // Render Inventory Table
    // -----------------------------------------

    function renderInventory(list = inventory) {

        if (!tableBody) return;


        tableBody.innerHTML = "";


        if (list.length === 0) {

            tableBody.innerHTML = `
                <tr>

                    <td
                        colspan="7"
                        class="p-8 text-center text-slate-400">

                        No materials found

                    </td>

                </tr>
            `;

            updateInventoryCards();

            return;
        }


        list.forEach(item => {

            const row =
                document.createElement("tr");


            row.className =
                "border-t border-slate-800 hover:bg-slate-800/50";


            row.innerHTML = `

                <td class="p-4">
                    ${item.name}
                </td>

                <td>
                    ${item.category}
                </td>

                <td>
                    ${item.quantity} ${item.unit}
                </td>

                <td>
                    ${item.minimum} ${item.unit}
                </td>

                <td>
                    ${item.supplier}
                </td>

                <td>
                    ${getInventoryStatus(item)}
                </td>

                <td class="text-center">

                    <div class="flex justify-center gap-3">

                        <button
                            class="inventory-view
                            text-cyan-400
                            hover:text-cyan-300
                            hover:scale-110
                            transition"
                            data-id="${item.id}"
                            title="View">

                            <i class="fas fa-eye"></i>

                        </button>


                        <button
                            class="inventory-edit
                            text-yellow-400
                            hover:text-yellow-300
                            hover:scale-110
                            transition"
                            data-id="${item.id}"
                            title="Edit">

                            <i class="fas fa-pen"></i>

                        </button>


                        <button
                            class="inventory-delete
                            text-red-400
                            hover:text-red-300
                            hover:scale-110
                            transition"
                            data-id="${item.id}"
                            title="Delete">

                            <i class="fas fa-trash"></i>

                        </button>

                    </div>

                </td>

            `;


            tableBody.appendChild(row);

        });


        updateInventoryCards();

       

    }


    // -----------------------------------------
    // Update Inventory Cards
    // -----------------------------------------

    function updateInventoryCards() {

        const cards =
            document.querySelectorAll(
                "section .grid.grid-cols-4 > div"
            );


        if (cards.length < 4) return;


        // Total Materials

        cards[0]
            .querySelector("h2")
            .textContent =
                inventory.length;


        cards[0]
            .querySelector("p:last-child")
            .textContent =
                "+ This Month";


        // Low Stock

        const lowStock =
            inventory.filter(
                item =>
                    item.quantity <= item.minimum
            ).length;


        cards[1]
            .querySelector("h2")
            .textContent =
                lowStock;


        cards[1]
            .querySelector("p:last-child")
            .textContent =
                lowStock > 0
                    ? "Need Reorder"
                    : "Stock Healthy";


        // Suppliers

        const suppliers =
            new Set(
                inventory.map(
                    item => item.supplier
                )
            ).size;


        cards[2]
            .querySelector("h2")
            .textContent =
                suppliers;


        cards[2]
            .querySelector("p:last-child")
            .textContent =
                "Active Vendors";


        // Inventory Value

        const totalValue =
            inventory.reduce(
                (total, item) =>
                    total +
                    (item.quantity * item.price),
                0
            );


        let valueText;


        if (totalValue >= 100000) {

            valueText =
                "₹" +
                (totalValue / 100000)
                    .toFixed(1) +
                "L";

        } else {

            valueText =
                "₹" +
                totalValue.toLocaleString("en-IN");

        }


        cards[3]
            .querySelector("h2")
            .textContent =
                valueText;


        cards[3]
            .querySelector("p:last-child")
            .textContent =
                "Current Value";

    }


    // -----------------------------------------
    // Search Material
    // -----------------------------------------

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                const value =
                    searchInput.value
                        .toLowerCase()
                        .trim();


                const filtered =
                    inventory.filter(item =>

                        item.id
                            .toLowerCase()
                            .includes(value)

                        ||

                        item.name
                            .toLowerCase()
                            .includes(value)

                        ||

                        item.category
                            .toLowerCase()
                            .includes(value)

                        ||

                        item.supplier
                            .toLowerCase()
                            .includes(value)

                    );


                renderInventory(filtered);

            }
        );

    }


    // -----------------------------------------
    // Initial Render
    // -----------------------------------------

    renderInventory();


    console.log(
        "FactoryOS Inventory - Part 1 Loaded"
    );




// =========================================
// FACTORYOS - INVENTORY PAGE
// PART 2
// Add + View + Edit + Delete
// =========================================

// -----------------------------------------
// Add Material Button
// -----------------------------------------

const addMaterialButton = [...document.querySelectorAll("button")]
    .find(button =>
        button.textContent.trim().includes("Add Material")
    );


// -----------------------------------------
// Create Material Modal
// -----------------------------------------

function createMaterialModal(title = "Add Material") {

    const oldModal =
        document.getElementById("inventoryMaterialModal");

    if (oldModal) {
        oldModal.remove();
    }


    const modal =
        document.createElement("div");

    modal.id =
        "inventoryMaterialModal";

    modal.className =
        "fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6";


    modal.innerHTML = `

        <div class="bg-slate-900 border border-slate-700
                    rounded-2xl w-full max-w-xl p-6 shadow-2xl">

            <div class="flex justify-between items-center mb-6">

                <h2 class="text-2xl font-bold">
                    ${title}
                </h2>

                <button
                    type="button"
                    id="closeInventoryModal"
                    class="text-slate-400 hover:text-white text-xl">

                    <i class="fas fa-xmark"></i>

                </button>

            </div>


            <form
                id="inventoryMaterialForm"
                class="space-y-4">


                <input
                    id="inventoryMaterialId"
                    type="text"
                    placeholder="Material ID (e.g. MAT006)"
                    required
                    class="w-full bg-slate-800 border border-slate-700
                    rounded-xl px-4 py-3 outline-none
                    focus:border-cyan-400">


                <input
                    id="inventoryMaterialName"
                    type="text"
                    placeholder="Material Name"
                    required
                    class="w-full bg-slate-800 border border-slate-700
                    rounded-xl px-4 py-3 outline-none
                    focus:border-cyan-400">


                <select
                    id="inventoryMaterialCategory"
                    class="w-full bg-slate-800 border border-slate-700
                    rounded-xl px-4 py-3 outline-none
                    focus:border-cyan-400">

                    <option value="Raw Material">
                        Raw Material
                    </option>

                    <option value="Chemical">
                        Chemical
                    </option>

                    <option value="Packing">
                        Packing
                    </option>

                    <option value="Finished Material">
                        Finished Material
                    </option>

                </select>


                <div class="grid grid-cols-2 gap-4">

                    <input
                        id="inventoryMaterialQuantity"
                        type="number"
                        min="0"
                        placeholder="Quantity"
                        required
                        class="w-full bg-slate-800 border border-slate-700
                        rounded-xl px-4 py-3 outline-none
                        focus:border-cyan-400">


                    <input
                        id="inventoryMaterialUnit"
                        type="text"
                        placeholder="Unit (Kg / L / Rolls)"
                        required
                        class="w-full bg-slate-800 border border-slate-700
                        rounded-xl px-4 py-3 outline-none
                        focus:border-cyan-400">

                </div>


                <input
                    id="inventoryMaterialMinimum"
                    type="number"
                    min="0"
                    placeholder="Minimum Stock"
                    required
                    class="w-full bg-slate-800 border border-slate-700
                    rounded-xl px-4 py-3 outline-none
                    focus:border-cyan-400">


                <input
                    id="inventoryMaterialSupplier"
                    type="text"
                    placeholder="Supplier Name"
                    required
                    class="w-full bg-slate-800 border border-slate-700
                    rounded-xl px-4 py-3 outline-none
                    focus:border-cyan-400">


                <input
                    id="inventoryMaterialPrice"
                    type="number"
                    min="0"
                    placeholder="Price per Unit (₹)"
                    required
                    class="w-full bg-slate-800 border border-slate-700
                    rounded-xl px-4 py-3 outline-none
                    focus:border-cyan-400">


                <button
                    id="inventoryMaterialSubmit"
                    type="submit"
                    class="w-full bg-cyan-500 hover:bg-cyan-600
                    py-3 rounded-xl font-semibold">

                    ${title === "Edit Material"
                        ? "Save Changes"
                        : "Add Material"}

                </button>

            </form>

        </div>

    `;


    document.body.appendChild(modal);


    // -----------------------------------------
    // Close Modal
    // -----------------------------------------

    document
        .getElementById("closeInventoryModal")
        .addEventListener(
            "click",
            closeMaterialModal
        );


    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {
                closeMaterialModal();
            }

        }
    );


    // -----------------------------------------
    // Form Submit
    // -----------------------------------------

    document
        .getElementById("inventoryMaterialForm")
        .addEventListener(
            "submit",
            handleMaterialSubmit
        );

}


// -----------------------------------------
// Open Add Material Modal
// -----------------------------------------

function openAddMaterialModal() {

    createMaterialModal("Add Material");


    const form =
        document.getElementById(
            "inventoryMaterialForm"
        );


    form.removeAttribute("data-editing-id");


    form.reset();


    document
        .getElementById("inventoryMaterialId")
        .focus();

}


// -----------------------------------------
// Close Material Modal
// -----------------------------------------

function closeMaterialModal() {

    const modal =
        document.getElementById(
            "inventoryMaterialModal"
        );


    if (modal) {
        modal.remove();
    }

}


// -----------------------------------------
// Add Material Button
// -----------------------------------------

if (addMaterialButton) {

    addMaterialButton.addEventListener(
        "click",
        openAddMaterialModal
    );

}


// -----------------------------------------
// Handle Add / Edit
// -----------------------------------------

function handleMaterialSubmit(event) {

    event.preventDefault();


    const form =
        event.target;


    const id =
        document
            .getElementById(
                "inventoryMaterialId"
            )
            .value
            .trim();


    const name =
        document
            .getElementById(
                "inventoryMaterialName"
            )
            .value
            .trim();


    const category =
        document
            .getElementById(
                "inventoryMaterialCategory"
            )
            .value;


    const quantity =
        Number(
            document
                .getElementById(
                    "inventoryMaterialQuantity"
                )
                .value
        );


    const unit =
        document
            .getElementById(
                "inventoryMaterialUnit"
            )
            .value
            .trim();


    const minimum =
        Number(
            document
                .getElementById(
                    "inventoryMaterialMinimum"
                )
                .value
        );


    const supplier =
        document
            .getElementById(
                "inventoryMaterialSupplier"
            )
            .value
            .trim();


    const price =
        Number(
            document
                .getElementById(
                    "inventoryMaterialPrice"
                )
                .value
        );


    if (
        !id ||
        !name ||
        !unit ||
        !supplier
    ) {

        alert(
            "Please fill all material details."
        );

        return;

    }


    if (
        quantity < 0 ||
        minimum < 0 ||
        price < 0
    ) {

        alert(
            "Quantity, minimum stock and price cannot be negative."
        );

        return;

    }


    // -----------------------------------------
    // EDIT MATERIAL
    // -----------------------------------------

    const editingId =
        form.dataset.editingId;


    if (editingId) {

        const material =
            inventory.find(
                item =>
                    item.id === editingId
            );


        if (!material) {

            alert(
                "Material not found."
            );

            return;

        }


        // Check duplicate ID

        const duplicate =
            inventory.some(
                item =>
                    item.id.toLowerCase() ===
                    id.toLowerCase() &&
                    item.id !== editingId
            );


        if (duplicate) {

            alert(
                "Another material already uses this ID."
            );

            return;

        }


        material.id =
            id;

        material.name =
            name;

        material.category =
            category;

        material.quantity =
            quantity;

        material.unit =
            unit;

        material.minimum =
            minimum;

        material.supplier =
            supplier;

        material.price =
            price;


        saveInventory();


        renderInventory();


        closeMaterialModal();


        alert(
            `${material.name} updated successfully!`
        );


        return;

    }


    // -----------------------------------------
    // ADD NEW MATERIAL
    // -----------------------------------------

    const duplicate =
        inventory.some(
            item =>
                item.id.toLowerCase() ===
                id.toLowerCase()
        );


    if (duplicate) {

        alert(
            "This Material ID already exists."
        );

        return;

    }


    const newMaterial = {

        id: id,

        name: name,

        category: category,

        quantity: quantity,

        unit: unit,

        minimum: minimum,

        supplier: supplier,

        price: price

    };


    inventory.push(
        newMaterial
    );


    saveInventory();


    renderInventory();


    closeMaterialModal();


    alert(
        `${name} added successfully!`
    );

}


// -----------------------------------------
// Get Material By ID
// -----------------------------------------

function getInventoryMaterialById(id) {

    return inventory.find(
        item =>
            item.id === id
    );

}


// -----------------------------------------
// VIEW MATERIAL
// -----------------------------------------

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".inventory-view"
            );


        if (!button) return;


        const material =
            getInventoryMaterialById(
                button.dataset.id
            );


        if (!material) {

            alert(
                "Material not found."
            );

            return;

        }


        alert(
`Material Details

ID: ${material.id}

Material: ${material.name}

Category: ${material.category}

Quantity: ${material.quantity} ${material.unit}

Minimum Stock: ${material.minimum} ${material.unit}

Supplier: ${material.supplier}

Price: ₹${material.price}

Status: ${
    material.quantity <= material.minimum
        ? "Low Stock"
        : "In Stock"
}`
        );

    }
);


// -----------------------------------------
// EDIT MATERIAL
// -----------------------------------------

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".inventory-edit"
            );


        if (!button) return;


        const material =
            getInventoryMaterialById(
                button.dataset.id
            );


        if (!material) {

            alert(
                "Material not found."
            );

            return;

        }


        createMaterialModal(
            "Edit Material"
        );


        document
            .getElementById(
                "inventoryMaterialId"
            )
            .value =
                material.id;


        document
            .getElementById(
                "inventoryMaterialName"
            )
            .value =
                material.name;


        document
            .getElementById(
                "inventoryMaterialCategory"
            )
            .value =
                material.category;


        document
            .getElementById(
                "inventoryMaterialQuantity"
            )
            .value =
                material.quantity;


        document
            .getElementById(
                "inventoryMaterialUnit"
            )
            .value =
                material.unit;


        document
            .getElementById(
                "inventoryMaterialMinimum"
            )
            .value =
                material.minimum;


        document
            .getElementById(
                "inventoryMaterialSupplier"
            )
            .value =
                material.supplier;


        document
            .getElementById(
                "inventoryMaterialPrice"
            )
            .value =
                material.price;


        document
            .getElementById(
                "inventoryMaterialForm"
            )
            .dataset.editingId =
                material.id;

    }
);


// -----------------------------------------
// DELETE MATERIAL
// -----------------------------------------

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".inventory-delete"
            );


        if (!button) return;


        const material =
            getInventoryMaterialById(
                button.dataset.id
            );


        if (!material) {

            alert(
                "Material not found."
            );

            return;

        }


        const confirmed =
            confirm(
                `Delete ${material.name} (${material.id})?`
            );


        if (!confirmed) return;


        inventory =
            inventory.filter(
                item =>
                    item.id !==
                    material.id
            );


        saveInventory();


        renderInventory();


        alert(
            `${material.name} deleted successfully!`
        );

    }
);



// =========================================
// END INVENTORY PART 2
// =========================================

});

// =========================================
// FACTORYOS - INVENTORY PAGE
// PART 3
// Analytics + Alerts + Suppliers + Actions
// + Inventory Status + Purchase Orders
// =========================================

document.addEventListener("DOMContentLoaded", function () {

    // -----------------------------------------
    // LOW STOCK ALERTS
    // -----------------------------------------

    function updateLowStockAlerts() {

        const alertContainer = document.querySelector(
            "h2"
        );

        // Find heading specifically
        const headings = [...document.querySelectorAll("h2")];

        const lowStockHeading = headings.find(
            h => h.textContent.trim() === "Low Stock Alerts"
        );

        if (!lowStockHeading) return;

        const alertBox = lowStockHeading.parentElement;

        if (!alertBox) return;

        const alertList = alertBox.querySelector(".space-y-4");

        if (!alertList) return;

        const lowStockItems = inventory.filter(
            item => item.quantity <= item.minimum
        );

        alertList.innerHTML = "";

        if (lowStockItems.length === 0) {

            alertList.innerHTML = `
                <div class="bg-green-500/10 border border-green-500
                    rounded-xl p-4">

                    <h3 class="font-semibold text-green-400">
                        All Stock Healthy
                    </h3>

                    <p class="text-slate-400 text-sm mt-1">
                        No materials require reordering.
                    </p>

                </div>
            `;

            return;
        }

        lowStockItems.forEach(item => {

            const isCritical =
                item.quantity <= item.minimum * 0.6;

            const div = document.createElement("div");

            div.className =
                isCritical
                    ? "bg-red-500/10 border border-red-500 rounded-xl p-4"
                    : "bg-yellow-500/10 border border-yellow-500 rounded-xl p-4";

            div.innerHTML = `

                <div class="flex justify-between items-center">

                    <h3 class="font-semibold">
                        ${item.name}
                    </h3>

                    <span class="${
                        isCritical
                            ? "text-red-400"
                            : "text-yellow-400"
                    } text-xs font-semibold">

                        ${isCritical ? "Critical" : "Low"}

                    </span>

                </div>

                <p class="${
                    isCritical
                        ? "text-red-400"
                        : "text-yellow-400"
                } text-sm mt-1">

                    ${item.quantity} ${item.unit} remaining
                    · Minimum ${item.minimum} ${item.unit}

                </p>

            `;

            alertList.appendChild(div);

        });

    }


    // -----------------------------------------
    // SUPPLIER SUMMARY
    // -----------------------------------------

    function updateSupplierSummary() {

        const headings = [...document.querySelectorAll("h2")];

        const heading = headings.find(
            h => h.textContent.trim() === "Supplier Summary"
        );

        if (!heading) return;

        const box = heading.parentElement;

        if (!box) return;

        const rows = box.querySelectorAll(
            ".space-y-4 > div"
        );

        if (rows.length < 3) return;

        const suppliers = new Set(
            inventory.map(item => item.supplier)
        ).size;

        const lowStock = inventory.filter(
            item => item.quantity <= item.minimum
        ).length;

        rows[0].querySelector("span:last-child")
            .textContent = suppliers;

        rows[1].querySelector("span:last-child")
            .textContent =
                suppliers > 0
                    ? suppliers
                    : 0;

        rows[2].querySelector("span:last-child")
            .textContent = lowStock;

    }


    // -----------------------------------------
    // INVENTORY STATUS
    // -----------------------------------------

    function updateInventoryStatus() {

        const headings = [...document.querySelectorAll("h2")];

        const heading = headings.find(
            h => h.textContent.trim() === "Inventory Status"
        );

        if (!heading) return;

        const box = heading.parentElement;

        if (!box) return;

        const progressBars = box.querySelectorAll(
            ".rounded-full > div"
        );

        if (progressBars.length < 2) return;

        // Storage utilization
        const totalItems = inventory.length;

        const lowStockItems = inventory.filter(
            item => item.quantity <= item.minimum
        ).length;

        let storagePercentage = 72;

        if (totalItems > 0) {

            storagePercentage =
                Math.max(
                    20,
                    Math.min(
                        95,
                        60 + totalItems * 2
                    )
                );

        }

        progressBars[0].style.width =
            storagePercentage + "%";


        // Warehouse capacity
        let warehousePercentage =
            88 - lowStockItems * 3;

        warehousePercentage =
            Math.max(
                40,
                Math.min(
                    95,
                    warehousePercentage
                )
            );

        progressBars[1].style.width =
            warehousePercentage + "%";

    }


    // -----------------------------------------
    // QUICK ACTIONS
    // -----------------------------------------

    function setupQuickActions() {

        const headings = [...document.querySelectorAll("h2")];

        const heading = headings.find(
            h => h.textContent.trim() === "Quick Actions"
        );

        if (!heading) return;

        const box = heading.parentElement;

        if (!box) return;

        const buttons = box.querySelectorAll(
            "button"
        );

        if (buttons.length < 3) return;


        // Add Material

        buttons[0].addEventListener(
            "click",
            function () {

                if (
                    typeof openAddMaterialModal ===
                    "function"
                ) {

                    openAddMaterialModal();

                }

            }
        );


        // Create Purchase Order

        buttons[1].addEventListener(
            "click",
            function () {

                alert(
                    "Purchase Order module is ready for backend integration."
                );

            }
        );


        // Download Report

        buttons[2].addEventListener(
            "click",
            function () {

                const report = inventory
                    .map(item =>
                        `${item.id} | ${item.name} | ${item.quantity} ${item.unit} | ${item.supplier}`
                    )
                    .join("\n");

                const blob = new Blob(
                    [
                        "FactoryOS Inventory Report\n\n" +
                        report
                    ],
                    {
                        type: "text/plain"
                    }
                );

                const url =
                    URL.createObjectURL(blob);

                const link =
                    document.createElement("a");

                link.href = url;

                link.download =
                    "FactoryOS-Inventory-Report.txt";

                link.click();

                URL.revokeObjectURL(url);

            }
        );

    }


    // -----------------------------------------
    // EXPORT REPORT BUTTON
    // -----------------------------------------

    const exportButton = [...document.querySelectorAll("button")]
        .find(
            button =>
                button.textContent.trim() ===
                "Export Report"
        );

    if (exportButton) {

        exportButton.addEventListener(
            "click",
            function () {

                const report = inventory
                    .map(item =>
                        [
                            item.id,
                            item.name,
                            item.category,
                            `${item.quantity} ${item.unit}`,
                            `${item.minimum} ${item.unit}`,
                            item.supplier,
                            `₹${item.price}`
                        ].join(" | ")
                    )
                    .join("\n");

                const blob = new Blob(
                    [
                        "FactoryOS Inventory Report\n\n" +
                        "ID | Material | Category | Quantity | Minimum | Supplier | Price\n\n" +
                        report
                    ],
                    {
                        type: "text/plain"
                    }
                );

                const url =
                    URL.createObjectURL(blob);

                const link =
                    document.createElement("a");

                link.href = url;

                link.download =
                    "FactoryOS-Inventory-Report.txt";

                link.click();

                URL.revokeObjectURL(url);

            }
        );

    }


    // -----------------------------------------
    // RECENT PURCHASE ORDERS
    // -----------------------------------------

    function setupPurchaseOrders() {

        const headings = [...document.querySelectorAll("h2")];

        const heading = headings.find(
            h =>
                h.textContent.trim() ===
                "Recent Purchase Orders"
        );

        if (!heading) return;

        const section = heading.parentElement;

        if (!section) return;

        const viewAllButton =
            section.querySelector("button");

        if (!viewAllButton) return;

        viewAllButton.addEventListener(
            "click",
            function () {

                alert(
                    "Showing all purchase orders. Backend integration will connect supplier orders here."
                );

            }
        );

    }

// -----------------------------------------
// INVENTORY CHART
// -----------------------------------------

const inventoryCanvas =
    document.getElementById("inventoryChart");

const inventoryPeriod =
    document.getElementById("productionPeriod");

let inventoryChart = null;


function renderInventoryChart(period = "week") {

    if (
        !inventoryCanvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    // Destroy previous chart

    if (inventoryChart) {

        inventoryChart.destroy();

        inventoryChart = null;

    }


    let labels;
    let data;


    // -----------------------------------------
    // THIS WEEK
    // -----------------------------------------

    if (period === "week") {

        labels = [
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun"
        ];

        data = [
            120,
            95,
            150,
            130,
            170,
            145,
            180
        ];

    }


    // -----------------------------------------
    // THIS MONTH
    // -----------------------------------------

    else {

        labels = [
            "Week 1",
            "Week 2",
            "Week 3",
            "Week 4"
        ];

        data = [
            520,
            680,
            610,
            790
        ];

    }


    // -----------------------------------------
    // CREATE CHART
    // -----------------------------------------

    inventoryChart = new Chart(
        inventoryCanvas,
        {

            type: "line",

            data: {

                labels: labels,

                datasets: [

                    {

                        label:
                            "Material Usage",

                        data: data,

                        borderColor:
                            "#06b6d4",

                        backgroundColor:
                            "rgba(6,182,212,0.15)",

                        fill: true,

                        tension: 0.4,

                        pointRadius: 4,

                        pointHoverRadius: 6

                    }

                ]

            },


            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        display: false

                    }

                },

                scales: {

                    x: {

                        ticks: {

                            color:
                                "#94a3b8"

                        },

                        grid: {

                            color:
                                "#1e293b"

                        }

                    },

                    y: {

                        beginAtZero: true,

                        ticks: {

                            color:
                                "#94a3b8"

                        },

                        grid: {

                            color:
                                "#1e293b"

                        }

                    }

                }

            }

        }
    );

}


// -----------------------------------------
// INITIAL CHART
// -----------------------------------------

renderInventoryChart("week");


// -----------------------------------------
// WEEK / MONTH CHANGE
// -----------------------------------------

if (inventoryPeriod) {

    inventoryPeriod.addEventListener(
        "change",
        function () {

            renderInventoryChart(
                this.value
            );

        }
    );

}
    
    // -----------------------------------------
    // RUN INVENTORY PART 3
    // -----------------------------------------

    updateLowStockAlerts();

    updateSupplierSummary();

    updateInventoryStatus();

    setupQuickActions();

    setupPurchaseOrders();


    console.log(
        "FactoryOS Inventory - Part 3 Loaded"
    );

});



//kasak

// =========================================
// FACTORYOS - PRODUCTION PAGE
// FUNCTIONAL DEMO
// =========================================

document.addEventListener("DOMContentLoaded", function () {

    const productionCanvas =
        document.getElementById("productionChart");

    // Production page check
    if (!productionCanvas) return;

    // -----------------------------------------
    // PRODUCTION DATA
    // -----------------------------------------

    let productionLines =
        JSON.parse(
            localStorage.getItem("factoryProductionLines")
        ) || [

            {
                id: "LINE001",
                line: "Line A",
                machine: "Extruder",
                operator: "Rahul",
                target: 5000,
                completed: 4200,
                status: "Running"
            },

            {
                id: "LINE002",
                line: "Line B",
                machine: "Printing",
                operator: "Amit",
                target: 3200,
                completed: 2800,
                status: "Slow"
            },

            {
                id: "LINE003",
                line: "Line C",
                machine: "Cutting",
                operator: "Vikas",
                target: 4100,
                completed: 0,
                status: "Stopped"
            }

        ];


    function saveProduction() {

        localStorage.setItem(
            "factoryProductionLines",
            JSON.stringify(productionLines)
        );

    }


    // -----------------------------------------
    // FIND PRODUCTION TABLE
    // -----------------------------------------

    const productionHeading =
        [...document.querySelectorAll("h2")]
            .find(
                h =>
                    h.textContent.trim() ===
                    "Running Production Lines"
            );

    if (!productionHeading) return;


    const productionSection =
        productionHeading.closest(
            ".bg-slate-900"
        );

    if (!productionSection) return;


    const tableBody =
        productionSection.querySelector(
            "table tbody"
        );


    // -----------------------------------------
    // STATUS BADGE
    // -----------------------------------------

    function getStatusBadge(status) {

        if (status === "Running") {

            return `
                <span class="bg-green-500/20 text-green-400
                    px-3 py-1 rounded-full text-sm">
                    Running
                </span>
            `;

        }

        if (status === "Slow") {

            return `
                <span class="bg-yellow-500/20 text-yellow-400
                    px-3 py-1 rounded-full text-sm">
                    Slow
                </span>
            `;

        }

        if (status === "Maintenance") {

            return `
                <span class="bg-yellow-500/20 text-yellow-400
                    px-3 py-1 rounded-full text-sm">
                    Maintenance
                </span>
            `;

        }

        return `
            <span class="bg-red-500/20 text-red-400
                px-3 py-1 rounded-full text-sm">
                Stopped
            </span>
        `;

    }


    // -----------------------------------------
    // RENDER PRODUCTION TABLE
    // -----------------------------------------

    function renderProductionTable() {

        if (!tableBody) return;

        tableBody.innerHTML = "";

        productionLines.forEach(line => {

            const row =
                document.createElement("tr");

            row.className =
                "border-t border-slate-800 hover:bg-slate-800/40";

            row.innerHTML = `

                <td class="p-4">
                    ${line.line}
                </td>

                <td>
                    ${line.machine}
                </td>

                <td>
                    ${line.operator}
                </td>

                <td>
                    ${Number(line.target).toLocaleString("en-IN")}
                </td>

                <td>
                    ${Number(line.completed).toLocaleString("en-IN")}
                </td>

                <td>
                    ${getStatusBadge(line.status)}
                </td>

                <td class="text-center">

                    <div class="flex justify-center gap-3">

                        <button
                            class="production-edit
                            text-yellow-400
                            hover:text-yellow-300"
                            data-id="${line.id}"
                            title="Edit">

                            <i class="fas fa-pen"></i>

                        </button>

                        <button
                            class="production-delete
                            text-red-400
                            hover:text-red-300"
                            data-id="${line.id}"
                            title="Delete">

                            <i class="fas fa-trash"></i>

                        </button>

                    </div>

                </td>

            `;

            tableBody.appendChild(row);

        });

        updateProductionKPIs();
        updateLiveStatus();

    }


    // -----------------------------------------
    // UPDATE KPI CARDS
    // -----------------------------------------

    function updateProductionKPIs() {

        const cards =
            document.querySelectorAll(
                "main section > div:first-child > div"
            );

        if (cards.length < 4) return;


        // Today's production
        const totalCompleted =
            productionLines.reduce(
                (sum, line) =>
                    sum + Number(line.completed),
                0
            );


        cards[0]
            .querySelector("h2")
            .textContent =
                totalCompleted.toLocaleString("en-IN");


        // Efficiency
        const totalTarget =
            productionLines.reduce(
                (sum, line) =>
                    sum + Number(line.target),
                0
            );


        const efficiency =
            totalTarget > 0
                ? Math.round(
                    (totalCompleted / totalTarget) * 100
                )
                : 0;


        cards[1]
            .querySelector("h2")
            .textContent =
                efficiency + "%";


        // Running lines
        const running =
            productionLines.filter(
                line =>
                    line.status === "Running"
            ).length;


        cards[2]
            .querySelector("h2")
            .textContent =
                running;


        // Rejected units demo
        const rejected =
            Math.max(
                0,
                Math.round(totalCompleted * 0.0067)
            );


        cards[3]
            .querySelector("h2")
            .textContent =
                rejected;

    }


    // -----------------------------------------
    // LIVE STATUS
    // -----------------------------------------

    function updateLiveStatus() {

        const headings =
            [...document.querySelectorAll("h2")];

        const heading =
            headings.find(
                h =>
                    h.textContent.trim() ===
                    "Live Status"
            );

        if (!heading) return;


        const box =
            heading.parentElement;

        const rows =
            box.querySelectorAll(
                ".space-y-5 > div"
            );

        if (!rows.length) return;


        productionLines
            .slice(0, 4)
            .forEach((line, index) => {

                if (!rows[index]) return;

                const status =
                    rows[index].querySelector(
                        "span"
                    );

                const name =
                    rows[index].querySelector(
                        "span:first-child"
                    );

                if (name) {
                    name.textContent =
                        line.machine + " Line";
                }

                if (status) {

                    status.className =
                        "px-3 py-1 rounded-full";

                    if (
                        line.status === "Running"
                    ) {

                        status.classList.add(
                            "bg-green-500/20",
                            "text-green-400"
                        );

                    } else if (
                        line.status === "Slow" ||
                        line.status === "Maintenance"
                    ) {

                        status.classList.add(
                            "bg-yellow-500/20",
                            "text-yellow-400"
                        );

                    } else {

                        status.classList.add(
                            "bg-red-500/20",
                            "text-red-400"
                        );

                    }

                    status.textContent =
                        line.status;

                }

            });

    }


    // -----------------------------------------
    // PRODUCTION CHART
    // -----------------------------------------

    let chart =
        Chart.getChart(
            productionCanvas
        );

    if (chart) {
        chart.destroy();
    }


    chart =
        new Chart(
            productionCanvas,
            {

                type: "line",

                data: {

                    labels: [
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                        "Sun"
                    ],

                    datasets: [

                        {
                            label: "Production",

                            data: [
                                1450,
                                1820,
                                2100,
                                1950,
                                2350,
                                2480,
                                2300
                            ],

                            borderColor:
                                "#06b6d4",

                            backgroundColor:
                                "rgba(6,182,212,0.15)",

                            fill: true,

                            tension: 0.4,

                            pointRadius: 4,

                            pointHoverRadius: 6

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        x: {

                            ticks: {
                                color: "#94a3b8"
                            },

                            grid: {
                                color: "#1e293b"
                            }

                        },

                        y: {

                            beginAtZero: true,

                            ticks: {
                                color: "#94a3b8"
                            },

                            grid: {
                                color: "#1e293b"
                            }

                        }

                    }

                }

            }
        );


    // -----------------------------------------
    // PRODUCTION PERIOD FILTER
    // -----------------------------------------

    const periodSelect =
        document.getElementById(
            "productionPeriod"
        );


    if (periodSelect) {

        periodSelect.addEventListener(
            "change",
            function () {

                if (this.value === "Today") {

                    chart.data.labels = [
                        "8 AM",
                        "10 AM",
                        "12 PM",
                        "2 PM",
                        "4 PM",
                        "6 PM"
                    ];

                    chart.data.datasets[0].data = [
                        850,
                        1450,
                        2300,
                        3100,
                        4200,
                        5200
                    ];

                }

                else if (
                    this.value === "This Week"
                ) {

                    chart.data.labels = [
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                        "Sun"
                    ];

                    chart.data.datasets[0].data = [
                        1450,
                        1820,
                        2100,
                        1950,
                        2350,
                        2480,
                        2300
                    ];

                }

                else {

                    chart.data.labels = [
                        "Week 1",
                        "Week 2",
                        "Week 3",
                        "Week 4"
                    ];

                    chart.data.datasets[0].data = [
                        9200,
                        10400,
                        11800,
                        12450
                    ];

                }

                chart.update();

            }
        );

    }


    // -----------------------------------------
    // NEW PRODUCTION / ADD LINE MODAL
    // -----------------------------------------

    function openProductionModal(
        editId = null
    ) {

        const oldModal =
            document.getElementById(
                "productionModal"
            );

        if (oldModal) {
            oldModal.remove();
        }


        const editing =
            editId !== null;


        const existing =
            editing
                ? productionLines.find(
                    line =>
                        line.id === editId
                )
                : null;


        const modal =
            document.createElement("div");

        modal.id =
            "productionModal";

        modal.className =
            "fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6";


        modal.innerHTML = `

            <div class="bg-slate-900 border border-slate-700
                        rounded-2xl w-full max-w-xl p-6 shadow-2xl">

                <div class="flex justify-between items-center mb-6">

                    <h2 class="text-2xl font-bold">
                        ${editing
                            ? "Edit Production Line"
                            : "New Production"}
                    </h2>

                    <button
                        id="closeProductionModal"
                        class="text-slate-400 hover:text-white text-xl">

                        <i class="fas fa-xmark"></i>

                    </button>

                </div>


                <form
                    id="productionForm"
                    class="space-y-4">

                    <input
                        id="productionLineName"
                        type="text"
                        placeholder="Line Name"
                        value="${existing?.line || ""}"
                        required
                        class="w-full bg-slate-800 border border-slate-700
                        rounded-xl px-4 py-3 outline-none">


                    <input
                        id="productionMachine"
                        type="text"
                        placeholder="Machine"
                        value="${existing?.machine || ""}"
                        required
                        class="w-full bg-slate-800 border border-slate-700
                        rounded-xl px-4 py-3 outline-none">


                    <input
                        id="productionOperator"
                        type="text"
                        placeholder="Operator"
                        value="${existing?.operator || ""}"
                        required
                        class="w-full bg-slate-800 border border-slate-700
                        rounded-xl px-4 py-3 outline-none">


                    <div class="grid grid-cols-2 gap-4">

                        <input
                            id="productionTarget"
                            type="number"
                            min="0"
                            placeholder="Target Units"
                            value="${existing?.target || ""}"
                            required
                            class="w-full bg-slate-800 border border-slate-700
                            rounded-xl px-4 py-3 outline-none">


                        <input
                            id="productionCompleted"
                            type="number"
                            min="0"
                            placeholder="Completed Units"
                            value="${existing?.completed || 0}"
                            required
                            class="w-full bg-slate-800 border border-slate-700
                            rounded-xl px-4 py-3 outline-none">

                    </div>


                    <select
                        id="productionStatus"
                        class="w-full bg-slate-800 border border-slate-700
                        rounded-xl px-4 py-3 outline-none">

                        <option
                            ${existing?.status === "Running"
                                ? "selected"
                                : ""}>
                            Running
                        </option>

                        <option
                            ${existing?.status === "Slow"
                                ? "selected"
                                : ""}>
                            Slow
                        </option>

                        <option
                            ${existing?.status === "Stopped"
                                ? "selected"
                                : ""}>
                            Stopped
                        </option>

                        <option
                            ${existing?.status === "Maintenance"
                                ? "selected"
                                : ""}>
                            Maintenance
                        </option>

                    </select>


                    <button
                        type="submit"
                        class="w-full bg-cyan-500 hover:bg-cyan-600
                        py-3 rounded-xl font-semibold">

                        ${editing
                            ? "Save Changes"
                            : "Create Production"}

                    </button>

                </form>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        document
            .getElementById(
                "closeProductionModal"
            )
            .addEventListener(
                "click",
                () => modal.remove()
            );


        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === modal
                ) {
                    modal.remove();
                }

            }
        );


        document
            .getElementById(
                "productionForm"
            )
            .addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();


                    const line =
                        document
                            .getElementById(
                                "productionLineName"
                            )
                            .value
                            .trim();


                    const machine =
                        document
                            .getElementById(
                                "productionMachine"
                            )
                            .value
                            .trim();


                    const operator =
                        document
                            .getElementById(
                                "productionOperator"
                            )
                            .value
                            .trim();


                    const target =
                        Number(
                            document
                                .getElementById(
                                    "productionTarget"
                                )
                                .value
                        );


                    const completed =
                        Number(
                            document
                                .getElementById(
                                    "productionCompleted"
                                )
                                .value
                        );


                    const status =
                        document
                            .getElementById(
                                "productionStatus"
                            )
                            .value;


                    if (
                        !line ||
                        !machine ||
                        !operator
                    ) {

                        alert(
                            "Please fill all details."
                        );

                        return;

                    }


                    if (
                        target < 0 ||
                        completed < 0
                    ) {

                        alert(
                            "Units cannot be negative."
                        );

                        return;

                    }


                    if (editing) {

                        existing.line =
                            line;

                        existing.machine =
                            machine;

                        existing.operator =
                            operator;

                        existing.target =
                            target;

                        existing.completed =
                            completed;

                        existing.status =
                            status;

                    }

                    else {

                        productionLines.push({

                            id:
                                "LINE" +
                                Date.now(),

                            line:
                                line,

                            machine:
                                machine,

                            operator:
                                operator,

                            target:
                                target,

                            completed:
                                completed,

                            status:
                                status

                        });

                    }


                    saveProduction();

                    renderProductionTable();

                    modal.remove();


                    alert(
                        editing
                            ? "Production line updated successfully!"
                            : "New production line created successfully!"
                    );

                }
            );

    }


    // -----------------------------------------
    // NEW PRODUCTION BUTTON
    // -----------------------------------------

    const newProductionButton =
        [...document.querySelectorAll("button")]
            .find(
                button =>
                    button.textContent
                        .trim()
                        .includes(
                            "New Production"
                        )
            );


    if (newProductionButton) {

        newProductionButton.addEventListener(
            "click",
            function () {

                openProductionModal();

            }
        );

    }


    // -----------------------------------------
    // ADD LINE BUTTON
    // -----------------------------------------

    const addLineButton =
        [...productionSection.querySelectorAll("button")]
            .find(
                button =>
                    button.textContent
                        .trim()
                        .includes(
                            "Add Line"
                        )
            );


    if (addLineButton) {

        addLineButton.addEventListener(
            "click",
            function () {

                openProductionModal();

            }
        );

    }


    // -----------------------------------------
    // EDIT LINE
    // -----------------------------------------

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".production-edit"
                );

            if (!button) return;

            openProductionModal(
                button.dataset.id
            );

        }
    );


    // -----------------------------------------
    // DELETE LINE
    // -----------------------------------------

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".production-delete"
                );

            if (!button) return;


            const id =
                button.dataset.id;


            const line =
                productionLines.find(
                    item =>
                        item.id === id
                );


            if (!line) return;


            const confirmed =
                confirm(
                    `Delete ${line.line}?`
                );


            if (!confirmed) return;


            productionLines =
                productionLines.filter(
                    item =>
                        item.id !== id
                );


            saveProduction();

            renderProductionTable();

        }
    );


    // -----------------------------------------
    // INITIAL LOAD
    // -----------------------------------------

    renderProductionTable();


    console.log(
        "FactoryOS Production - Functional Module Loaded"
    );

});


// =========================================
// FACTORYOS - ORDERS PAGE
// STEP 2 - DATA + TABLE RENDER
// =========================================

document.addEventListener("DOMContentLoaded", function () {

    const ordersTableBody =
        document.getElementById("ordersTableBody");

    const orderSearch =
        document.getElementById("orderSearch");

    if (!ordersTableBody) return;

    // -----------------------------------------
    // Orders Data
    // -----------------------------------------

    let orders =
        JSON.parse(
            localStorage.getItem("factoryOrders")
        ) || [

            {
                id: "ORD-1001",
                customer: "ABC Packaging Pvt Ltd",
                product: "Plastic Carry Bags",
                amount: 245000,
                payment: "Paid",
                delivery: "Dispatched"
            },

            {
                id: "ORD-1002",
                customer: "XYZ Industries",
                product: "Stretch Film Rolls",
                amount: 118000,
                payment: "Pending",
                delivery: "In Production"
            },

            {
                id: "ORD-1003",
                customer: "GreenPack Solutions",
                product: "Food Packaging Pouches",
                amount: 372500,
                payment: "Overdue",
                delivery: "Delivered"
            }

        ];


    // -----------------------------------------
    // Save Orders
    // -----------------------------------------

    function saveOrders() {

        localStorage.setItem(
            "factoryOrders",
            JSON.stringify(orders)
        );

    }


    // -----------------------------------------
    // Status Badge
    // -----------------------------------------

    function getPaymentBadge(payment) {

        if (payment === "Paid") {

            return `
                <span class="bg-green-500/20
                    text-green-400 px-3 py-1
                    rounded-full text-xs">
                    Paid
                </span>
            `;

        }

        if (payment === "Pending") {

            return `
                <span class="bg-yellow-500/20
                    text-yellow-400 px-3 py-1
                    rounded-full text-xs">
                    Pending
                </span>
            `;

        }

        return `
            <span class="bg-red-500/20
                text-red-400 px-3 py-1
                rounded-full text-xs">
                Overdue
            </span>
        `;

    }


    function getDeliveryBadge(delivery) {

        if (delivery === "Delivered") {

            return `
                <span class="bg-green-500/20
                    text-green-400 px-3 py-1
                    rounded-full text-xs">
                    Delivered
                </span>
            `;

        }

        if (delivery === "Dispatched") {

            return `
                <span class="bg-cyan-500/20
                    text-cyan-400 px-3 py-1
                    rounded-full text-xs">
                    Dispatched
                </span>
            `;

        }

        if (delivery === "In Production") {

            return `
                <span class="bg-orange-500/20
                    text-orange-400 px-3 py-1
                    rounded-full text-xs">
                    In Production
                </span>
            `;

        }

        return `
            <span class="bg-yellow-500/20
                text-yellow-400 px-3 py-1
                rounded-full text-xs">
                Pending
            </span>
        `;

    }


    // -----------------------------------------
    // Render Orders
    // -----------------------------------------

    function renderOrders(list = orders) {

        ordersTableBody.innerHTML = "";


        if (list.length === 0) {

            ordersTableBody.innerHTML = `
                <tr>

                    <td
                        colspan="7"
                        class="px-6 py-10
                        text-center
                        text-slate-400">

                        No orders found

                    </td>

                </tr>
            `;

            updateOrderCards();

            return;

        }


        list.forEach(order => {

            const row =
                document.createElement("tr");


            row.className =
                "hover:bg-slate-800/60 transition-all duration-300";


            row.innerHTML = `

                <td class="px-6 py-4">
                    ${order.id}
                </td>

                <td class="px-6 py-4">
                    ${order.customer}
                </td>

                <td class="px-6 py-4">
                    ${order.product}
                </td>

                <td class="px-6 py-4 text-center">
                    ₹${order.amount.toLocaleString("en-IN")}
                </td>

                <td class="px-6 py-4 text-center">
                    ${getPaymentBadge(order.payment)}
                </td>

                <td class="px-6 py-4 text-center">
                    ${getDeliveryBadge(order.delivery)}
                </td>

                <td class="px-6 py-4">

                    <div
                        class="flex items-center
                        justify-center gap-4">

                        <button
                            class="order-view
                            text-cyan-400
                            hover:text-cyan-300
                            hover:scale-110
                            transition"
                            data-id="${order.id}"
                            title="View">

                            <i class="fas fa-eye"></i>

                        </button>


                        <button
                            class="order-edit
                            text-yellow-400
                            hover:text-yellow-300
                            hover:scale-110
                            transition"
                            data-id="${order.id}"
                            title="Edit">

                            <i class="fas fa-pen"></i>

                        </button>


                        <button
                            class="order-delete
                            text-red-400
                            hover:text-red-300
                            hover:scale-110
                            transition"
                            data-id="${order.id}"
                            title="Delete">

                            <i class="fas fa-trash"></i>

                        </button>

                    </div>

                </td>

            `;


            ordersTableBody.appendChild(row);

        });


        updateOrderCards();

    }


    // -----------------------------------------
    // Update KPI Cards
    // -----------------------------------------

    function updateOrderCards() {

        const cards =
            document.querySelectorAll(
                "section .grid.grid-cols-4 > div"
            );


        if (cards.length < 4) return;


        // Total Orders

        cards[0]
            .querySelector("h2")
            .textContent =
                orders.length;


        cards[0]
            .querySelector("p:last-child")
            .textContent =
                "+ Updated";


        // Pending Orders

        const pending =
            orders.filter(order =>
                order.payment === "Pending" ||
                order.delivery === "Pending" ||
                order.delivery === "In Production"
            ).length;


        cards[1]
            .querySelector("h2")
            .textContent =
                pending;


        // Delivered

        const delivered =
            orders.filter(
                order =>
                    order.delivery === "Delivered"
            ).length;


        cards[2]
            .querySelector("h2")
            .textContent =
                delivered;


        // Revenue

        const revenue =
            orders.reduce(
                (total, order) =>
                    total + Number(order.amount),
                0
            );


        let revenueText;


        if (revenue >= 100000) {

            revenueText =
                "₹" +
                (revenue / 100000)
                    .toFixed(1) +
                "L";

        } else {

            revenueText =
                "₹" +
                revenue.toLocaleString("en-IN");

        }


        cards[3]
            .querySelector("h2")
            .textContent =
                revenueText;

    }


    // -----------------------------------------
    // Search Orders
    // -----------------------------------------

    if (orderSearch) {

        orderSearch.addEventListener(
            "input",
            function () {

                const value =
                    this.value
                        .toLowerCase()
                        .trim();


                const filtered =
                    orders.filter(order =>

                        order.id
                            .toLowerCase()
                            .includes(value)

                        ||

                        order.customer
                            .toLowerCase()
                            .includes(value)

                        ||

                        order.product
                            .toLowerCase()
                            .includes(value)

                        ||

                        order.payment
                            .toLowerCase()
                            .includes(value)

                        ||

                        order.delivery
                            .toLowerCase()
                            .includes(value)

                    );


                renderOrders(filtered);

            }
        );

    }


    // -----------------------------------------
    // Initial Render
    // -----------------------------------------

    renderOrders();

    saveOrders();


    console.log(
        "FactoryOS Orders - Step 2 Loaded"
    );

});


// =========================================
// FACTORYOS - ORDERS PAGE
// STEP 3 - NEW ORDER
// =========================================

document.addEventListener("DOMContentLoaded", function () {

    const newOrderButton = [...document.querySelectorAll("button")]
        .find(button =>
            button.textContent.trim().includes("New Order")
        );

    if (!newOrderButton) return;


    // -----------------------------------------
    // Create Order Modal
    // -----------------------------------------

    function createOrderModal() {

        const oldModal =
            document.getElementById("newOrderModal");

        if (oldModal) {
            oldModal.remove();
        }


        const modal =
            document.createElement("div");

        modal.id = "newOrderModal";

        modal.className =
            "fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6";


        modal.innerHTML = `

            <div class="
                bg-slate-900
                border border-slate-700
                rounded-2xl
                w-full
                max-w-xl
                p-6
                shadow-2xl
            ">

                <div class="
                    flex
                    justify-between
                    items-center
                    mb-6
                ">

                    <div>

                        <h2 class="text-2xl font-bold">
                            New Order
                        </h2>

                        <p class="text-slate-400 text-sm mt-1">
                            Create a new customer order
                        </p>

                    </div>


                    <button
                        type="button"
                        id="closeNewOrderModal"
                        class="
                            text-slate-400
                            hover:text-white
                            text-xl
                        "
                    >

                        <i class="fas fa-xmark"></i>

                    </button>

                </div>


                <form
                    id="newOrderForm"
                    class="space-y-4"
                >

                    <input
                        id="newOrderId"
                        type="text"
                        placeholder="Order ID (e.g. ORD-1004)"
                        required
                        class="
                            w-full
                            bg-slate-800
                            border border-slate-700
                            rounded-xl
                            px-4 py-3
                            outline-none
                            focus:border-cyan-400
                        "
                    >


                    <input
                        id="newOrderCustomer"
                        type="text"
                        placeholder="Customer Name"
                        required
                        class="
                            w-full
                            bg-slate-800
                            border border-slate-700
                            rounded-xl
                            px-4 py-3
                            outline-none
                            focus:border-cyan-400
                        "
                    >


                    <input
                        id="newOrderProduct"
                        type="text"
                        placeholder="Product Name"
                        required
                        class="
                            w-full
                            bg-slate-800
                            border border-slate-700
                            rounded-xl
                            px-4 py-3
                            outline-none
                            focus:border-cyan-400
                        "
                    >


                    <input
                        id="newOrderAmount"
                        type="number"
                        min="0"
                        placeholder="Order Amount (₹)"
                        required
                        class="
                            w-full
                            bg-slate-800
                            border border-slate-700
                            rounded-xl
                            px-4 py-3
                            outline-none
                            focus:border-cyan-400
                        "
                    >


                    <div class="grid grid-cols-2 gap-4">

                        <select
                            id="newOrderPayment"
                            class="
                                w-full
                                bg-slate-800
                                border border-slate-700
                                rounded-xl
                                px-4 py-3
                                outline-none
                                focus:border-cyan-400
                            "
                        >

                            <option value="Pending">
                                Pending
                            </option>

                            <option value="Paid">
                                Paid
                            </option>

                            <option value="Overdue">
                                Overdue
                            </option>

                        </select>


                        <select
                            id="newOrderDelivery"
                            class="
                                w-full
                                bg-slate-800
                                border border-slate-700
                                rounded-xl
                                px-4 py-3
                                outline-none
                                focus:border-cyan-400
                            "
                        >

                            <option value="Pending">
                                Pending
                            </option>

                            <option value="In Production">
                                In Production
                            </option>

                            <option value="Dispatched">
                                Dispatched
                            </option>

                            <option value="Delivered">
                                Delivered
                            </option>

                        </select>

                    </div>


                    <button
                        type="submit"
                        class="
                            w-full
                            bg-cyan-500
                            hover:bg-cyan-600
                            py-3
                            rounded-xl
                            font-semibold
                            transition
                        "
                    >

                        Create Order

                    </button>

                </form>

            </div>

        `;


        document.body.appendChild(modal);


        // -----------------------------------------
        // Close Button
        // -----------------------------------------

        document
            .getElementById("closeNewOrderModal")
            .addEventListener(
                "click",
                closeOrderModal
            );


        // -----------------------------------------
        // Click Outside
        // -----------------------------------------

        modal.addEventListener(
            "click",
            function (event) {

                if (event.target === modal) {

                    closeOrderModal();

                }

            }
        );


        // -----------------------------------------
        // Form Submit
        // -----------------------------------------

        document
            .getElementById("newOrderForm")
            .addEventListener(
                "submit",
                handleNewOrderSubmit
            );


        document
            .getElementById("newOrderId")
            .focus();

    }


    // -----------------------------------------
    // Close Modal
    // -----------------------------------------

    function closeOrderModal() {

        const modal =
            document.getElementById(
                "newOrderModal"
            );

        if (modal) {

            modal.remove();

        }

    }


    // -----------------------------------------
    // Handle New Order
    // -----------------------------------------

    function handleNewOrderSubmit(event) {

        event.preventDefault();


        const id =
            document
                .getElementById("newOrderId")
                .value
                .trim();


        const customer =
            document
                .getElementById("newOrderCustomer")
                .value
                .trim();


        const product =
            document
                .getElementById("newOrderProduct")
                .value
                .trim();


        const amount =
            Number(
                document
                    .getElementById("newOrderAmount")
                    .value
            );


        const payment =
            document
                .getElementById("newOrderPayment")
                .value;


        const delivery =
            document
                .getElementById("newOrderDelivery")
                .value;


        // -----------------------------------------
        // Validation
        // -----------------------------------------

        if (
            !id ||
            !customer ||
            !product
        ) {

            alert(
                "Please fill all order details."
            );

            return;

        }


        if (amount <= 0) {

            alert(
                "Order amount must be greater than ₹0."
            );

            return;

        }


        // -----------------------------------------
        // Get Existing Orders
        // -----------------------------------------

        let orders =
            JSON.parse(
                localStorage.getItem("factoryOrders")
            ) || [];


        // -----------------------------------------
        // Duplicate Order ID
        // -----------------------------------------

        const duplicate =
            orders.some(
                order =>
                    order.id.toLowerCase() ===
                    id.toLowerCase()
            );


        if (duplicate) {

            alert(
                "This Order ID already exists."
            );

            return;

        }


        // -----------------------------------------
        // Create Order
        // -----------------------------------------

        const newOrder = {

            id: id,

            customer: customer,

            product: product,

            amount: amount,

            payment: payment,

            delivery: delivery

        };


        orders.push(newOrder);


        // -----------------------------------------
        // Save
        // -----------------------------------------

        localStorage.setItem(
            "factoryOrders",
            JSON.stringify(orders)
        );


        // -----------------------------------------
        // Close Modal
        // -----------------------------------------

        closeOrderModal();


        // -----------------------------------------
        // Refresh Page
        // -----------------------------------------

        location.reload();

    }


    // -----------------------------------------
    // New Order Button
    // -----------------------------------------

    newOrderButton.addEventListener(
        "click",
        createOrderModal
    );


    console.log(
        "FactoryOS Orders - Step 3 Loaded"
    );

});


// =========================================
// FACTORYOS - INVOICE MANAGEMENT
// NEW INVOICE MODAL + CALCULATIONS
// =========================================

document.addEventListener("DOMContentLoaded", function () {

    const newInvoiceBtn =
        document.getElementById("newInvoiceBtn");

    if (!newInvoiceBtn) return;


    // -----------------------------------------
    // CREATE INVOICE MODAL
    // -----------------------------------------

    function openInvoiceModal() {

        const oldModal =
            document.getElementById("invoiceCreateModal");

        if (oldModal) {
            oldModal.remove();
        }


        const modal =
            document.createElement("div");

        modal.id = "invoiceCreateModal";

        modal.className =
            "fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6";


        modal.innerHTML = `

            <div class="bg-slate-900 border border-slate-700
                        rounded-2xl w-full max-w-3xl
                        max-h-[90vh] overflow-y-auto
                        p-6 shadow-2xl">

                <!-- Header -->

                <div class="flex justify-between items-center mb-6">

                    <div>

                        <h2 class="text-2xl font-bold">
                            Create New Invoice
                        </h2>

                        <p class="text-slate-400 text-sm mt-1">
                            Enter customer and product details
                        </p>

                    </div>


                    <button
                        type="button"
                        id="closeInvoiceModal"
                        class="text-slate-400 hover:text-white text-xl">

                        <i class="fas fa-xmark"></i>

                    </button>

                </div>


                <form id="newInvoiceForm" class="space-y-5">


                    <!-- Customer -->

                    <div class="grid grid-cols-2 gap-4">

                        <div>

                            <label class="block text-sm text-slate-400 mb-2">
                                Customer Name
                            </label>

                            <input
                                id="invoiceCustomerName"
                                type="text"
                                placeholder="ABC Packaging Pvt Ltd"
                                required
                                class="w-full bg-slate-800
                                border border-slate-700
                                rounded-xl px-4 py-3
                                outline-none
                                focus:border-cyan-400">

                        </div>


                        <div>

                            <label class="block text-sm text-slate-400 mb-2">
                                Customer GSTIN
                            </label>

                            <input
                                id="invoiceCustomerGST"
                                type="text"
                                placeholder="07ABCDE1234A1Z2"
                                class="w-full bg-slate-800
                                border border-slate-700
                                rounded-xl px-4 py-3
                                outline-none
                                focus:border-cyan-400">

                        </div>

                    </div>


                    <!-- Address -->

                    <div>

                        <label class="block text-sm text-slate-400 mb-2">
                            Billing Address
                        </label>

                        <input
                            id="invoiceCustomerAddress"
                            type="text"
                            placeholder="Delhi, India"
                            required
                            class="w-full bg-slate-800
                            border border-slate-700
                            rounded-xl px-4 py-3
                            outline-none
                            focus:border-cyan-400">

                    </div>


                    <!-- Product -->

                    <div class="border border-slate-700
                                rounded-xl p-5">

                        <h3 class="font-semibold mb-4 text-cyan-400">
                            Product Details
                        </h3>


                        <div class="grid grid-cols-3 gap-4">


                            <div class="col-span-1">

                                <label class="block text-sm text-slate-400 mb-2">
                                    Product
                                </label>

                                <input
                                    id="invoiceProduct"
                                    type="text"
                                    placeholder="Plastic Carry Bags"
                                    required
                                    class="w-full bg-slate-800
                                    border border-slate-700
                                    rounded-xl px-4 py-3
                                    outline-none
                                    focus:border-cyan-400">

                            </div>


                            <div>

                                <label class="block text-sm text-slate-400 mb-2">
                                    Quantity
                                </label>

                                <input
                                    id="invoiceQuantity"
                                    type="number"
                                    min="1"
                                    value="1"
                                    required
                                    class="w-full bg-slate-800
                                    border border-slate-700
                                    rounded-xl px-4 py-3
                                    outline-none
                                    focus:border-cyan-400">

                            </div>


                            <div>

                                <label class="block text-sm text-slate-400 mb-2">
                                    Rate (₹)
                                </label>

                                <input
                                    id="invoiceRate"
                                    type="number"
                                    min="0"
                                    value="0"
                                    required
                                    class="w-full bg-slate-800
                                    border border-slate-700
                                    rounded-xl px-4 py-3
                                    outline-none
                                    focus:border-cyan-400">

                            </div>

                        </div>

                    </div>


                    <!-- GST -->

                    <div>

                        <label class="block text-sm text-slate-400 mb-2">
                            GST (%)
                        </label>

                        <select
                            id="invoiceGST"
                            class="w-full bg-slate-800
                            border border-slate-700
                            rounded-xl px-4 py-3
                            outline-none
                            focus:border-cyan-400">

                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18" selected>18%</option>
                            <option value="28">28%</option>

                        </select>

                    </div>


                    <!-- Live Calculation -->

                    <div class="bg-slate-800/70
                                border border-slate-700
                                rounded-xl p-5">

                        <div class="flex justify-between mb-3">

                            <span class="text-slate-400">
                                Subtotal
                            </span>

                            <span id="invoiceSubtotal"
                                  class="font-semibold">
                                ₹0
                            </span>

                        </div>


                        <div class="flex justify-between mb-3">

                            <span class="text-slate-400">
                                GST
                            </span>

                            <span id="invoiceGSTAmount"
                                  class="font-semibold">
                                ₹0
                            </span>

                        </div>


                        <div class="border-t border-slate-700
                                    pt-3 flex justify-between
                                    text-xl font-bold">

                            <span>
                                Total
                            </span>

                            <span id="invoiceTotal"
                                  class="text-cyan-400">
                                ₹0
                            </span>

                        </div>

                    </div>


                    <!-- Buttons -->

                    <div class="flex justify-end gap-3 pt-2">

                        <button
                            type="button"
                            id="cancelInvoiceBtn"
                            class="bg-slate-700
                            hover:bg-slate-600
                            px-5 py-3 rounded-xl">

                            Cancel

                        </button>


                        <button
                            type="submit"
                            class="bg-cyan-500
                            hover:bg-cyan-600
                            px-6 py-3 rounded-xl
                            font-semibold">

                            <i class="fas fa-file-invoice mr-2"></i>

                            Create Invoice

                        </button>

                    </div>


                </form>

            </div>

        `;


        document.body.appendChild(modal);


        // -----------------------------------------
        // ELEMENTS
        // -----------------------------------------

        const quantity =
            document.getElementById("invoiceQuantity");

        const rate =
            document.getElementById("invoiceRate");

        const gst =
            document.getElementById("invoiceGST");

        const subtotalBox =
            document.getElementById("invoiceSubtotal");

        const gstBox =
            document.getElementById("invoiceGSTAmount");

        const totalBox =
            document.getElementById("invoiceTotal");


        // -----------------------------------------
        // CALCULATE INVOICE
        // -----------------------------------------

        function calculateInvoice() {

            const qty =
                Number(quantity.value) || 0;

            const price =
                Number(rate.value) || 0;

            const gstRate =
                Number(gst.value) || 0;


            const subtotal =
                qty * price;


            const gstAmount =
                subtotal * gstRate / 100;


            const total =
                subtotal + gstAmount;


            subtotalBox.textContent =
                "₹" + subtotal.toLocaleString("en-IN");


            gstBox.textContent =
                "₹" + gstAmount.toLocaleString("en-IN");


            totalBox.textContent =
                "₹" + total.toLocaleString("en-IN");

        }


        quantity.addEventListener(
            "input",
            calculateInvoice
        );


        rate.addEventListener(
            "input",
            calculateInvoice
        );


        gst.addEventListener(
            "change",
            calculateInvoice
        );


        // Initial calculation

        calculateInvoice();


        // -----------------------------------------
        // CLOSE
        // -----------------------------------------

        document
            .getElementById("closeInvoiceModal")
            .addEventListener(
                "click",
                () => modal.remove()
            );


        document
            .getElementById("cancelInvoiceBtn")
            .addEventListener(
                "click",
                () => modal.remove()
            );


        // Click outside

        modal.addEventListener(
            "click",
            function (event) {

                if (event.target === modal) {
                    modal.remove();
                }

            }
        );


        // -----------------------------------------
        // SUBMIT
        // -----------------------------------------

        document
            .getElementById("newInvoiceForm")
            .addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();


                    const customer =
                        document
                            .getElementById(
                                "invoiceCustomerName"
                            )
                            .value
                            .trim();


                    const customerGST =
                        document
                            .getElementById(
                                "invoiceCustomerGST"
                            )
                            .value
                            .trim();


                    const address =
                        document
                            .getElementById(
                                "invoiceCustomerAddress"
                            )
                            .value
                            .trim();


                    const product =
                        document
                            .getElementById(
                                "invoiceProduct"
                            )
                            .value
                            .trim();


                    const qty =
                        Number(
                            quantity.value
                        );


                    const price =
                        Number(
                            rate.value
                        );


                    const gstRate =
                        Number(
                            gst.value
                        );


                    const subtotal =
                        qty * price;


                    const gstAmount =
                        subtotal * gstRate / 100;


                    const total =
                        subtotal + gstAmount;


                    // ---------------------------------
                    // UPDATE PREVIEW
                    // ---------------------------------

                    const invoiceCustomer =
                        document.querySelector(
                            "p"
                        );


                    const billSection =
                        [...document.querySelectorAll("h3")]
                            .find(
                                h =>
                                    h.textContent.trim() ===
                                    "Bill To"
                            );


                    if (billSection) {

                        const billBox =
                            billSection.parentElement;


                        const paragraphs =
                            billBox.querySelectorAll("p");


                        if (paragraphs[0]) {
                            paragraphs[0].textContent =
                                customer;
                        }


                        if (paragraphs[1]) {
                            paragraphs[1].textContent =
                                address;
                        }


                        if (paragraphs[2]) {
                            paragraphs[2].textContent =
                                customerGST
                                    ? "GST : " + customerGST
                                    : "GST : —";
                        }

                    }


                    // ---------------------------------
                    // UPDATE PRODUCT ROW
                    // ---------------------------------

                    const productRow =
                        document.querySelector(
                            "table tbody tr"
                        );


                    if (productRow) {

                        const cells =
                            productRow.querySelectorAll("td");


                        if (cells[0]) {
                            cells[0].textContent =
                                product;
                        }


                        if (cells[1]) {
                            cells[1].textContent =
                                qty;
                        }


                        if (cells[2]) {
                            cells[2].textContent =
                                "₹" +
                                price.toLocaleString("en-IN");
                        }


                        if (cells[3]) {
                            cells[3].textContent =
                                "₹" +
                                subtotal.toLocaleString("en-IN");
                        }

                    }


                    // ---------------------------------
                    // UPDATE SUMMARY
                    // ---------------------------------

                    const summaryHeading =
                        [...document.querySelectorAll("h2")]
                            .find(
                                h =>
                                    h.textContent.trim() ===
                                    "Summary"
                            );


                    if (summaryHeading) {

                        const summaryBox =
                            summaryHeading.parentElement;


                        const rows =
                            summaryBox.querySelectorAll(
                                ".space-y-4 > div"
                            );


                        if (rows[0]) {

                            rows[0]
                                .querySelector(
                                    "span:last-child"
                                )
                                .textContent =
                                    "₹" +
                                    subtotal.toLocaleString(
                                        "en-IN"
                                    );

                        }


                        if (rows[1]) {

                            rows[1]
                                .querySelector(
                                    "span:last-child"
                                )
                                .textContent =
                                    "₹" +
                                    gstAmount.toLocaleString(
                                        "en-IN"
                                    );

                        }


                        if (rows[2]) {

                            rows[2]
                                .querySelector(
                                    "span:last-child"
                                )
                                .textContent =
                                    "₹" +
                                    total.toLocaleString(
                                        "en-IN"
                                    );

                        }

                    }


                    modal.remove();


                    alert(
                        "✅ Invoice created successfully!"
                    );

                }
            );

    }


    // -----------------------------------------
    // NEW INVOICE BUTTON
    // -----------------------------------------

    newInvoiceBtn.addEventListener(
        "click",
        openInvoiceModal
    );


    console.log(
        "FactoryOS Invoice - New Invoice Module Loaded"
    );

});


// =========================================
// INVOICE - PRINT FUNCTION
// =========================================

document.addEventListener("DOMContentLoaded", function () {

    const printInvoiceBtn =
        document.getElementById("printInvoiceBtn");

    console.log("Print button:", printInvoiceBtn);

    if (!printInvoiceBtn) return;

    printInvoiceBtn.addEventListener("click", function () {

        console.log("PRINT BUTTON CLICKED");

    setTimeout(() => {
    window.print();
}, 100);

    });

});