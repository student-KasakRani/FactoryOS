// ======================================================
// FACTORYOS - REAL INVENTORY PAGE
// Backend API Connected
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "http://localhost:5000/api";

    const token = localStorage.getItem("token");

    // --------------------------------------------------
    // AUTH CHECK
    // --------------------------------------------------

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // --------------------------------------------------
    // API HELPER
    // --------------------------------------------------

    async function apiRequest(endpoint, options = {}) {
        const response = await fetch(
            `${API_BASE}${endpoint}`,
            {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    ...(options.headers || {})
                }
            }
        );

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("Invalid server response.");
        }

        if (!response.ok) {
            throw new Error(
                data.message || "Request failed."
            );
        }

        return data;
    }

    // --------------------------------------------------
    // HELPERS
    // --------------------------------------------------

    function formatNumber(value) {
        return Number(value || 0).toLocaleString("en-IN");
    }

    function formatCurrency(value) {
        return Number(value || 0).toLocaleString(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0
            }
        );
    }

    function getArray(data, keys = []) {
        if (Array.isArray(data)) {
            return data;
        }

        for (const key of keys) {
            if (Array.isArray(data?.[key])) {
                return data[key];
            }
        }

        return [];
    }

    function showError(message) {
        console.error("Inventory Error:", message);
    }

    // --------------------------------------------------
    // PAGE STATE
    // --------------------------------------------------

    let rawMaterials = [];
    let suppliers = [];
    let purchases = [];
    let lowStockMaterials = [];

    let filteredMaterials = [];
    let inventoryChart = null;

    // --------------------------------------------------
    // LOAD ALL INVENTORY DATA
    // --------------------------------------------------

    async function loadInventoryPage() {
        try {
            const [
                materialResponse,
                lowStockResponse,
                supplierResponse,
                purchaseResponse
            ] = await Promise.all([
                apiRequest("/raw-materials"),
                apiRequest("/raw-materials/alerts/low-stock"),
                apiRequest("/suppliers"),
                apiRequest("/purchases")
            ]);

            rawMaterials = getArray(
                materialResponse,
                ["rawMaterials", "materials"]
            );

            lowStockMaterials = getArray(
                lowStockResponse,
                ["alerts", "rawMaterials"]
            );

            suppliers = getArray(
                supplierResponse,
                ["suppliers"]
            );

            purchases = getArray(
                purchaseResponse,
                ["purchases", "purchaseOrders"]
            );

            filteredMaterials = [...rawMaterials];

            renderSummaryCards();
            renderMaterialTable();
            renderLowStockAlerts();
            renderSupplierSummary();
            renderPurchaseOrders();
            renderInventoryChart();
            renderInventoryStatus();

        } catch (error) {
            showError(error.message);
            alert(
                error.message ||
                "Unable to load inventory data."
            );
        }
    }

    // --------------------------------------------------
    // SUMMARY CARDS
    // --------------------------------------------------

    function renderSummaryCards() {
        const cards =
            document.querySelectorAll(
                "main section > div.grid.grid-cols-4 > div"
            );

        if (cards.length < 4) {
            return;
        }

        // ----------------------------------------------
        // TOTAL MATERIALS
        // ----------------------------------------------

        const totalMaterialsValue =
            cards[0].querySelector("h2");

        const totalMaterialsMeta =
            cards[0].querySelectorAll("p")[1];

        if (totalMaterialsValue) {
            totalMaterialsValue.textContent =
                formatNumber(rawMaterials.length);
        }

        if (totalMaterialsMeta) {
            totalMaterialsMeta.textContent =
                `${rawMaterials.filter(
                    material => material.isActive !== false
                ).length} active material${rawMaterials.length === 1 ? "" : "s"}`;
        }

        // ----------------------------------------------
        // LOW STOCK
        // ----------------------------------------------

        const lowStockValue =
            cards[1].querySelector("h2");

        const lowStockMeta =
            cards[1].querySelectorAll("p")[1];

        if (lowStockValue) {
            lowStockValue.textContent =
                formatNumber(
                    lowStockMaterials.length
                );
        }

        if (lowStockMeta) {
            lowStockMeta.textContent =
                lowStockMaterials.length
                    ? "Reorder required"
                    : "All materials healthy";
        }

        // ----------------------------------------------
        // SUPPLIERS
        // ----------------------------------------------

        const supplierValue =
            cards[2].querySelector("h2");

        const supplierMeta =
            cards[2].querySelectorAll("p")[1];

        if (supplierValue) {
            supplierValue.textContent =
                formatNumber(suppliers.length);
        }

        if (supplierMeta) {
            supplierMeta.textContent =
                `${suppliers.length} registered supplier${suppliers.length === 1 ? "" : "s"}`;
        }

        // ----------------------------------------------
        // INVENTORY VALUE
        // ----------------------------------------------

        const inventoryValue =
            rawMaterials.reduce(
                (total, material) =>
                    total +
                    (
                        Number(material.currentStock || 0) *
                        Number(material.unitCost || 0)
                    ),
                0
            );

        const inventoryValueElement =
            cards[3].querySelector("h2");

        const inventoryValueMeta =
            cards[3].querySelectorAll("p")[1];

        if (inventoryValueElement) {
            inventoryValueElement.textContent =
                formatCurrency(inventoryValue);
        }

        if (inventoryValueMeta) {
            inventoryValueMeta.textContent =
                "Current stock value";
        }
    }

    // --------------------------------------------------
    // MATERIAL TABLE
    // --------------------------------------------------

    function renderMaterialTable() {
        const table =
            document.querySelector(
                "main section table"
            );

        if (!table) return;

        const tbody = table.querySelector("tbody");

        if (!tbody) return;

        tbody.innerHTML = "";

        if (!filteredMaterials.length) {
            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="p-8 text-center text-slate-500"
                    >
                        No materials found.
                    </td>
                </tr>
            `;

            return;
        }

        filteredMaterials.forEach(material => {
            const row =
                document.createElement("tr");

            row.className =
                "border-t border-slate-200 hover:bg-slate-50";

            const stock =
                Number(material.currentStock || 0);

            const minimum =
                Number(material.minimumStock || 0);

            const reorderLevel =
                Number(material.reorderLevel || 0);

            let statusText = "In Stock";
            let statusClass =
                "bg-green-500/10 text-green-600 border border-green-200";

            if (stock <= reorderLevel) {
                statusText = "Reorder Required";
                statusClass =
                    "bg-red-500/10 text-red-600 border border-red-200";
            } else if (stock <= minimum) {
                statusText = "Low Stock";
                statusClass =
                    "bg-yellow-500/10 text-yellow-700 border border-yellow-200";
            }

            const supplierName =
                material.supplier?.companyName ||
                material.supplier?.name ||
                "—";

            row.innerHTML = `
                <td class="p-4">
                    <div>
                        <p class="font-semibold text-white">
    ${material.name || "—"}
</p>

                        <p class="text-xs text-slate-400 mt-1">
                            ${material.materialCode || "—"}
                        </p>
                    </div>
                </td>

                <td class="text-slate-700">
                    ${material.category || "—"}
                </td>

                <td class="font-medium text-white">
                    ${formatNumber(stock)}
                    ${material.unit || ""}
                </td>

                <td class="text-white">
                    ${formatNumber(minimum)}
                    ${material.unit || ""}
                </td>

                <td class="text-white">
                    ${supplierName}
                </td>

                <td>
                    <span
                        class="${statusClass} px-3 py-1 rounded-full text-xs font-semibold"
                    >
                        ${statusText}
                    </span>
                </td>

                <td class="text-center">
                    <div class="flex justify-center gap-3">

                        <button
                            type="button"
                            class="inventory-view-btn text-cyan-600 hover:text-cyan-800"
                            data-id="${material._id}"
                            title="View"
                        >
                            <i class="fas fa-eye"></i>
                        </button>

                        <button
                            type="button"
                            class="inventory-stock-btn text-emerald-600 hover:text-emerald-800"
                            data-id="${material._id}"
                            title="Update Stock"
                        >
                            <i class="fas fa-boxes-stacked"></i>
                        </button>

                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });

        attachMaterialActions();
    }

    // --------------------------------------------------
    // MATERIAL ACTIONS
    // --------------------------------------------------

    function attachMaterialActions() {
        const viewButtons =
            document.querySelectorAll(
                ".inventory-view-btn"
            );

        const stockButtons =
            document.querySelectorAll(
                ".inventory-stock-btn"
            );

        viewButtons.forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const material =
                        rawMaterials.find(
                            item =>
                                String(item._id) ===
                                String(button.dataset.id)
                        );

                    if (material) {
                        showMaterialDetails(
                            material
                        );
                    }
                }
            );
        });

        stockButtons.forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const material =
                        rawMaterials.find(
                            item =>
                                String(item._id) ===
                                String(button.dataset.id)
                        );

                    if (material) {
                        openStockModal(material);
                    }
                }
            );
        });
    }

    // --------------------------------------------------
    // VIEW MATERIAL
    // --------------------------------------------------

    function showMaterialDetails(material) {
        alert(
            `Material: ${material.name}\n` +
            `Code: ${material.materialCode}\n` +
            `Stock: ${material.currentStock} ${material.unit}\n` +
            `Minimum: ${material.minimumStock} ${material.unit}\n` +
            `Reorder Level: ${material.reorderLevel} ${material.unit}\n` +
            `Unit Cost: ${formatCurrency(material.unitCost)}`
        );
    }

    // --------------------------------------------------
    // LOW STOCK ALERTS
    // --------------------------------------------------

    function renderLowStockAlerts() {
        const heading =
            [...document.querySelectorAll("h2")].find(
                h =>
                    h.textContent.trim() ===
                    "Low Stock Alerts"
            );

        if (!heading) return;

        const box =
            heading.parentElement;

        const container =
            box.querySelector(".space-y-4");

        if (!container) return;

        container.innerHTML = "";

        if (!lowStockMaterials.length) {
            container.innerHTML = `
                <div
                    class="bg-green-50 border border-green-200 rounded-xl p-4"
                >
                    <h3 class="font-semibold text-green-700">
                        All materials are healthy
                    </h3>

                    <p class="text-green-600 text-sm mt-1">
                        No material needs immediate reorder.
                    </p>
                </div>
            `;

            return;
        }

        lowStockMaterials
            .slice(0, 6)
            .forEach(material => {
                const isCritical =
                    Number(material.currentStock || 0) <=
                    Number(material.reorderLevel || 0);

                const div =
                    document.createElement("div");

                div.className =
                    isCritical
                        ? "bg-red-50 border border-red-200 rounded-xl p-4"
                        : "bg-yellow-50 border border-yellow-200 rounded-xl p-4";

                div.innerHTML = `
                    <h3
                        class="font-semibold ${
                            isCritical
                                ? "text-red-700"
                                : "text-yellow-700"
                        }"
                    >
                        ${material.name || "Unknown Material"}
                    </h3>

                    <p
                        class="text-sm mt-1 ${
                            isCritical
                                ? "text-red-600"
                                : "text-yellow-700"
                        }"
                    >
                        ${formatNumber(
                            material.currentStock
                        )} ${material.unit || ""}
                        remaining
                    </p>

                    <p class="text-xs text-slate-500 mt-1">
                        Reorder level:
                        ${formatNumber(
                            material.reorderLevel
                        )} ${material.unit || ""}
                    </p>
                `;

                container.appendChild(div);
            });
    }

    // --------------------------------------------------
    // SUPPLIER SUMMARY
    // --------------------------------------------------

    function renderSupplierSummary() {
        const heading =
            [...document.querySelectorAll("h2")].find(
                h =>
                    h.textContent.trim() ===
                    "Supplier Summary"
            );

        if (!heading) return;

        const box =
            heading.parentElement;

        const values =
            box.querySelectorAll(
                ".flex.justify-between span:last-child"
            );

        if (values[0]) {
            values[0].textContent =
                formatNumber(suppliers.length);
        }

        // Active supplier count
        const activeSuppliers =
            suppliers.filter(
                supplier =>
                    supplier.isActive !== false
            ).length;

        if (values[1]) {
            values[1].textContent =
                formatNumber(activeSuppliers);
        }

        // Pending purchase orders
        const pendingPurchases =
            purchases.filter(
                purchase => {
                    const status =
                        String(
                            purchase.status || ""
                        ).toLowerCase();

                    return [
                        "pending",
                        "processing",
                        "approved",
                        "in_progress"
                    ].includes(status);
                }
            ).length;

        if (values[2]) {
            values[2].textContent =
                formatNumber(
                    pendingPurchases
                );
        }
    }

    

   // --------------------------------------------------
// PURCHASE ORDERS
// --------------------------------------------------

function renderPurchaseOrders() {

    const tables =
        document.querySelectorAll(
            "main section table"
        );

    if (tables.length < 2) {
        return;
    }

    const purchaseTable =
        tables[tables.length - 1];

    const tbody =
        purchaseTable.querySelector("tbody");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!purchases.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="p-8 text-center text-slate-500"
                >
                    No purchase orders found.
                </td>
            </tr>
        `;

        return;
    }

    purchases
        .slice()
        .sort(
            (a, b) =>
                new Date(b.createdAt || 0) -
                new Date(a.createdAt || 0)
        )
        .slice(0, 5)
        .forEach(purchase => {

            const row =
                document.createElement("tr");

            row.className =
                "border-t border-slate-200 hover:bg-slate-800/40";


            // ------------------------------------------
            // PO NUMBER
            // ------------------------------------------

            const poNumber =
                purchase.purchaseOrderNumber ||
                "—";


            // ------------------------------------------
            // SUPPLIER
            // ------------------------------------------

            const supplier =
                purchase.supplier?.companyName ||
                purchase.supplier?.name ||
                "—";


            // ------------------------------------------
            // MATERIALS
            // ------------------------------------------

            const materialNames =
                (purchase.items || [])
                    .map(
                        item =>
                            item.rawMaterial?.name ||
                            item.rawMaterial?.materialCode
                    )
                    .filter(Boolean);

            const materialName =
                materialNames.length
                    ? materialNames.join(", ")
                    : "—";


            // ------------------------------------------
            // AMOUNT
            // ------------------------------------------

            const amount =
                Number(
                    purchase.totalAmount || 0
                );


            // ------------------------------------------
            // STATUS
            // ------------------------------------------

            const status =
                String(
                    purchase.status || "pending"
                );

            const normalizedStatus =
                status.toLowerCase();


            let statusClass =
                "bg-yellow-500/10 text-yellow-700 border border-yellow-200";


            if (
                [
                    "received",
                    "delivered",
                    "completed"
                ].includes(
                    normalizedStatus
                )
            ) {

                statusClass =
                    "bg-green-500/10 text-green-700 border border-green-200";

            }


            if (
                [
                    "cancelled",
                    "rejected"
                ].includes(
                    normalizedStatus
                )
            ) {

                statusClass =
                    "bg-red-500/10 text-red-700 border border-red-200";

            }


            // ------------------------------------------
            // RECEIVE BUTTON
            // ------------------------------------------

            let actionHTML = "—";


            if (
                ![
                    "received",
                    "cancelled",
                    "rejected"
                ].includes(
                    normalizedStatus
                )
            ) {

                actionHTML = `
                    <button
                        type="button"
                        class="
                            receive-purchase-btn
                            text-emerald-400
                            hover:text-emerald-300
                            font-semibold
                            text-xs
                        "
                        data-id="${purchase._id}"
                    >
                        Receive
                    </button>
                `;

            }


            // ------------------------------------------
            // ROW
            // ------------------------------------------

            row.innerHTML = `
                <td class="p-4 text-white font-medium">
                    ${poNumber}
                </td>

                <td class="text-white">
                    ${supplier}
                </td>

                <td class="text-white">
                    ${materialName}
                </td>

                <td class="text-white">
                    ${formatCurrency(amount)}
                </td>

                <td>
                    <span
                        class="
                            ${statusClass}
                            px-3
                            py-1
                            rounded-full
                            text-xs
                            font-semibold
                        "
                    >
                        ${capitalize(status)}
                    </span>
                </td>

                <td>
                    ${actionHTML}
                </td>
            `;

            tbody.appendChild(row);
        });


    attachReceivePurchaseButtons();
}

// --------------------------------------------------
// RECEIVE PURCHASE BUTTONS
// --------------------------------------------------

function attachReceivePurchaseButtons() {

    const buttons =
        document.querySelectorAll(
            ".receive-purchase-btn"
        );

    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const purchase =
                    purchases.find(
                        item =>
                            String(item._id) ===
                            String(button.dataset.id)
                    );

                if (purchase) {
                    openReceivePurchaseModal(
                        purchase
                    );
                }

            }
        );

    });
}

function openReceivePurchaseModal(purchase) {

    const oldModal =
        document.getElementById(
            "receivePurchaseModal"
        );

    if (oldModal) {
        oldModal.remove();
    }

    const modal =
        document.createElement("div");

    modal.id =
        "receivePurchaseModal";

    modal.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(2, 6, 23, 0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
    `;


    // --------------------------------------------------
    // PURCHASE ITEMS
    // --------------------------------------------------

    const itemsHTML =
        (purchase.items || [])
            .map(item => {

                const ordered =
                    Number(item.quantity || 0);

                const received =
                    Number(item.receivedQuantity || 0);

                const remaining =
                    Math.max(
                        0,
                        ordered - received
                    );

                return `
                    <div
                        class="receive-item"
                        data-item-id="${item._id}"
                        style="
                            background:#ffffff;
                            border:1px solid #e2e8f0;
                            border-radius:12px;
                            padding:16px;
                        "
                    >

                        <p
                            style="
                                margin:0;
                                font-size:16px;
                                font-weight:600;
                                color:#0f172a;
                            "
                        >
                            ${
                                item.rawMaterial?.name ||
                                "Unknown Material"
                            }
                        </p>

                        <p
                            style="
                                margin:8px 0 0;
                                color:#64748b;
                                font-size:14px;
                            "
                        >
                            Ordered:
                            ${ordered}
                            ${item.unit || ""}
                        </p>

                        <p
                            style="
                                margin:4px 0 0;
                                color:#64748b;
                                font-size:14px;
                            "
                        >
                            Already received:
                            ${received}
                            ${item.unit || ""}
                        </p>

                        <p
                            style="
                                margin:4px 0 0;
                                color:#64748b;
                                font-size:14px;
                            "
                        >
                            Remaining:
                            ${remaining}
                            ${item.unit || ""}
                        </p>

                        <label
                            style="
                                display:block;
                                margin-top:14px;
                                margin-bottom:8px;
                                color:#334155;
                                font-size:14px;
                                font-weight:600;
                            "
                        >
                            Received Quantity
                        </label>

                        <input
                            type="number"
                            class="receive-quantity"
                            min="0"
                            max="${remaining}"
                            step="any"
                            value="${remaining}"
                            ${
                                remaining <= 0
                                    ? "disabled"
                                    : ""
                            }
                            style="
                                width:100%;
                                box-sizing:border-box;
                                padding:12px 14px;
                                border:1px solid #cbd5e1;
                                border-radius:12px;
                                background:#ffffff;
                                color:#0f172a;
                                outline:none;
                                font-size:15px;
                            "
                        />

                    </div>
                `;
            })
            .join("");


    // --------------------------------------------------
    // MODAL HTML
    // --------------------------------------------------

    modal.innerHTML = `

        <div
            style="
                width:100%;
                max-width:680px;
                max-height:85vh;
                background:#ffffff;
                border-radius:16px;
                box-shadow:0 25px 50px rgba(0,0,0,0.30);
                overflow:hidden;
                display:flex;
                flex-direction:column;
            "
        >

            <!-- HEADER -->

            <div
                style="
                    flex:0 0 auto;
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    padding:20px 24px;
                    border-bottom:1px solid #e2e8f0;
                    background:#ffffff;
                "
            >

                <div>

                    <h2
                        style="
                            margin:0;
                            font-size:24px;
                            font-weight:700;
                            color:#0f172a;
                        "
                    >
                        Receive Purchase
                    </h2>

                    <p
                        style="
                            margin:5px 0 0;
                            font-size:14px;
                            color:#64748b;
                        "
                    >
                        ${purchase.purchaseOrderNumber}
                    </p>

                </div>

                <button
                    type="button"
                    id="closeReceivePurchaseModal"
                    style="
                        border:none;
                        background:transparent;
                        color:#64748b;
                        font-size:22px;
                        cursor:pointer;
                        padding:6px;
                    "
                >
                    <i class="fas fa-xmark"></i>
                </button>

            </div>


            <!-- CONTENT -->

            <div
                id="receivePurchaseContent"
                style="
                    flex:1 1 auto;
                    min-height:0;
                    overflow-y:auto;
                    padding:20px 24px;
                    background:#f8fafc;
                "
            >

                <div
                    style="
                        display:flex;
                        flex-direction:column;
                        gap:12px;
                    "
                >

                    ${
                        itemsHTML ||
                        `
                        <div
                            style="
                                text-align:center;
                                color:#64748b;
                                padding:40px 10px;
                            "
                        >
                            No items available for receiving.
                        </div>
                        `
                    }

                </div>

            </div>


            <!-- FOOTER -->

            <div
                style="
                    flex:0 0 auto;
                    padding:16px 24px;
                    border-top:1px solid #e2e8f0;
                    background:#ffffff;
                    display:flex;
                    gap:12px;
                "
            >

                <button
                    type="button"
                    id="cancelReceivePurchase"
                    style="
                        flex:1;
                        border:1px solid #cbd5e1;
                        background:#ffffff;
                        color:#334155;
                        padding:13px;
                        border-radius:12px;
                        font-weight:600;
                        cursor:pointer;
                    "
                >
                    Cancel
                </button>

                <button
                    type="button"
                    id="receivePurchaseSubmit"
                    style="
                        flex:2;
                        display:block;
                        width:100%;
                        border:none;
                        background:#059669;
                        color:#ffffff;
                        padding:13px;
                        border-radius:12px;
                        font-size:15px;
                        font-weight:700;
                        cursor:pointer;
                    "
                >
                    Receive Material
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(modal);


    // --------------------------------------------------
    // CLOSE BUTTON
    // --------------------------------------------------

    const closeButton =
        document.getElementById(
            "closeReceivePurchaseModal"
        );

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {
                modal.remove();
            }
        );

    }


    // --------------------------------------------------
    // CANCEL BUTTON
    // --------------------------------------------------

    const cancelButton =
        document.getElementById(
            "cancelReceivePurchase"
        );

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            () => {
                modal.remove();
            }
        );

    }


    // --------------------------------------------------
    // RECEIVE BUTTON
    // --------------------------------------------------

    const receiveButton =
        document.getElementById(
            "receivePurchaseSubmit"
        );

    if (receiveButton) {

        receiveButton.addEventListener(
            "click",
            async () => {

                await submitReceivePurchase(
                    purchase,
                    receiveButton
                );

            }
        );

    }


    // --------------------------------------------------
    // CLICK OUTSIDE
    // --------------------------------------------------

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {
                modal.remove();
            }

        }
    );

}

// --------------------------------------------------
// SUBMIT RECEIVE PURCHASE
// --------------------------------------------------

async function submitReceivePurchase(
    purchase,
    button
) {

    const rows =
        document.querySelectorAll(
            "#receivePurchaseModal .receive-item"
        );

    const items = [];


    rows.forEach(row => {

        const itemId =
            row.dataset.itemId;

        const input =
            row.querySelector(
                ".receive-quantity"
            );

        const quantity =
            Number(
                input?.value || 0
            );

        if (
            itemId &&
            quantity > 0
        ) {

            items.push({
                itemId,
                quantity
            });

        }

    });


    if (!items.length) {

        alert(
            "Enter at least one received quantity."
        );

        return;
    }


    button.disabled = true;

    button.textContent =
        "Receiving...";


    try {

        const response =
            await apiRequest(
                `/purchases/${purchase._id}/receive`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        items
                    })
                }
            );


        alert(
            response.message ||
            "Purchase received and stock updated successfully."
        );


        const modal =
            document.getElementById(
                "receivePurchaseModal"
            );

        if (modal) {
            modal.remove();
        }


        await loadInventoryPage();


    } catch (error) {

        console.error(
            "Receive Purchase Error:",
            error
        );

        alert(
            error.message ||
            "Unable to receive purchase."
        );


        button.disabled = false;

        button.textContent =
            "Receive Material";
    }

}

   // --------------------------------------------------
// INVENTORY CHART
// --------------------------------------------------

function renderInventoryChart() {

    const canvas =
        document.getElementById(
            "inventoryChart"
        );

    if (!canvas) return;


    // --------------------------------------------------
    // GET DROPDOWN
    // --------------------------------------------------

    const select =
        document.getElementById(
            "productionPeriod"
        );


    // --------------------------------------------------
    // INITIALIZE DROPDOWN ONLY ONCE
    // --------------------------------------------------

    if (
        select &&
        select.dataset.inventoryChartInitialized !==
        "true"
    ) {

        select.innerHTML = `
            <option value="current">
                Current Stock
            </option>

            <option value="reorder">
                Reorder Level
            </option>

            <option value="minimum">
                Minimum Stock
            </option>
        `;

        select.value = "current";

        select.dataset.inventoryChartInitialized =
            "true";

        select.addEventListener(
            "change",
            () => {
                renderInventoryChart();
            }
        );
    }


    // --------------------------------------------------
    // DESTROY OLD CHART
    // --------------------------------------------------

    if (inventoryChart) {
        inventoryChart.destroy();
        inventoryChart = null;
    }


    // --------------------------------------------------
    // GET SELECTED METRIC
    // --------------------------------------------------

    const metric =
        select?.value || "current";


    // --------------------------------------------------
    // MATERIAL LABELS
    // --------------------------------------------------

    const labels =
        rawMaterials.map(
            material =>
                material.name ||
                "Unknown Material"
        );


    // --------------------------------------------------
    // DATA
    // --------------------------------------------------

    let values = [];

    let chartLabel =
        "Current Stock";


    if (metric === "reorder") {

        values =
            rawMaterials.map(
                material =>
                    Number(
                        material.reorderLevel || 0
                    )
            );

        chartLabel =
            "Reorder Level";

    } else if (metric === "minimum") {

        values =
            rawMaterials.map(
                material =>
                    Number(
                        material.minimumStock || 0
                    )
            );

        chartLabel =
            "Minimum Stock";

    } else {

        values =
            rawMaterials.map(
                material =>
                    Number(
                        material.currentStock || 0
                    )
            );

        chartLabel =
            "Current Stock";
    }


    // --------------------------------------------------
    // UPDATE SUBTITLE
    // --------------------------------------------------

    const chartHeading =
        [...document.querySelectorAll("h2")].find(
            h =>
                h.textContent.trim() ===
                "Stock Analytics"
        );


    if (chartHeading) {

        const subtitle =
            chartHeading.parentElement.querySelector(
                "p"
            );

        if (subtitle) {

            subtitle.textContent =
                `${chartLabel} by material`;
        }
    }


    // --------------------------------------------------
    // CREATE CHART
    // --------------------------------------------------

    inventoryChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {
                    labels,

                    datasets: [
                        {
                            label: chartLabel,

                            data: values,

                            borderWidth: 1
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

                            ticks: {
                                color: "#94a3b8"
                            },

                            grid: {
                                display: false
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
}

// --------------------------------------------------
// INVENTORY STATUS
// --------------------------------------------------

function renderInventoryStatus() {

    const totalMaterials =
        rawMaterials.length;

    if (!totalMaterials) {
        const stockHealthValue =
            document.getElementById(
                "stockHealthValue"
            );

        const stockHealthBar =
            document.getElementById(
                "stockHealthBar"
            );

        const reorderRequiredValue =
            document.getElementById(
                "reorderRequiredValue"
            );

        const reorderRequiredBar =
            document.getElementById(
                "reorderRequiredBar"
            );

        if (stockHealthValue) {
            stockHealthValue.textContent =
                "0%";
        }

        if (stockHealthBar) {
            stockHealthBar.style.width =
                "0%";
        }

        if (reorderRequiredValue) {
            reorderRequiredValue.textContent =
                "0";
        }

        if (reorderRequiredBar) {
            reorderRequiredBar.style.width =
                "0%";
        }

        return;
    }


    const healthyMaterials =
        rawMaterials.filter(
            material =>
                Number(material.currentStock || 0) >
                Number(material.reorderLevel || 0)
        ).length;


    const reorderRequired =
        lowStockMaterials.length;


    const stockHealthPercentage =
        (
            healthyMaterials /
            totalMaterials
        ) * 100;


    const reorderPercentage =
        (
            reorderRequired /
            totalMaterials
        ) * 100;


    const stockHealthValue =
        document.getElementById(
            "stockHealthValue"
        );

    const stockHealthBar =
        document.getElementById(
            "stockHealthBar"
        );

    const reorderRequiredValue =
        document.getElementById(
            "reorderRequiredValue"
        );

    const reorderRequiredBar =
        document.getElementById(
            "reorderRequiredBar"
        );


    if (stockHealthValue) {
        stockHealthValue.textContent =
            `${stockHealthPercentage.toFixed(0)}%`;
    }


    if (stockHealthBar) {
        stockHealthBar.style.width =
            `${stockHealthPercentage}%`;
    }


    if (reorderRequiredValue) {
        reorderRequiredValue.textContent =
            String(reorderRequired);
    }


    if (reorderRequiredBar) {
        reorderRequiredBar.style.width =
            `${reorderPercentage}%`;
    }

}

// --------------------------------------------------
// EXPORT INVENTORY REPORT
// --------------------------------------------------

function exportInventoryCSV() {

    if (!rawMaterials.length) {
        alert("No inventory data available to export.");
        return;
    }

    const headers = [
        "Material",
        "Material Code",
        "Category",
        "Current Stock",
        "Unit",
        "Minimum Stock",
        "Reorder Level",
        "Unit Cost",
        "Inventory Value",
        "Supplier",
        "Status"
    ];

    const rows = rawMaterials.map(material => {

        const stock =
            Number(material.currentStock || 0);

        const unitCost =
            Number(material.unitCost || 0);

        const minimumStock =
            Number(material.minimumStock || 0);

        const reorderLevel =
            Number(material.reorderLevel || 0);

        const inventoryValue =
            stock * unitCost;

        let status = "In Stock";

        if (stock <= reorderLevel) {
            status = "Reorder Required";
        } else if (stock <= minimumStock) {
            status = "Low Stock";
        }

        const supplier =
            material.supplier?.companyName ||
            material.supplier?.name ||
            "";

        return [
            material.name || "",
            material.materialCode || "",
            material.category || "",
            stock,
            material.unit || "",
            minimumStock,
            reorderLevel,
            unitCost,
            inventoryValue,
            supplier,
            status
        ];
    });

    const csvContent =
        [
            headers,
            ...rows
        ]
        .map(row =>
            row
                .map(value =>
                    `"${String(value).replaceAll('"', '""')}"`
                )
                .join(",")
        )
        .join("\n");

    const blob =
        new Blob(
            ["\uFEFF" + csvContent],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        `FactoryOS-Inventory-${new Date()
            .toISOString()
            .split("T")[0]}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}

    // --------------------------------------------------
    // SEARCH
    // --------------------------------------------------

    const searchInput =
        document.querySelector(
            'input[placeholder="Search Material..."]'
        );

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            event => {
                const query =
                    event.target.value
                        .trim()
                        .toLowerCase();

                filteredMaterials =
                    rawMaterials.filter(
                        material => {
                            const name =
                                String(
                                    material.name || ""
                                ).toLowerCase();

                            const code =
                                String(
                                    material.materialCode || ""
                                ).toLowerCase();

                            const category =
                                String(
                                    material.category || ""
                                ).toLowerCase();

                            return (
                                name.includes(query) ||
                                code.includes(query) ||
                                category.includes(query)
                            );
                        }
                    );

                renderMaterialTable();
            }
        );
    }

    // --------------------------------------------------
    // ADD MATERIAL BUTTONS
    // --------------------------------------------------

    function attachAddMaterialButtons() {
        const buttons =
            [...document.querySelectorAll("button")].filter(
                button =>
                    button.textContent
                        .trim()
                        .toLowerCase()
                        .includes("add material")
            );

        buttons.forEach(button => {
            // Avoid duplicate listeners
            if (
                button.dataset.inventoryBound ===
                "true"
            ) {
                return;
            }

            button.dataset.inventoryBound =
                "true";

            button.addEventListener(
                "click",
                openAddMaterialModal
            );
        });
    }

// --------------------------------------------------
// PURCHASE ORDER BUTTON
// --------------------------------------------------

function attachPurchaseOrderButton() {
    const buttons =
        [...document.querySelectorAll("button")].filter(
            button =>
                button.textContent
                    .trim()
                    .toLowerCase()
                    .includes("create purchase order")
        );

    buttons.forEach(button => {
        if (button.dataset.purchaseBound === "true") {
            return;
        }

        button.dataset.purchaseBound = "true";

        button.addEventListener(
            "click",
            openPurchaseOrderModal
        );
    });
}


// --------------------------------------------------
// PURCHASE ORDER MODAL
// --------------------------------------------------

function openPurchaseOrderModal() {
    const oldModal =
        document.getElementById(
            "inventoryPurchaseModal"
        );

    if (oldModal) {
        oldModal.remove();
    }

    const modal =
        document.createElement("div");

    modal.id =
        "inventoryPurchaseModal";

    modal.className =
        "fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-6";

    const generatedPO =
        `PO-${new Date().getFullYear()}-${Date.now()
            .toString()
            .slice(-6)}`;

    modal.innerHTML = `
        <div
            class="
                bg-white
                w-full
                max-w-3xl
                rounded-2xl
                shadow-2xl
                p-6
                max-h-[90vh]
                overflow-y-auto
            "
        >

            <div
                class="
                    flex
                    items-center
                    justify-between
                    mb-6
                "
            >

                <div>
                    <h2 class="text-2xl font-bold text-slate-900">
                        Create Purchase Order
                    </h2>

                    <p class="text-sm text-slate-500 mt-1">
                        Create a purchase request for raw materials
                    </p>
                </div>

                <button
                    type="button"
                    id="closePurchaseOrderModal"
                    class="text-slate-500 hover:text-slate-900 text-xl"
                >
                    <i class="fas fa-xmark"></i>
                </button>

            </div>


            <form
                id="inventoryPurchaseForm"
                class="space-y-5"
            >

                <!-- PO NUMBER + SUPPLIER -->

                <div class="grid grid-cols-2 gap-4">

                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-2"
                        >
                            PO Number
                        </label>

                        <input
                            id="purchaseOrderNumber"
                            type="text"
                            value="${generatedPO}"
                            required
                            class="
                                w-full
                                rounded-xl
                                border
                                border-slate-300
                                bg-white
                                text-slate-900
                                px-4
                                py-3
                                outline-none
                                focus:border-cyan-500
                            "
                        />
                    </div>


                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Supplier
                        </label>

                        <select
                            id="purchaseSupplier"
                            required
                            class="
                                w-full
                                rounded-xl
                                border
                                border-slate-300
                                bg-white
                                text-slate-900
                                px-4
                                py-3
                                outline-none
                                focus:border-cyan-500
                            "
                        >
                            <option value="">
                                Select Supplier
                            </option>
                        </select>
                    </div>

                </div>


                <!-- EXPECTED DELIVERY + TAX -->

                <div class="grid grid-cols-2 gap-4">

                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Expected Delivery Date
                        </label>

                        <input
                            id="purchaseDeliveryDate"
                            type="date"
                            class="
                                w-full
                                rounded-xl
                                border
                                border-slate-300
                                bg-white
                                text-slate-900
                                px-4
                                py-3
                            "
                        />
                    </div>


                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Tax Amount (₹)
                        </label>

                        <input
                            id="purchaseTax"
                            type="number"
                            min="0"
                            step="any"
                            value="0"
                            class="
                                w-full
                                rounded-xl
                                border
                                border-slate-300
                                bg-white
                                text-slate-900
                                px-4
                                py-3
                            "
                        />
                    </div>

                </div>


                <!-- ITEMS -->

                <div>

                    <div class="flex justify-between items-center mb-3">

                        <h3 class="font-semibold text-slate-900">
                            Purchase Items
                        </h3>

                        <button
                            type="button"
                            id="addPurchaseItem"
                            class="
                                text-sm
                                text-cyan-600
                                hover:text-cyan-800
                                font-semibold
                            "
                        >
                            + Add Item
                        </button>

                    </div>


                    <div
                        id="purchaseItemsContainer"
                        class="space-y-3"
                    ></div>

                </div>


                <!-- TOTAL -->

                <div
                    class="
                        bg-slate-100
                        rounded-xl
                        p-4
                    "
                >

                    <div class="flex justify-between">

                        <span class="text-slate-600">
                            Subtotal
                        </span>

                        <span
                            id="purchaseSubtotal"
                            class="font-semibold text-slate-900"
                        >
                            ₹0
                        </span>

                    </div>


                    <div class="flex justify-between mt-2">

                        <span class="text-slate-600">
                            Tax
                        </span>

                        <span
                            id="purchaseTaxDisplay"
                            class="font-semibold text-slate-900"
                        >
                            ₹0
                        </span>

                    </div>


                    <div
                        class="
                            flex
                            justify-between
                            mt-3
                            pt-3
                            border-t
                            border-slate-300
                        "
                    >

                        <span class="font-bold text-slate-900">
                            Total Amount
                        </span>

                        <span
                            id="purchaseTotal"
                            class="font-bold text-cyan-700 text-lg"
                        >
                            ₹0
                        </span>

                    </div>

                </div>


                <!-- NOTES -->

                <textarea
                    id="purchaseNotes"
                    rows="3"
                    placeholder="Notes"
                    class="
                        w-full
                        rounded-xl
                        border
                        border-slate-300
                        bg-white
                        text-slate-900
                        px-4
                        py-3
                        resize-none
                    "
                ></textarea>


                <button
                    type="submit"
                    id="savePurchaseOrder"
                    class="
                        w-full
                        bg-cyan-600
                        hover:bg-cyan-700
                        text-white
                        py-3
                        rounded-xl
                        font-semibold
                    "
                >
                    Create Purchase Order
                </button>

            </form>

        </div>
    `;

    document.body.appendChild(modal);

    populatePurchaseSupplierOptions();

    addPurchaseItemRow();

    document
        .getElementById(
            "closePurchaseOrderModal"
        )
        .addEventListener(
            "click",
            () => modal.remove()
        );

    document
        .getElementById(
            "addPurchaseItem"
        )
        .addEventListener(
            "click",
            addPurchaseItemRow
        );

    document
        .getElementById(
            "purchaseTax"
        )
        .addEventListener(
            "input",
            updatePurchaseTotal
        );

    document
        .getElementById(
            "inventoryPurchaseForm"
        )
        .addEventListener(
            "submit",
            submitPurchaseOrder
        );

    modal.addEventListener(
        "click",
        event => {
            if (event.target === modal) {
                modal.remove();
            }
        }
    );
}


// --------------------------------------------------
// SUPPLIER OPTIONS
// --------------------------------------------------

function populatePurchaseSupplierOptions() {
    const select =
        document.getElementById(
            "purchaseSupplier"
        );

    if (!select) return;

    suppliers
        .filter(
            supplier =>
                supplier.isActive !== false
        )
        .forEach(supplier => {

            const option =
                document.createElement("option");

            option.value =
                supplier._id;

            option.textContent =
                supplier.companyName ||
                supplier.name ||
                "Supplier";

            select.appendChild(option);
        });
}


// --------------------------------------------------
// ADD PURCHASE ITEM ROW
// --------------------------------------------------

function addPurchaseItemRow() {
    const container =
        document.getElementById(
            "purchaseItemsContainer"
        );

    if (!container) return;

    const row =
        document.createElement("div");

    row.className =
        "grid grid-cols-[1.5fr_1fr_1fr_auto] gap-3 items-end";


    const materialOptions =
        rawMaterials
            .filter(
                material =>
                    material.isActive !== false
            )
            .map(
                material => `
                    <option value="${material._id}">
                        ${material.name} (${material.materialCode})
                    </option>
                `
            )
            .join("");


    row.innerHTML = `
        <div>

            <label
                class="block text-xs font-medium text-slate-600 mb-1"
            >
                Material
            </label>

            <select
                class="
                    purchase-material
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    bg-white
                    text-slate-900
                    px-3
                    py-3
                "
            >
                <option value="">
                    Select Material
                </option>

                ${materialOptions}
            </select>

        </div>


        <div>

            <label
                class="block text-xs font-medium text-slate-600 mb-1"
            >
                Quantity
            </label>

            <input
                type="number"
                min="0.01"
                step="any"
                class="
                    purchase-quantity
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    bg-white
                    text-slate-900
                    px-3
                    py-3
                "
                placeholder="Qty"
            />

        </div>


        <div>

            <label
                class="block text-xs font-medium text-slate-600 mb-1"
            >
                Unit Cost
            </label>

            <input
                type="number"
                min="0"
                step="any"
                class="
                    purchase-unit-cost
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    bg-white
                    text-slate-900
                    px-3
                    py-3
                "
                placeholder="₹ / unit"
            />

        </div>


        <button
            type="button"
            class="
                remove-purchase-item
                text-red-500
                hover:text-red-700
                h-12
                w-12
            "
            title="Remove item"
        >
            <i class="fas fa-trash"></i>
        </button>
    `;


    container.appendChild(row);


    const materialSelect =
        row.querySelector(
            ".purchase-material"
        );

    const quantityInput =
        row.querySelector(
            ".purchase-quantity"
        );

    const unitCostInput =
        row.querySelector(
            ".purchase-unit-cost"
        );

    materialSelect.addEventListener(
        "change",
        () => {

            const material =
                rawMaterials.find(
                    item =>
                        String(item._id) ===
                        String(
                            materialSelect.value
                        )
                );

            if (material) {
                unitCostInput.value =
                    Number(
                        material.unitCost || 0
                    );
            }

            updatePurchaseTotal();
        }
    );


    quantityInput.addEventListener(
        "input",
        updatePurchaseTotal
    );

    unitCostInput.addEventListener(
        "input",
        updatePurchaseTotal
    );


    row.querySelector(
        ".remove-purchase-item"
    ).addEventListener(
        "click",
        () => {
            row.remove();
            updatePurchaseTotal();
        }
    );

    updatePurchaseTotal();
}


// --------------------------------------------------
// PURCHASE TOTAL
// --------------------------------------------------

function updatePurchaseTotal() {
    const rows =
        document.querySelectorAll(
            "#purchaseItemsContainer > div"
        );

    let subtotal = 0;

    rows.forEach(row => {

        const quantity =
            Number(
                row.querySelector(
                    ".purchase-quantity"
                )?.value || 0
            );

        const unitCost =
            Number(
                row.querySelector(
                    ".purchase-unit-cost"
                )?.value || 0
            );

        subtotal +=
            quantity * unitCost;
    });


    const tax =
        Number(
            document.getElementById(
                "purchaseTax"
            )?.value || 0
        );


    const total =
        subtotal + tax;


    const subtotalElement =
        document.getElementById(
            "purchaseSubtotal"
        );

    const taxElement =
        document.getElementById(
            "purchaseTaxDisplay"
        );

    const totalElement =
        document.getElementById(
            "purchaseTotal"
        );


    if (subtotalElement) {
        subtotalElement.textContent =
            formatCurrency(subtotal);
    }

    if (taxElement) {
        taxElement.textContent =
            formatCurrency(tax);
    }

    if (totalElement) {
        totalElement.textContent =
            formatCurrency(total);
    }
}


// --------------------------------------------------
// SUBMIT PURCHASE ORDER
// --------------------------------------------------

async function submitPurchaseOrder(event) {
    event.preventDefault();

    const purchaseOrderNumber =
        document
            .getElementById(
                "purchaseOrderNumber"
            )
            .value
            .trim();

    const supplier =
        document.getElementById(
            "purchaseSupplier"
        ).value;

    const expectedDeliveryDate =
        document.getElementById(
            "purchaseDeliveryDate"
        ).value;

    const tax =
        Number(
            document.getElementById(
                "purchaseTax"
            ).value || 0
        );

    const notes =
        document.getElementById(
            "purchaseNotes"
        ).value
        .trim();


    const rows =
        document.querySelectorAll(
            "#purchaseItemsContainer > div"
        );


    const items = [];


    rows.forEach(row => {

        const rawMaterial =
            row.querySelector(
                ".purchase-material"
            )?.value;

        const quantity =
            Number(
                row.querySelector(
                    ".purchase-quantity"
                )?.value || 0
            );

        const unitCost =
            Number(
                row.querySelector(
                    ".purchase-unit-cost"
                )?.value || 0
            );


        if (
            rawMaterial &&
            quantity > 0 &&
            unitCost >= 0
        ) {
            items.push({
                rawMaterial,
                quantity,
                unitCost
            });
        }
    });


    if (!purchaseOrderNumber) {
        alert(
            "Purchase order number is required."
        );
        return;
    }


    if (!supplier) {
        alert(
            "Please select a supplier."
        );
        return;
    }


    if (!items.length) {
        alert(
            "Please add at least one valid purchase item."
        );
        return;
    }


    const button =
        document.getElementById(
            "savePurchaseOrder"
        );


    button.disabled = true;
    button.textContent =
        "Creating...";


    try {

        await apiRequest(
            "/purchases",
            {
                method: "POST",

                body: JSON.stringify({
                    purchaseOrderNumber,
                    supplier,
                    expectedDeliveryDate:
                        expectedDeliveryDate ||
                        undefined,
                    items,
                    tax,
                    notes
                })
            }
        );


        alert(
            "Purchase order created successfully."
        );


        document
            .getElementById(
                "inventoryPurchaseModal"
            )
            .remove();


        await loadInventoryPage();

    } catch (error) {

        console.error(
            "Create Purchase Order Error:",
            error
        );

        alert(
            error.message ||
            "Unable to create purchase order."
        );

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent =
                "Create Purchase Order";
        }
    }
}

    // --------------------------------------------------
    // ADD MATERIAL MODAL
    // --------------------------------------------------

    function openAddMaterialModal() {
        const oldModal =
            document.getElementById(
                "inventoryMaterialModal"
            );

        if (oldModal) {
            oldModal.remove();
        }

        const modal =
            document.createElement("div");

        modal.id =
            "inventoryMaterialModal";

        modal.className =
            "fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-6";

        modal.innerHTML = `
            <div
                class="
                    bg-white
                    w-full
                    max-w-2xl
                    rounded-2xl
                    shadow-2xl
                    overflow-y-auto
                    max-h-[90vh]
                    p-6
                "
            >

                <div
                    class="
                        flex
                        items-center
                        justify-between
                        mb-6
                    "
                >

                    <div>
                        <h2 class="text-2xl font-bold text-slate-900">
                            Add Raw Material
                        </h2>

                        <p class="text-sm text-slate-500 mt-1">
                            Add a material to your factory inventory
                        </p>
                    </div>

                    <button
                        type="button"
                        id="closeInventoryMaterialModal"
                        class="text-slate-500 hover:text-slate-900 text-xl"
                    >
                        <i class="fas fa-xmark"></i>
                    </button>

                </div>

                <form
                    id="inventoryMaterialForm"
                    class="space-y-4"
                >

                    <div class="grid grid-cols-2 gap-4">

                        <input
                            id="inventoryMaterialName"
                            type="text"
                            required
                            placeholder="Material Name"
                            class="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 outline-none focus:border-cyan-500 bg-white text-slate-900"
                        />

                        <input
                            id="inventoryMaterialCode"
                            type="text"
                            required
                            placeholder="Material Code"
                            class="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
                        />

                    </div>

                    <div class="grid grid-cols-2 gap-4">

                        <input
                            id="inventoryMaterialCategory"
                            type="text"
                            required
                            placeholder="Category"
                            class="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
                        />

                        <select
                            id="inventoryMaterialUnit"
                            required
                            class="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
                        >
                            <option value="">Select Unit</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="litre">Litre</option>
                            <option value="unit">Unit</option>
                            <option value="roll">Roll</option>
                            <option value="piece">Piece</option>
                        </select>

                    </div>

                    <div class="grid grid-cols-2 gap-4">

                        <input
                            id="inventoryCurrentStock"
                            type="number"
                            min="0"
                            step="any"
                            value="0"
                            placeholder="Opening Stock"
                            class="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
                        />

                        <input
                            id="inventoryMinimumStock"
                            type="number"
                            min="0"
                            step="any"
                            value="0"
                            placeholder="Minimum Stock"
                            class="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
                        />

                    </div>

                    <div class="grid grid-cols-2 gap-4">

                        <input
                            id="inventoryReorderLevel"
                            type="number"
                            min="0"
                            step="any"
                            value="0"
                            placeholder="Reorder Level"
                            class="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
                        />

                        <input
                            id="inventoryUnitCost"
                            type="number"
                            min="0"
                            step="any"
                            value="0"
                            placeholder="Unit Cost (₹)"
                            class="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
                        />

                    </div>

                    <select
                        id="inventorySupplier"
                        class="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
                    >
                        <option value="">
                            Select Supplier (Optional)
                        </option>
                    </select>

                    <textarea
                        id="inventoryDescription"
                        rows="3"
                        placeholder="Description"
                        class="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 outline-none focus:border-cyan-500 resize-none"
                    ></textarea>

                    <button
                        type="submit"
                        id="saveInventoryMaterial"
                        class="
                            w-full
                            bg-cyan-600
                            hover:bg-cyan-700
                            text-white
                            py-3
                            rounded-xl
                            font-semibold
                        "
                    >
                        Create Material
                    </button>

                </form>

            </div>
        `;

        document.body.appendChild(modal);

        populateSupplierDropdown();

        document
            .getElementById(
                "closeInventoryMaterialModal"
            )
            .addEventListener(
                "click",
                () => modal.remove()
            );

        modal.addEventListener(
            "click",
            event => {
                if (event.target === modal) {
                    modal.remove();
                }
            }
        );

        document
            .getElementById(
                "inventoryMaterialForm"
            )
            .addEventListener(
                "submit",
                submitNewMaterial
            );
    }

    // --------------------------------------------------
    // SUPPLIER DROPDOWN
    // --------------------------------------------------

    function populateSupplierDropdown() {
        const select =
            document.getElementById(
                "inventorySupplier"
            );

        if (!select) return;

        suppliers
            .filter(
                supplier =>
                    supplier.isActive !== false
            )
            .forEach(supplier => {
                const option =
                    document.createElement("option");

                option.value =
                    supplier._id;

                option.textContent =
                    supplier.companyName ||
                    supplier.name ||
                    "Supplier";

                select.appendChild(
                    option
                );
            });
    }

    // --------------------------------------------------
    // CREATE NEW MATERIAL
    // --------------------------------------------------

    async function submitNewMaterial(event) {
        event.preventDefault();

        const name =
            document
                .getElementById(
                    "inventoryMaterialName"
                )
                .value
                .trim();

        const materialCode =
            document
                .getElementById(
                    "inventoryMaterialCode"
                )
                .value
                .trim();

        const category =
            document
                .getElementById(
                    "inventoryMaterialCategory"
                )
                .value
                .trim();

        const unit =
            document
                .getElementById(
                    "inventoryMaterialUnit"
                )
                .value;

        const currentStock =
            Number(
                document
                    .getElementById(
                        "inventoryCurrentStock"
                    )
                    .value || 0
            );

        const minimumStock =
            Number(
                document
                    .getElementById(
                        "inventoryMinimumStock"
                    )
                    .value || 0
            );

        const reorderLevel =
            Number(
                document
                    .getElementById(
                        "inventoryReorderLevel"
                    )
                    .value || 0
            );

        const unitCost =
            Number(
                document
                    .getElementById(
                        "inventoryUnitCost"
                    )
                    .value || 0
            );

        const supplier =
            document
                .getElementById(
                    "inventorySupplier"
                )
                .value;

        const description =
            document
                .getElementById(
                    "inventoryDescription"
                )
                .value
                .trim();

        const button =
            document.getElementById(
                "saveInventoryMaterial"
            );

        button.disabled = true;
        button.textContent =
            "Creating...";

        try {
            await apiRequest(
                "/raw-materials",
                {
                    method: "POST",

                    body: JSON.stringify({
                        name,
                        materialCode,
                        category,
                        unit,
                        currentStock,
                        minimumStock,
                        reorderLevel,
                        unitCost,
                        supplier:
                            supplier || null,
                        description
                    })
                }
            );

            alert(
                "Raw material created successfully."
            );

            document
                .getElementById(
                    "inventoryMaterialModal"
                )
                .remove();

            await loadInventoryPage();

        } catch (error) {
            alert(
                error.message ||
                "Unable to create material."
            );
        } finally {
            button.disabled = false;
            button.textContent =
                "Create Material";
        }
    }

    // --------------------------------------------------
    // STOCK UPDATE MODAL
    // --------------------------------------------------

    function openStockModal(material) {
        const oldModal =
            document.getElementById(
                "inventoryStockModal"
            );

        if (oldModal) {
            oldModal.remove();
        }

        const modal =
            document.createElement("div");

        modal.id =
            "inventoryStockModal";

        modal.className =
            "fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-6";

        modal.innerHTML = `
            <div
                class="
                    bg-white
                    w-full
                    max-w-md
                    rounded-2xl
                    shadow-2xl
                    p-6
                "
            >

                <div class="mb-6">

                    <h2 class="text-2xl font-bold text-slate-900">
                        Update Stock
                    </h2>

                    <p class="text-sm text-slate-500 mt-1">
                        ${material.name}
                    </p>

                    <p class="text-sm text-slate-600 mt-3">
                        Current Stock:
                        <strong>
                            ${formatNumber(material.currentStock)}
                            ${material.unit || ""}
                        </strong>
                    </p>

                </div>

                <form
                    id="inventoryStockForm"
                    class="space-y-4"
                >

                    <select
                        id="inventoryStockOperation"
                        class="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3"
                    >
                        <option value="add">
                            Add Stock
                        </option>

                        <option value="remove">
                            Remove Stock
                        </option>
                    </select>

                    <input
                        id="inventoryStockQuantity"
                        type="number"
                        min="0.01"
                        step="any"
                        required
                        placeholder="Quantity"
                        class="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3"
                    />

                    <textarea
                        id="inventoryStockNotes"
                        rows="3"
                        placeholder="Notes"
                        class="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 resize-none"
                    ></textarea>

                    <button
                        type="submit"
                        id="saveInventoryStock"
                        class="
                            w-full
                            bg-cyan-600
                            hover:bg-cyan-700
                            text-white
                            py-3
                            rounded-xl
                            font-semibold
                        "
                    >
                        Update Stock
                    </button>

                </form>

            </div>
        `;

        document.body.appendChild(modal);

        document
            .getElementById(
                "inventoryStockForm"
            )
            .addEventListener(
                "submit",
                event =>
                    submitStockUpdate(
                        event,
                        material
                    )
            );

        modal.addEventListener(
            "click",
            event => {
                if (event.target === modal) {
                    modal.remove();
                }
            }
        );
    }

    // --------------------------------------------------
    // UPDATE STOCK
    // --------------------------------------------------

    async function submitStockUpdate(
        event,
        material
    ) {
        event.preventDefault();

        const operation =
            document.getElementById(
                "inventoryStockOperation"
            ).value;

        const quantity =
            Number(
                document.getElementById(
                    "inventoryStockQuantity"
                ).value
            );

        const notes =
            document.getElementById(
                "inventoryStockNotes"
            ).value.trim();

        const button =
            document.getElementById(
                "saveInventoryStock"
            );

        if (!quantity || quantity <= 0) {
            alert(
                "Enter a valid quantity."
            );
            return;
        }

        button.disabled = true;
        button.textContent =
            "Updating...";

        try {
            await apiRequest(
                `/raw-materials/${material._id}/stock`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        quantity,
                        operation,
                        notes
                    })
                }
            );

            alert(
                "Stock updated successfully."
            );

            document
                .getElementById(
                    "inventoryStockModal"
                )
                .remove();

            await loadInventoryPage();

        } catch (error) {
            alert(
                error.message ||
                "Unable to update stock."
            );
        } finally {
            button.disabled = false;
            button.textContent =
                "Update Stock";
        }
    }

    const exportInventoryBtn =
    document.getElementById(
        "exportInventoryBtn"
    );

if (exportInventoryBtn) {
    exportInventoryBtn.addEventListener(
        "click",
        exportInventoryCSV
    );
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// --------------------------------------------------
// DOWNLOAD INVENTORY REPORT
// --------------------------------------------------

function downloadInventoryReport() {

    if (!rawMaterials.length) {
        alert("No inventory data available.");
        return;
    }

    const inventoryValue =
        rawMaterials.reduce(
            (total, material) =>
                total +
                (
                    Number(material.currentStock || 0) *
                    Number(material.unitCost || 0)
                ),
            0
        );

    const reorderCount =
        lowStockMaterials.length;

    const reportRows =
        rawMaterials
            .map(material => {

                const stock =
                    Number(material.currentStock || 0);

                const unitCost =
                    Number(material.unitCost || 0);

                const value =
                    stock * unitCost;

                const supplier =
                    material.supplier?.companyName ||
                    material.supplier?.name ||
                    "—";

                let status = "In Stock";

                if (
                    stock <=
                    Number(material.reorderLevel || 0)
                ) {
                    status = "Reorder Required";
                } else if (
                    stock <=
                    Number(material.minimumStock || 0)
                ) {
                    status = "Low Stock";
                }

                return `
                    <tr>
                        <td>${escapeHTML(material.name || "—")}</td>
                        <td>${escapeHTML(material.materialCode || "—")}</td>
                        <td>${escapeHTML(material.category || "—")}</td>
                        <td>${formatNumber(stock)} ${escapeHTML(material.unit || "")}</td>
                        <td>${formatCurrency(unitCost)}</td>
                        <td>${formatCurrency(value)}</td>
                        <td>${escapeHTML(supplier)}</td>
                        <td>${status}</td>
                    </tr>
                `;
            })
            .join("");

    const reportHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>FactoryOS Inventory Report</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #111827;
        }

        h1 {
            margin-bottom: 5px;
        }

        .date {
            color: #64748b;
            margin-bottom: 30px;
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }

        .card {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 18px;
        }

        .label {
            color: #64748b;
            font-size: 13px;
        }

        .value {
            font-size: 24px;
            font-weight: bold;
            margin-top: 6px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th,
        td {
            border: 1px solid #e2e8f0;
            padding: 10px;
            text-align: left;
        }

        th {
            background: #f1f5f9;
        }
    </style>
</head>

<body>

    <h1>FactoryOS Inventory Report</h1>

    <div class="date">
        Generated on:
        ${new Date().toLocaleString("en-IN")}
    </div>

    <div class="summary">

        <div class="card">
            <div class="label">Total Materials</div>
            <div class="value">
                ${formatNumber(rawMaterials.length)}
            </div>
        </div>

        <div class="card">
            <div class="label">Reorder Required</div>
            <div class="value">
                ${formatNumber(reorderCount)}
            </div>
        </div>

        <div class="card">
            <div class="label">Inventory Value</div>
            <div class="value">
                ${formatCurrency(inventoryValue)}
            </div>
        </div>

    </div>

    <table>

        <thead>
            <tr>
                <th>Material</th>
                <th>Code</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Unit Cost</th>
                <th>Inventory Value</th>
                <th>Supplier</th>
                <th>Status</th>
            </tr>
        </thead>

        <tbody>
            ${reportRows}
        </tbody>

    </table>

</body>
</html>
`;

    const blob =
        new Blob(
            [reportHTML],
            {
                type: "text/html;charset=utf-8"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        `FactoryOS-Inventory-Report-${new Date()
            .toISOString()
            .split("T")[0]}.html`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}

const downloadInventoryReportBtn =
    document.getElementById(
        "downloadInventoryReportBtn"
    );

if (downloadInventoryReportBtn) {
    downloadInventoryReportBtn.addEventListener(
        "click",
        downloadInventoryReport
    );
}

    // --------------------------------------------------
    // QUICK ACTION: ADD MATERIAL
    // --------------------------------------------------

    attachAddMaterialButtons();
    attachPurchaseOrderButton();
    // --------------------------------------------------
    // INITIAL LOAD
    // --------------------------------------------------

    loadInventoryPage();

    // --------------------------------------------------
    // CAPITALIZE
    // --------------------------------------------------

    function capitalize(value) {
        if (!value) return "—";

        return String(value)
            .replaceAll("_", " ")
            .replace(
                /\b\w/g,
                char =>
                    char.toUpperCase()
            );
    }
});