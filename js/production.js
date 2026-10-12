// ======================================================
// FACTORYOS - REAL PRODUCTION PAGE
// Backend API Connected
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "http://127.0.0.1:5000/api";

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

        return Number(value || 0)
            .toLocaleString("en-IN");
    }


    function formatDate(dateValue) {

        if (!dateValue) return "—";

        const date = new Date(dateValue);

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
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


    // --------------------------------------------------
    // PAGE STATE
    // --------------------------------------------------

    let productionRecords = [];
    let products = [];
    let machines = [];

    let productionChart = null;


    // --------------------------------------------------
    // LOAD ALL PRODUCTION DATA
    // --------------------------------------------------

    async function loadProductionPage() {

        try {

            const [
                productionResponse,
                productResponse,
                machineResponse
            ] = await Promise.all([

                apiRequest("/production"),

                apiRequest("/products"),

                apiRequest("/machines")

            ]);


            productionRecords = getArray(
                productionResponse,
                ["productionRecords", "productions"]
            );


            products = getArray(
                productResponse,
                ["products"]
            );


            machines = getArray(
                machineResponse,
                ["machines"]
            );


            renderKPIs();

            renderProductionTable();

            renderLiveStatus();

            renderProductionAlerts();

            renderEfficiency();

            renderProductionChart();


        } catch (error) {

            console.error(
                "Production Page Error:",
                error
            );

            showPageError(
                error.message ||
                "Unable to load production data."
            );

        }

    }


    // --------------------------------------------------
    // PAGE ERROR
    // --------------------------------------------------

    function showPageError(message) {

        let box =
            document.getElementById(
                "productionPageError"
            );


        if (!box) {

            box = document.createElement("div");

            box.id =
                "productionPageError";

            box.className =
                "fixed top-24 right-6 z-50 max-w-md " +
                "bg-red-50 border border-red-200 " +
                "text-red-700 rounded-xl p-4 shadow-lg";


            document.body.appendChild(box);

        }


        box.textContent = message;

    }


// --------------------------------------------------
// KPI CARDS
// --------------------------------------------------


function renderKPIs() {

  const cards = document.querySelectorAll(
        "main section > div.grid > div"
    );

    if (cards.length < 4) {
        return;
    }

    const today = new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const todayRecords =
        productionRecords.filter(record => {

            const date =
                new Date(
                    record.productionDate
                );

            date.setHours(
                0,
                0,
                0,
                0
            );

            return (
                date.getTime() ===
                today.getTime()
            );

        });

    const todayProduced =
        todayRecords.reduce(
            (sum, record) =>
                sum +
                Number(
                    record.producedQuantity || 0
                ),
            0
        );

    const totalTarget =
        todayRecords.reduce(
            (sum, record) =>
                sum +
                Number(
                    record.targetQuantity || 0
                ),
            0
        );

    const totalRejected =
        todayRecords.reduce(
            (sum, record) =>
                sum +
                Number(
                    record.rejectedQuantity || 0
                ),
            0
        );

    const efficiency =
        totalTarget > 0
            ? (todayProduced / totalTarget) * 100
            : 0;

    const runningMachines =
        machines.filter(
            machine =>
                machine.status === "running"
        ).length;


    // ------------------------------------------
    // CARD 1 - TODAY'S PRODUCTION
    // ------------------------------------------

    const productionValue =
        cards[0].querySelector("h2");

    const productionMeta =
        cards[0].querySelectorAll("p")[1];

    if (productionValue) {
        productionValue.textContent =
            formatNumber(todayProduced);
    }

    if (productionMeta) {
        productionMeta.textContent =
            `${todayRecords.length} production record${todayRecords.length === 1 ? "" : "s"} today`;
    }


    // ------------------------------------------
    // CARD 2 - EFFICIENCY
    // ------------------------------------------

    const efficiencyValue =
        cards[1].querySelector("h2");

    if (efficiencyValue) {
        efficiencyValue.textContent =
            `${efficiency.toFixed(1)}%`;
    }


    // ------------------------------------------
    // CARD 3 - RUNNING LINES
    // ------------------------------------------

    const runningValue =
        cards[2].querySelector("h2");

    if (runningValue) {
        runningValue.textContent =
            formatNumber(runningMachines);
    }

    const runningMeta =
    cards[2].querySelectorAll("p")[1];

if (runningMeta) {
    runningMeta.textContent =
        `${machines.length} total machine${machines.length === 1 ? "" : "s"}`;
}

    // ------------------------------------------
    // CARD 4 - REJECTED UNITS
    // ------------------------------------------

    const rejectedValue =
        cards[3].querySelector("h2");

    if (rejectedValue) {
        rejectedValue.textContent =
            formatNumber(totalRejected);
    }

}

    // --------------------------------------------------
    // PRODUCTION TABLE
    // --------------------------------------------------

    function renderProductionTable() {

        const tableBody =
            document.getElementById(
                "productionTableBody"
            );


        if (!tableBody) return;


        // Update table headings
        const headerRow =
            document.querySelector(
                "table thead tr"
            );


        if (headerRow) {

            headerRow.innerHTML = `
                <th class="text-left p-4">Product</th>
                <th class="text-left">Machine</th>
                <th class="text-left">Shift</th>
                <th class="text-left">Date</th>
                <th class="text-left">Target</th>
                <th class="text-left">Produced</th>
                <th class="text-left">Status</th>
            `;

        }


        tableBody.innerHTML = "";


        if (!productionRecords.length) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="p-8 text-center text-slate-400"
                    >
                        No production records found.
                    </td>
                </tr>
            `;

            return;

        }


        productionRecords
            .slice()
            .sort(
                (a, b) =>
                    new Date(b.productionDate) -
                    new Date(a.productionDate)
            )
            .forEach(record => {

                const row =
                    document.createElement("tr");


                row.className =
                    "border-t border-slate-800 hover:bg-slate-800/40";


                const machineName =
                    record.machine?.name ||
                    "Unknown Machine";


                const statusClass =
                    getStatusClass(
                        record.status
                    );


                row.innerHTML = `

                    <td class="p-4">
                        <div>
                            <p class="font-semibold">
                                ${record.productName || "—"}
                            </p>

                            ${
                                record.product?.productCode
                                    ? `
                                        <p class="text-xs text-slate-400 mt-1">
                                            ${record.product.productCode}
                                        </p>
                                      `
                                    : ""
                            }
                        </div>
                    </td>


                    <td>
                        ${machineName}
                    </td>


                    <td>
                        ${
                            record.shift
                                ? capitalize(record.shift)
                                : "—"
                        }
                    </td>


                    <td>
                        ${formatDate(record.productionDate)}
                    </td>


                    <td>
                        ${formatNumber(record.targetQuantity)}
                    </td>


                    <td>
                        ${formatNumber(record.producedQuantity)}
                    </td>


                    <td>
                        <span
                            class="${statusClass}"
                        >
                            ${capitalize(record.status)}
                        </span>
                    </td>

                `;


                tableBody.appendChild(row);

            });

    }


    // --------------------------------------------------
    // STATUS CLASS
    // --------------------------------------------------

    function getStatusClass(status) {

        if (status === "completed") {

            return `
                bg-green-500/20
                text-green-400
                px-3 py-1
                rounded-full
                text-xs
                font-semibold
            `;

        }


        if (status === "in_progress") {

            return `
                bg-cyan-500/20
                text-cyan-400
                px-3 py-1
                rounded-full
                text-xs
                font-semibold
            `;

        }


        if (status === "cancelled") {

            return `
                bg-red-500/20
                text-red-400
                px-3 py-1
                rounded-full
                text-xs
                font-semibold
            `;

        }


        return `
            bg-yellow-500/20
            text-yellow-400
            px-3 py-1
            rounded-full
            text-xs
            font-semibold
        `;

    }


    // --------------------------------------------------
    // LIVE MACHINE STATUS
    // --------------------------------------------------

    function renderLiveStatus() {

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


        const container =
            box.querySelector(".space-y-4");


        if (!container) return;


        container.innerHTML = "";


        if (!machines.length) {

            container.innerHTML = `
                <p class="text-slate-400 text-sm">
                    No machines found.
                </p>
            `;

            return;

        }


        machines
            .slice(0, 6)
            .forEach(machine => {

                const row =
                    document.createElement("div");


                row.className =
                    "flex justify-between items-center";


                const status = machine.status;


                const statusClasses =
                    getMachineStatusClasses(
                        status
                    );


                row.innerHTML = `

                    <span>
                        ${machine.name}
                    </span>

                    <span
                        class="${statusClasses}"
                    >
                        ${capitalize(status)}
                    </span>

                `;


                container.appendChild(row);

            });

    }


    // --------------------------------------------------
    // MACHINE STATUS CLASSES
    // --------------------------------------------------

    function getMachineStatusClasses(status) {

        if (status === "running") {

            return `
                bg-green-500/20
                text-green-400
                px-3 py-1
                rounded-full
                text-xs
                font-semibold
            `;

        }


        if (status === "maintenance") {

            return `
                bg-yellow-500/20
                text-yellow-400
                px-3 py-1
                rounded-full
                text-xs
                font-semibold
            `;

        }


        if (status === "breakdown") {

            return `
                bg-red-500/20
                text-red-400
                px-3 py-1
                rounded-full
                text-xs
                font-semibold
            `;

        }


        return `
            bg-slate-500/20
            text-slate-400
            px-3 py-1
            rounded-full
            text-xs
            font-semibold
        `;

    }


    // --------------------------------------------------
    // PRODUCTION ALERTS
    // --------------------------------------------------

    function renderProductionAlerts() {

        const headings =
            [...document.querySelectorAll("h2")];

        const heading =
            headings.find(
                h =>
                    h.textContent.trim() ===
                    "Production Alerts"
            );


        if (!heading) return;


        const container =
            heading.parentElement
                .querySelector(".space-y-4");


        if (!container) return;


        container.innerHTML = "";


        const alerts = [];


        // Low machine status
        const problemMachines =
            machines.filter(
                machine =>
                    machine.status ===
                    "maintenance" ||
                    machine.status ===
                    "breakdown"
            );


        problemMachines.forEach(machine => {

            alerts.push({
                type: "warning",
                title:
                    `${machine.name} needs attention`,
                text:
                    `Machine status: ${capitalize(machine.status)}`
            });

        });


        // Above-standard material usage
        productionRecords
            .slice()
            .sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            )
            .slice(0, 10)
            .forEach(record => {

                const abnormalMaterials =
                    (
                        record.materialUsageAnalysis ||
                        []
                    ).filter(
                        item =>
                            item.status ===
                            "above_standard"
                    );


                abnormalMaterials.forEach(item => {

                    alerts.push({
                        type: "danger",
                        title:
                            `${record.productName || "Production"}: extra material usage`,
                        text:
                            `${item.actualQuantity} ${item.unit} used vs ${item.expectedQuantity} ${item.unit} expected`
                    });

                });

            });


        if (!alerts.length) {

            container.innerHTML = `
                <div
                    class="bg-green-500/10
                    border border-green-500
                    rounded-xl p-4"
                >

                    <h3 class="font-semibold text-green-400">
                        All production systems look healthy
                    </h3>

                    <p class="text-green-300 text-sm mt-1">
                        No production or material alerts found.
                    </p>

                </div>
            `;

            return;

        }


        alerts
            .slice(0, 5)
            .forEach(alert => {

                const div =
                    document.createElement("div");


                const isDanger =
                    alert.type === "danger";


                div.className =
                    isDanger
                        ? `
                            bg-red-500/10
                            border border-red-500
                            rounded-xl p-4
                          `
                        : `
                            bg-yellow-500/10
                            border border-yellow-500
                            rounded-xl p-4
                          `;


                div.innerHTML = `

                    <h3 class="font-semibold">
                        ${
                            isDanger
                                ? "⚠ "
                                : "⚠ "
                        }
                        ${alert.title}
                    </h3>


                    <p
                        class="${
                            isDanger
                                ? "text-red-400"
                                : "text-yellow-400"
                        } text-sm mt-1"
                    >
                        ${alert.text}
                    </p>

                `;


                container.appendChild(div);

            });

    }


    // --------------------------------------------------
    // EFFICIENCY
    // --------------------------------------------------

    function renderEfficiency() {

        const headings =
            [...document.querySelectorAll("h2")];

        const heading =
            headings.find(
                h =>
                    h.textContent.trim() ===
                    "Efficiency Meter"
            );


        if (!heading) return;


        const box =
            heading.parentElement;


        const bars =
            box.querySelectorAll(
                ".rounded-full > div"
            );


        if (!bars.length) return;


        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );


        const todayRecords =
            productionRecords.filter(record => {

                const date =
                    new Date(
                        record.productionDate
                    );

                date.setHours(
                    0,
                    0,
                    0,
                    0
                );

                return date.getTime() ===
                    today.getTime();

            });


        const totalTarget =
            todayRecords.reduce(
                (sum, record) =>
                    sum +
                    Number(record.targetQuantity || 0),
                0
            );


        const totalProduced =
            todayRecords.reduce(
                (sum, record) =>
                    sum +
                    Number(record.producedQuantity || 0),
                0
            );


        const efficiency =
            totalTarget > 0
                ? Math.min(
                    100,
                    (totalProduced /
                        totalTarget) * 100
                )
                : 0;


        bars[0].style.width =
            `${efficiency}%`;


        bars[1].style.width =
            `${
                machines.length
                    ? (
                        machines.filter(
                            machine =>
                                machine.status ===
                                "running"
                        ).length /
                        machines.length
                    ) * 100
                    : 0
            }%`;


        bars[2].style.width =
            `${efficiency}%`;


        const values =
            box.querySelectorAll(
                ".flex.justify-between span:last-child"
            );


        if (values[0]) {
            values[0].textContent =
                `${efficiency.toFixed(0)}%`;
        }


        if (values[1]) {

            const utilization =
                machines.length
                    ? (
                        machines.filter(
                            machine =>
                                machine.status ===
                                "running"
                        ).length /
                        machines.length
                    ) * 100
                    : 0;


            values[1].textContent =
                `${utilization.toFixed(0)}%`;

        }


      const completedRecords =
    todayRecords.filter(
        record => record.status === "completed"
    ).length;

const completion =
    todayRecords.length > 0
        ? (completedRecords / todayRecords.length) * 100
        : 0;

if (values[2]) {
    values[2].textContent =
        `${completion.toFixed(0)}%`;
}

bars[2].style.width =
    `${completion}%`;

    }


    // --------------------------------------------------
    // PRODUCTION CHART
    // --------------------------------------------------

    function renderProductionChart() {

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


        const dates = [];


        for (let i = 6; i >= 0; i--) {

            const date =
                new Date(today);


            date.setDate(
                today.getDate() - i
            );


            dates.push(date);

        }


        const labels =
            dates.map(
                date =>
                    date.toLocaleDateString(
                        "en-IN",
                        {
                            day: "2-digit",
                            month: "short"
                        }
                    )
            );


        const values =
            dates.map(date => {

                const key =
                    date.toISOString()
                        .split("T")[0];


                return productionRecords
                    .filter(record => {

                        const recordKey =
                            new Date(
                                record.productionDate
                            )
                            .toISOString()
                            .split("T")[0];


                        return recordKey === key;

                    })
                    .reduce(
                        (sum, record) =>
                            sum +
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
                                    "#06b6d4",

                                backgroundColor:
                                    "rgba(6,182,212,0.12)",

                                fill: true,

                                tension: 0.35,

                                pointRadius: 4,

                                pointHoverRadius: 6

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


    // --------------------------------------------------
    // NEW PRODUCTION MODAL
    // --------------------------------------------------

    function openProductionModal() {

        const oldModal =
            document.getElementById(
                "realProductionModal"
            );


        if (oldModal) {
            oldModal.remove();
        }


        const modal =
            document.createElement("div");


        modal.id =
            "realProductionModal";


        modal.className =
            "fixed inset-0 z-50 " +
            "bg-slate-950/70 " +
            "flex items-center justify-center " +
            "p-6";


        modal.innerHTML = `

            <div
                class="
                    bg-slate-900
                    border border-slate-700
                    rounded-2xl
                    w-full
                    max-w-2xl
                    max-h-[90vh]
                    overflow-y-auto
                    p-6
                    shadow-2xl
                "
            >

                <div
                    class="
                        flex
                        justify-between
                        items-center
                        mb-6
                    "
                >

                    <div>

                        <h2 class="text-2xl font-bold">
                            New Production
                        </h2>

                        <p class="text-slate-400 text-sm mt-1">
                            Enter today's actual production and material usage
                        </p>

                    </div>


                    <button
                        type="button"
                        id="closeRealProductionModal"
                        class="text-slate-400 hover:text-white text-xl"
                    >
                        <i class="fas fa-xmark"></i>
                    </button>

                </div>


                <form
                    id="realProductionForm"
                    class="space-y-4"
                >

                    <select
                        id="realProductionProduct"
                        required
                        class="
                            w-full
                            bg-slate-800
                            border border-slate-700
                            rounded-xl
                            px-4 py-3
                            text-white
                        "
                    >

                        <option value="">
                            Select Product
                        </option>

                    </select>


                    <select
                        id="realProductionMachine"
                        required
                        class="
                            w-full
                            bg-slate-800
                            border border-slate-700
                            rounded-xl
                            px-4 py-3
                            text-white
                        "
                    >

                        <option value="">
                            Select Machine
                        </option>

                    </select>


                    <div class="grid grid-cols-2 gap-4">

                        <input
                            id="realProductionDate"
                            type="date"
                            required
                            class="
                                w-full
                                bg-slate-800
                                border border-slate-700
                                rounded-xl
                                px-4 py-3
                                text-white
                            "
                        >


                        <select
                            id="realProductionShift"
                            required
                            class="
                                w-full
                                bg-slate-800
                                border border-slate-700
                                rounded-xl
                                px-4 py-3
                                text-white
                            "
                        >

                            <option value="">
                                Select Shift
                            </option>

                            <option value="morning">
                                Morning
                            </option>

                            <option value="evening">
                                Evening
                            </option>

                            <option value="night">
                                Night
                            </option>

                        </select>

                    </div>


                    <div class="grid grid-cols-2 gap-4">

                        <input
                            id="realProductionTarget"
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Target Quantity"
                            required
                            class="
                                w-full
                                bg-slate-800
                                border border-slate-700
                                rounded-xl
                                px-4 py-3
                                text-white
                            "
                        >


                        <input
                            id="realProductionProduced"
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Produced Quantity"
                            required
                            class="
                                w-full
                                bg-slate-800
                                border border-slate-700
                                rounded-xl
                                px-4 py-3
                                text-white
                            "
                        >

                    </div>


                    <input
                        id="realProductionRejected"
                        type="number"
                        min="0"
                        step="any"
                        value="0"
                        placeholder="Rejected Quantity"
                        class="
                            w-full
                            bg-slate-800
                            border border-slate-700
                            rounded-xl
                            px-4 py-3
                            text-white
                        "
                    >


                    <select
                        id="realProductionStatus"
                        required
                        class="
                            w-full
                            bg-slate-800
                            border border-slate-700
                            rounded-xl
                            px-4 py-3
                            text-white
                        "
                    >

                        <option value="planned">
                            Planned
                        </option>

                        <option value="in_progress">
                            In Progress
                        </option>

                        <option value="completed">
                            Completed
                        </option>

                    </select>


                    <div
                        id="materialStandardBox"
                        class="
                            hidden
                            border border-slate-700
                            rounded-xl
                            p-4
                        "
                    >

                        <h3 class="font-semibold text-cyan-400 mb-4">
                            Actual Raw Material Usage
                        </h3>


                        <div
                            id="materialInputs"
                            class="space-y-4"
                        ></div>

                    </div>


                    <textarea
                        id="realProductionNotes"
                        rows="3"
                        placeholder="Notes"
                        class="
                            w-full
                            bg-slate-800
                            border border-slate-700
                            rounded-xl
                            px-4 py-3
                            text-white
                            resize-none
                        "
                    ></textarea>


                    <button
                        type="submit"
                        id="saveRealProduction"
                        class="
                            w-full
                            bg-cyan-500
                            hover:bg-cyan-600
                            py-3
                            rounded-xl
                            font-semibold
                        "
                    >
                        Create Production
                    </button>

                </form>

            </div>

        `;


        document.body.appendChild(modal);


        populateProductOptions();

        populateMachineOptions();


        const dateInput =
            document.getElementById(
                "realProductionDate"
            );


        dateInput.value =
            new Date()
                .toISOString()
                .split("T")[0];


        document
            .getElementById(
                "realProductionProduct"
            )
            .addEventListener(
                "change",
                handleProductChange
            );


        document
            .getElementById(
                "closeRealProductionModal"
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
                "realProductionForm"
            )
            .addEventListener(
                "submit",
                submitProduction
            );

    }


    // --------------------------------------------------
    // PRODUCT OPTIONS
    // --------------------------------------------------

    function populateProductOptions() {

        const select =
            document.getElementById(
                "realProductionProduct"
            );


        if (!select) return;


        products
            .filter(
                product =>
                    product.isActive !== false
            )
            .forEach(product => {

                const option =
                    document.createElement("option");


                option.value =
                    product._id;


                option.textContent =
                    `${product.name} (${product.productCode})`;


                select.appendChild(option);

            });

    }


    // --------------------------------------------------
    // MACHINE OPTIONS
    // --------------------------------------------------

    function populateMachineOptions() {

        const select =
            document.getElementById(
                "realProductionMachine"
            );


        if (!select) return;


        machines
            .filter(
                machine =>
                    machine.isActive !== false
            )
            .forEach(machine => {

                const option =
                    document.createElement("option");


                option.value =
                    machine._id;


                option.textContent =
                    `${machine.name} (${machine.machineCode})`;


                select.appendChild(option);

            });

    }


    // --------------------------------------------------
    // PRODUCT CHANGE
    // --------------------------------------------------

    function handleProductChange(event) {

        const productId =
            event.target.value;


        const product =
            products.find(
                item =>
                    String(item._id) ===
                    String(productId)
            );


        const box =
            document.getElementById(
                "materialStandardBox"
            );


        const container =
            document.getElementById(
                "materialInputs"
            );


        if (!product) {

            box.classList.add(
                "hidden"
            );

            container.innerHTML = "";

            return;

        }


        box.classList.remove(
            "hidden"
        );


        container.innerHTML = "";


        product.rawMaterials.forEach(
            standard => {

                const material =
                    standard.rawMaterial;


                const div =
                    document.createElement("div");


                div.className =
                    "border border-slate-700 rounded-xl p-4";


                div.innerHTML = `

                    <div class="mb-3">

                        <p class="font-semibold">
                            ${material.name}
                        </p>

                        <p class="text-xs text-slate-400">
                            Standard:
                            ${standard.standardQuantity}
                            ${standard.unit}
                            for
                            ${product.standardProductionQuantity}
                            ${product.unit}
                        </p>

                    </div>


                    <div class="grid grid-cols-2 gap-4">

                        <div>

                            <label
                                class="
                                    block
                                    text-xs
                                    text-slate-400
                                    mb-2
                                "
                            >
                                Actual Usage
                            </label>


                            <input
                                type="number"
                                min="0.01"
                                step="any"
                                required
                                data-material-id="${material._id}"
                                data-material-unit="${standard.unit}"
                                class="
                                    production-material-quantity
                                    w-full
                                    bg-slate-800
                                    border border-slate-700
                                    rounded-xl
                                    px-4 py-3
                                    text-white
                                "
                                placeholder="${standard.standardQuantity}"
                            >

                        </div>


                        <div>

                            <label
                                class="
                                    block
                                    text-xs
                                    text-slate-400
                                    mb-2
                                "
                            >
                                Unit
                            </label>


                            <input
                                type="text"
                                value="${standard.unit}"
                                readonly
                                class="
                                    w-full
                                    bg-slate-700
                                    border border-slate-700
                                    rounded-xl
                                    px-4 py-3
                                    text-slate-300
                                "
                            >

                        </div>

                    </div>

                `;


                container.appendChild(div);

            }
        );

    }


    // --------------------------------------------------
    // SUBMIT PRODUCTION
    // --------------------------------------------------

    async function submitProduction(event) {

        event.preventDefault();


        const productId =
            document.getElementById(
                "realProductionProduct"
            ).value;


        const machineId =
            document.getElementById(
                "realProductionMachine"
            ).value;


        const productionDate =
            document.getElementById(
                "realProductionDate"
            ).value;


        const shift =
            document.getElementById(
                "realProductionShift"
            ).value;


        const targetQuantity =
            Number(
                document.getElementById(
                    "realProductionTarget"
                ).value
            );


        const producedQuantity =
            Number(
                document.getElementById(
                    "realProductionProduced"
                ).value
            );


        const rejectedQuantity =
            Number(
                document.getElementById(
                    "realProductionRejected"
                ).value || 0
            );


        const status =
            document.getElementById(
                "realProductionStatus"
            ).value;


        const notes =
            document.getElementById(
                "realProductionNotes"
            ).value
            .trim();


        const product =
            products.find(
                item =>
                    String(item._id) ===
                    String(productId)
            );


        if (!product) {

            alert(
                "Please select a valid product."
            );

            return;

        }


        if (
            !targetQuantity ||
            targetQuantity < 0
        ) {

            alert(
                "Please enter a valid target quantity."
            );

            return;

        }


        if (
            producedQuantity < 0
        ) {

            alert(
                "Produced quantity cannot be negative."
            );

            return;

        }


        if (
            producedQuantity >
            targetQuantity
        ) {

            alert(
                "Produced quantity cannot exceed target quantity."
            );

            return;

        }


        const materialInputs =
            document.querySelectorAll(
                ".production-material-quantity"
            );


        const rawMaterials = [];


        materialInputs.forEach(input => {

            const quantity =
                Number(
                    input.value
                );


            if (
                !Number.isNaN(quantity) &&
                quantity > 0
            ) {

                rawMaterials.push({

                    rawMaterial:
                        input.dataset.materialId,

                    quantity,

                    unit:
                        input.dataset.materialUnit

                });

            }

        });


        if (!rawMaterials.length) {

            alert(
                "Please enter actual raw material usage."
            );

            return;

        }


        const submitButton =
            document.getElementById(
                "saveRealProduction"
            );


        submitButton.disabled =
            true;


        submitButton.textContent =
            "Saving...";


        try {

            const response =
                await apiRequest(
                    "/production",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({

                                machineId,

                                productId,

                                productionDate,

                                shift,

                                productName:
                                    product.name,

                                targetQuantity,

                                producedQuantity,

                                rejectedQuantity,

                                unit:
                                    product.unit ||
                                    "units",

                                status,

                                notes,

                                rawMaterials

                            })

                    }
                );


            // If planned/in-progress, record already saved.
            // If completed, backend also consumes stock.
            console.log(
                "Production created:",
                response.production
            );


            alert(
                "Production created successfully."
            );


            document
                .getElementById(
                    "realProductionModal"
                )
                .remove();


            await loadProductionPage();


        } catch (error) {

            console.error(
                "Create Production Error:",
                error
            );


            alert(
                error.message ||
                "Unable to create production."
            );

        } finally {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Create Production";

        }

    }


    // --------------------------------------------------
    // NEW PRODUCTION BUTTONS
    // --------------------------------------------------

    const newProductionButton =
        document.getElementById(
            "newProductionBtn"
        );


    if (newProductionButton) {

        newProductionButton.addEventListener(
            "click",
            openProductionModal
        );

    }


    const addProductionLineButton =
        document.getElementById(
            "addProductionLineBtn"
        );


    if (addProductionLineButton) {

        addProductionLineButton.addEventListener(
            "click",
            openProductionModal
        );

    }


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


    // --------------------------------------------------
    // INITIAL LOAD
    // --------------------------------------------------

    loadProductionPage();

})
