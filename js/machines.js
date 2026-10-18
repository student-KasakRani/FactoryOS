// ======================================================
// FACTORYOS - REAL MACHINES PAGE
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
    // PAGE STATE
    // --------------------------------------------------

    let machines = [];

    let filteredMachines = [];

    const machineEvents = new Map();

    let latestHealthByMachine = new Map();


    // --------------------------------------------------
    // API HELPER
    // --------------------------------------------------

    async function apiRequest(endpoint, options = {}) {

        const response =
            await fetch(
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
            throw new Error(
                "Invalid server response."
            );
        }


        if (!response.ok) {
            throw new Error(
                data.message ||
                "Request failed."
            );
        }


        return data;
    }


    // --------------------------------------------------
    // HELPERS
    // --------------------------------------------------

    function formatNumber(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "—";
        }

        const number = Number(value);

        if (Number.isNaN(number)) {
            return "—";
        }

        return number.toLocaleString("en-IN");
    }


    function formatDate(dateValue) {

        if (!dateValue) {
            return "—";
        }


        const date =
            new Date(dateValue);


        if (Number.isNaN(date.getTime())) {
            return "—";
        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    function formatDateTime(dateValue) {

        if (!dateValue) {
            return "—";
        }


        const date =
            new Date(dateValue);


        if (Number.isNaN(date.getTime())) {
            return "—";
        }


        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    function formatTime(dateValue) {

        if (!dateValue) {
            return "—";
        }


        const date =
            new Date(dateValue);


        if (Number.isNaN(date.getTime())) {
            return "—";
        }


        return date.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    function capitalize(value) {

        if (!value) {
            return "—";
        }


        return String(value)
            .replaceAll("_", " ")
            .replace(
                /\b\w/g,
                char =>
                    char.toUpperCase()
            );
    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function parseHealthNotes(notes) {

        if (!notes) {
            return {};
        }


        try {
            return JSON.parse(notes);
        } catch {
            return {};
        }
    }


    function getLatestHealth(machineId) {

        return latestHealthByMachine.get(
            String(machineId)
        ) || null;
    }


    function getHealthData(machineId) {

        const event =
            getLatestHealth(machineId);


        if (!event) {
            return null;
        }


        const health =
            parseHealthNotes(
                event.notes
            );


        return {
            ...health,
            checkedAt:
                event.startedAt ||
                event.createdAt,
            reason:
                event.reason || ""
        };
    }


    // --------------------------------------------------
    // STATUS BADGE
    // --------------------------------------------------

    function getStatusBadge(status) {

        const normalized =
            String(status || "")
                .toLowerCase();


        if (normalized === "running") {

            return `
                <span
                    class="
                        bg-green-100
                        text-green-700
                        px-3 py-1
                        rounded-full
                        text-xs
                        font-semibold
                    "
                >
                    Running
                </span>
            `;
        }


        if (normalized === "idle") {

            return `
                <span
                    class="
                        bg-cyan-100
                        text-cyan-700
                        px-3 py-1
                        rounded-full
                        text-xs
                        font-semibold
                    "
                >
                    Idle
                </span>
            `;
        }


        if (normalized === "maintenance") {

            return `
                <span
                    class="
                        bg-yellow-100
                        text-yellow-700
                        px-3 py-1
                        rounded-full
                        text-xs
                        font-semibold
                    "
                >
                    Maintenance
                </span>
            `;
        }


        if (normalized === "breakdown") {

            return `
                <span
                    class="
                        bg-red-100
                        text-red-700
                        px-3 py-1
                        rounded-full
                        text-xs
                        font-semibold
                    "
                >
                    Breakdown
                </span>
            `;
        }


        return `
            <span
                class="
                    bg-slate-100
                    text-slate-600
                    px-3 py-1
                    rounded-full
                    text-xs
                    font-semibold
                "
            >
                Offline
            </span>
        `;
    }


    // --------------------------------------------------
    // HEALTH BADGE
    // --------------------------------------------------

    function getHealthBadge(
        healthStatus
    ) {

        const status =
            String(
                healthStatus || ""
            ).toLowerCase();


        if (status === "healthy") {

            return `
                <span
                    class="
                        bg-green-100
                        text-green-700
                        px-3 py-1
                        rounded-full
                        text-xs
                        font-semibold
                    "
                >
                    Healthy
                </span>
            `;
        }


        if (status === "warning") {

            return `
                <span
                    class="
                        bg-yellow-100
                        text-yellow-700
                        px-3 py-1
                        rounded-full
                        text-xs
                        font-semibold
                    "
                >
                    Warning
                </span>
            `;
        }


        if (status === "critical") {

            return `
                <span
                    class="
                        bg-red-100
                        text-red-700
                        px-3 py-1
                        rounded-full
                        text-xs
                        font-semibold
                    "
                >
                    Critical
                </span>
            `;
        }


        return `
            <span
                class="
                    bg-slate-100
                    text-slate-600
                    px-3 py-1
                    rounded-full
                    text-xs
                    font-semibold
                "
            >
                Not Checked
            </span>
        `;
    }


    // ==================================================
    // LOAD MACHINES
    // ==================================================

    async function loadMachinesPage() {

        try {

            const machineResponse =
                await apiRequest(
                    "/machines"
                );


            machines =
                Array.isArray(
                    machineResponse?.machines
                )
                    ? machineResponse.machines
                    : [];


            filteredMachines =
                [...machines];


            // ------------------------------------------
            // Load events for each machine
            // ------------------------------------------

            machineEvents.clear();

            latestHealthByMachine =
                new Map();


            await Promise.all(

                machines.map(
                    async machine => {

                        try {

                            const response =
                                await apiRequest(
                                    `/machines/${machine._id}/events`
                                );


                            const events =
                                Array.isArray(
                                    response?.events
                                )
                                    ? response.events
                                    : [];


                            machineEvents.set(
                                String(machine._id),
                                events
                            );


                            const latestHealthEvent =
                                events.find(
                                    event =>
                                        event.eventType ===
                                        "health_check"
                                );


                            if (
                                latestHealthEvent
                            ) {

                                latestHealthByMachine.set(
                                    String(machine._id),
                                    latestHealthEvent
                                );

                            }

                        } catch (error) {

                            console.error(
                                `Events error for ${machine.name}:`,
                                error
                            );


                            machineEvents.set(
                                String(machine._id),
                                []
                            );

                        }

                    }
                )

            );


            renderKPIs();
            renderMachineTable();
            renderMachineHealth();
            renderTodaysMaintenance();
            renderRecentActivity();


            console.log(
                "FactoryOS Machines loaded:",
                machines
            );


        } catch (error) {

            console.error(
                "Machines Page Error:",
                error
            );


            showPageError(
                error.message ||
                "Unable to load machines."
            );

        }

    }


    // ==================================================
    // PAGE ERROR
    // ==================================================

    function showPageError(message) {

        let box =
            document.getElementById(
                "machinesPageError"
            );


        if (!box) {

            box =
                document.createElement(
                    "div"
                );


            box.id =
                "machinesPageError";


            box.className =
                `
                    fixed
                    top-24
                    right-6
                    z-50
                    max-w-md
                    bg-red-50
                    border
                    border-red-200
                    text-red-700
                    rounded-xl
                    p-4
                    shadow-lg
                `;


            document.body.appendChild(
                box
            );

        }


        box.textContent =
            message;
    }


    // ==================================================
    // KPI CARDS
    // ==================================================

    function renderKPIs() {

        const cards =
            document.querySelectorAll(
                "section .grid.grid-cols-4 > div"
            );


        if (cards.length < 4) {
            return;
        }


        const total =
            machines.length;


        const running =
            machines.filter(
                machine =>
                    String(
                        machine.status || ""
                    ).toLowerCase() ===
                    "running"
            ).length;


        const maintenance =
            machines.filter(
                machine =>
                    String(
                        machine.status || ""
                    ).toLowerCase() ===
                    "maintenance"
            ).length;


        const attention =
            machines.filter(
                machine => {

                    const status =
                        String(
                            machine.status || ""
                        ).toLowerCase();


                    return [
                        "breakdown",
                        "offline"
                    ].includes(status);

                }
            ).length;


        const activePercentage =
            total > 0
                ? (
                    (running / total) *
                    100
                ).toFixed(1)
                : "0.0";


        // Total

        cards[0]
            .querySelector("h2")
            .textContent =
                formatNumber(total);


        cards[0]
            .querySelector("p:last-child")
            .textContent =
                "Live factory machines";


        // Running

        cards[1]
            .querySelector("h2")
            .textContent =
                formatNumber(running);


        cards[1]
            .querySelector("p:last-child")
            .textContent =
                `${activePercentage}% Active`;


        // Maintenance

        cards[2]
            .querySelector("h2")
            .textContent =
                formatNumber(
                    maintenance
                );


        cards[2]
            .querySelector("p:last-child")
            .textContent =
                maintenance > 0
                    ? "Scheduled / ongoing"
                    : "No active maintenance";


        // Attention

        cards[3]
            .querySelector("h2")
            .textContent =
                formatNumber(attention);


        cards[3]
            .querySelector("p:last-child")
            .textContent =
                attention > 0
                    ? "Needs Attention"
                    : "No critical machines";

    }


    // ==================================================
    // MACHINE TABLE
    // ==================================================

    function renderMachineTable() {

        const tableBody =
            document.querySelector(
                "main table tbody"
            );


        if (!tableBody) {
            return;
        }


        tableBody.innerHTML = "";


        if (!filteredMachines.length) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="
                            px-6
                            py-10
                            text-center
                            text-slate-500
                        "
                    >
                        No machines found.
                    </td>
                </tr>
            `;

            return;
        }


        filteredMachines.forEach(
            machine => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.className =
                    `
                        border-t
                        border-slate-200
                        hover:bg-slate-50
                        transition
                    `;


                const health =
                    getHealthData(
                        machine._id
                    );


                const temperature =
                    health?.temperature ??
                    machine.temperature ??
                    "—";


                const rpm =
                    machine.rpm ??
                    "—";


                const efficiency =
                    machine.efficiency ??
                    "—";


                row.innerHTML = `

                    <td
                        class="
                            px-6
                            py-4
                            font-medium
                        "
                    >
                        ${escapeHTML(
                            machine.machineCode ||
                            "—"
                        )}
                    </td>


                    <td
                        class="
                            px-6
                            py-4
                            min-w-[220px]
                        "
                    >
                        ${escapeHTML(
                            machine.name ||
                            "—"
                        )}
                    </td>


                    <td
                        class="px-6 py-4"
                    >
                        ${getStatusBadge(
                            machine.status
                        )}
                    </td>


                    <td
                        class="
                            px-6
                            py-4
                            text-center
                        "
                    >
                        ${escapeHTML(
                            formatNumber(rpm)
                        )}
                    </td>


                    <td
                        class="
                            px-6
                            py-4
                            text-center
                        "
                    >
                        ${
                            temperature === "—"
                                ? "—"
                                : `${escapeHTML(
                                    formatNumber(
                                        temperature
                                    )
                                )}°C`
                        }
                    </td>


                    <td
                        class="
                            px-6
                            py-4
                            text-center
                        "
                    >
                        ${
                            efficiency === "—"
                                ? "—"
                                : `${escapeHTML(
                                    formatNumber(
                                        efficiency
                                    )
                                )}%`
                        }
                    </td>


                    <td
                        class="px-6 py-4"
                    >

                        <div
                            class="
                                flex
                                items-center
                                justify-center
                                gap-4
                            "
                        >

                            <!-- VIEW -->

                            <button
                                type="button"
                                class="
                                    view-machine
                                    text-cyan-400
                                    hover:text-cyan-300
                                    hover:scale-110
                                    transition
                                "
                                data-id="${machine._id}"
                                title="View Machine"
                            >
                                <i
                                    class="fas fa-eye"
                                ></i>
                            </button>


                            <!-- STATUS -->

                            <button
                                type="button"
                                class="
                                    status-machine
                                    text-yellow-400
                                    hover:text-yellow-300
                                    hover:scale-110
                                    transition
                                "
                                data-id="${machine._id}"
                                title="Update Status"
                            >
                                <i
                                    class="fas fa-sliders"
                                ></i>
                            </button>


                            <!-- HEALTH CHECK -->

                            <button
                                type="button"
                                class="
                                    health-machine
                                    text-emerald-400
                                    hover:text-emerald-300
                                    hover:scale-110
                                    transition
                                "
                                data-id="${machine._id}"
                                title="Health Check"
                            >
                                <i
                                    class="fas fa-heart-pulse"
                                ></i>
                            </button>

                        </div>

                    </td>

                `;


                tableBody.appendChild(
                    row
                );

            }
        );

    }


    // ==================================================
    // SEARCH
    // ==================================================

    const searchInput =
        document.querySelector(
            'input[placeholder="Search Machine..."]'
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                const query =
                    searchInput.value
                        .trim()
                        .toLowerCase();


                filteredMachines =
                    machines.filter(
                        machine => {

                            const code =
                                String(
                                    machine.machineCode ||
                                    ""
                                ).toLowerCase();


                            const name =
                                String(
                                    machine.name ||
                                    ""
                                ).toLowerCase();


                            const type =
                                String(
                                    machine.machineType ||
                                    ""
                                ).toLowerCase();


                            const status =
                                String(
                                    machine.status ||
                                    ""
                                ).toLowerCase();


                            return (
                                code.includes(query) ||
                                name.includes(query) ||
                                type.includes(query) ||
                                status.includes(query)
                            );

                        }
                    );


                renderMachineTable();

            }
        );

    }


    // ==================================================
    // ADD MACHINE MODAL
    // ==================================================

    function openAddMachineModal() {

        const oldModal =
            document.getElementById(
                "machineModal"
            );


        if (oldModal) {
            oldModal.remove();
        }


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "machineModal";


        modal.className =
            `
                fixed
                inset-0
                z-50
                bg-slate-950/80
                flex
                items-center
                justify-center
                p-4
            `;


        modal.innerHTML = `

            <div
                class="
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    w-full
                    max-w-3xl
                    shadow-2xl
                    max-h-[90vh]
                    overflow-y-auto
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

                        <h2
                            class="
                                text-2xl
                                font-bold
                            "
                        >
                            Add Machine
                        </h2>

                        <p
                            class="
                                text-sm
                                text-slate-500
                                mt-1
                            "
                        >
                            Add a machine to your factory
                        </p>

                    </div>


                    <button
                        type="button"
                        id="closeMachineModal"
                        class="
                            text-slate-500
                            hover:text-slate-900
                            text-xl
                        "
                    >
                        <i
                            class="fas fa-xmark"
                        ></i>
                    </button>

                </div>


                <form
                    id="machineForm"
                    class="space-y-4"
                >

                    <!-- NAME + CODE -->

                    <div
                        class="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            gap-4
                        "
                    >

                        <div>

                            <label
                                class="
                                    block
                                    text-sm
                                    text-slate-600
                                    mb-2
                                "
                            >
                                Machine Name
                            </label>

                            <input
                                id="machineName"
                                type="text"
                                required
                                placeholder="Extruder Machine"
                                class="
                                    w-full
                                    bg-slate-50
                                    border
                                    border-slate-200
                                    rounded-xl
                                    px-4
                                    py-3
                                    outline-none
                                    focus:border-cyan-400
                                "
                            >

                        </div>


                        <div>

                            <label
                                class="
                                    block
                                    text-sm
                                    text-slate-600
                                    mb-2
                                "
                            >
                                Machine Code
                            </label>

                            <input
                                id="machineCode"
                                type="text"
                                required
                                placeholder="M004"
                                class="
                                    w-full
                                    bg-slate-50
                                    border
                                    border-slate-200
                                    rounded-xl
                                    px-4
                                    py-3
                                    outline-none
                                    focus:border-cyan-400
                                "
                            >

                        </div>

                    </div>


                    <!-- TYPE + STATUS -->

                    <div
                        class="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            gap-4
                        "
                    >

                        <div>

                            <label
                                class="
                                    block
                                    text-sm
                                    text-slate-600
                                    mb-2
                                "
                            >
                                Machine Type
                            </label>

                            <select
                                id="machineType"
                                required
                                class="
                                    w-full
                                    bg-slate-50
                                    border
                                    border-slate-200
                                    rounded-xl
                                    px-4
                                    py-3
                                    outline-none
                                    focus:border-cyan-400
                                "
                            >

                                <option value="computerized">
                                    Computerized
                                </option>

                                <option value="iot">
                                    IoT
                                </option>

                                <option value="manual">
                                    Manual
                                </option>

                                <option value="other">
                                    Other
                                </option>

                            </select>

                        </div>


                        <div>

                            <label
                                class="
                                    block
                                    text-sm
                                    text-slate-600
                                    mb-2
                                "
                            >
                                Initial Status
                            </label>

                            <select
                                id="machineStatus"
                                class="
                                    w-full
                                    bg-slate-50
                                    border
                                    border-slate-200
                                    rounded-xl
                                    px-4
                                    py-3
                                    outline-none
                                    focus:border-cyan-400
                                "
                            >

                                <option value="offline">
                                    Offline
                                </option>

                                <option value="idle">
                                    Idle
                                </option>

                                <option value="running">
                                    Running
                                </option>

                                <option value="maintenance">
                                    Maintenance
                                </option>

                                <option value="breakdown">
                                    Breakdown
                                </option>

                            </select>

                        </div>

                    </div>


                    <!-- CATEGORY + LOCATION -->

                    <div
                        class="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            gap-4
                        "
                    >

                        <div>

                            <label
                                class="
                                    block
                                    text-sm
                                    text-slate-600
                                    mb-2
                                "
                            >
                                Category
                            </label>

                            <input
                                id="machineCategory"
                                type="text"
                                placeholder="Production Machine"
                                class="
                                    w-full
                                    bg-slate-50
                                    border
                                    border-slate-200
                                    rounded-xl
                                    px-4
                                    py-3
                                "
                            >

                        </div>


                        <div>

                            <label
                                class="
                                    block
                                    text-sm
                                    text-slate-600
                                    mb-2
                                "
                            >
                                Location
                            </label>

                            <input
                                id="machineLocation"
                                type="text"
                                placeholder="Production Floor - A"
                                class="
                                    w-full
                                    bg-slate-50
                                    border
                                    border-slate-200
                                    rounded-xl
                                    px-4
                                    py-3
                                "
                            >

                        </div>

                    </div>


                    <!-- MANUFACTURER + MODEL -->

                    <div
                        class="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            gap-4
                        "
                    >

                        <div>

                            <label
                                class="
                                    block
                                    text-sm
                                    text-slate-600
                                    mb-2
                                "
                            >
                                Manufacturer
                            </label>

                            <input
                                id="machineManufacturer"
                                type="text"
                                placeholder="Manufacturer Name"
                                class="
                                    w-full
                                    bg-slate-50
                                    border
                                    border-slate-200
                                    rounded-xl
                                    px-4
                                    py-3
                                "
                            >

                        </div>


                        <div>

                            <label
                                class="
                                    block
                                    text-sm
                                    text-slate-600
                                    mb-2
                                "
                            >
                                Model Number
                            </label>

                            <input
                                id="machineModelNumber"
                                type="text"
                                placeholder="Model-100"
                                class="
                                    w-full
                                    bg-slate-50
                                    border
                                    border-slate-200
                                    rounded-xl
                                    px-4
                                    py-3
                                "
                            >

                        </div>

                    </div>


                    <!-- NETWORK -->

                    <div>

                        <h3
                            class="
                                font-semibold
                                text-slate-800
                                mb-3
                            "
                        >
                            Network Details
                        </h3>


                        <div
                            class="
                                grid
                                grid-cols-1
                                md:grid-cols-3
                                gap-4
                            "
                        >

                            <input
                                id="machineIpAddress"
                                type="text"
                                placeholder="IP Address"
                                class="
                                    w-full
                                    bg-slate-50
                                    border
                                    border-slate-200
                                    rounded-xl
                                    px-4
                                    py-3
                                "
                            >


                            <input
                                id="machinePort"
                                type="number"
                                min="0"
                                placeholder="Port"
                                class="
                                    w-full
                                    bg-slate-50
                                    border
                                    border-slate-200
                                    rounded-xl
                                    px-4
                                    py-3
                                "
                            >


                            <input
                                id="machineProtocol"
                                type="text"
                                placeholder="Protocol"
                                class="
                                    w-full
                                    bg-slate-50
                                    border
                                    border-slate-200
                                    rounded-xl
                                    px-4
                                    py-3
                                "
                            >

                        </div>

                    </div>


                    <!-- IOT -->

                    <div>

                        <h3
                            class="
                                font-semibold
                                text-slate-800
                                mb-3
                            "
                        >
                            IoT Details
                        </h3>


                        <label
                            class="
                                flex
                                items-center
                                gap-3
                                text-sm
                                text-slate-600
                                mb-3
                            "
                        >

                            <input
                                id="machineIotEnabled"
                                type="checkbox"
                                class="
                                    w-4
                                    h-4
                                "
                            >

                            IoT Enabled

                        </label>


                        <div
                            class="
                                grid
                                grid-cols-1
                                md:grid-cols-2
                                gap-4
                            "
                        >

                            <input
                                id="machineSensorId"
                                type="text"
                                placeholder="Sensor ID"
                                class="
                                    w-full
                                    bg-slate-50
                                    border
                                    border-slate-200
                                    rounded-xl
                                    px-4
                                    py-3
                                "
                            >


                            <input
                                id="machineSensorType"
                                type="text"
                                placeholder="Sensor Type"
                                class="
                                    w-full
                                    bg-slate-50
                                    border
                                    border-slate-200
                                    rounded-xl
                                    px-4
                                    py-3
                                "
                            >

                        </div>

                    </div>


                    <!-- DATES -->

                    <div
                        class="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            gap-4
                        "
                    >

                        <div>

                            <label
                                class="
                                    block
                                    text-sm
                                    text-slate-600
                                    mb-2
                                "
                            >
                                Last Maintenance Date
                            </label>

                            <input
                                id="machineLastMaintenanceDate"
                                type="date"
                                class="
                                    w-full
                                    bg-slate-50
                                    border
                                    border-slate-600
                                    rounded-xl
                                    px-4
                                    py-3
                                "
                            >

                        </div>


                        <div>

                            <label
                                class="
                                    block
                                    text-sm
                                    text-slate-600
                                    mb-2
                                "
                            >
                                Next Maintenance Date
                            </label>

                            <input
                                id="machineNextMaintenanceDate"
                                type="date"
                                class="
                                    w-full
                                    bg-slate-50
                                    border
                                    border-slate-200
                                    rounded-xl
                                    px-4
                                    py-3
                                "
                            >

                        </div>

                    </div>


                    <!-- NOTES -->

                    <textarea
                        id="machineNotes"
                        rows="3"
                        placeholder="Machine notes"
                        class="
                            w-full
                            bg-slate-50
                            border
                            border-slate-200
                            rounded-xl
                            px-4
                            py-3
                            resize-none
                        "
                    ></textarea>


                    <button
                        type="submit"
                        id="machineSubmitButton"
                        class="
                            w-full
                            bg-cyan-400
                            hover:bg-cyan-500
                            text-white
                            py-3
                            rounded-xl
                            font-semibold
                            transition
                        "
                    >
                        Add Machine
                    </button>

                </form>

            </div>
        `;


        document.body.appendChild(
            modal
        );


        document
            .getElementById(
                "closeMachineModal"
            )
            .addEventListener(
                "click",
                () => modal.remove()
            );


        document
            .getElementById(
                "machineForm"
            )
            .addEventListener(
                "submit",
                submitNewMachine
            );


        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {
                    modal.remove();
                }

            }
        );

    }


    // ==================================================
    // SUBMIT NEW MACHINE
    // ==================================================

    async function submitNewMachine(event) {

        event.preventDefault();


        const button =
            document.getElementById(
                "machineSubmitButton"
            );


        const name =
            document.getElementById(
                "machineName"
            )
            .value
            .trim();


        const machineCode =
            document.getElementById(
                "machineCode"
            )
            .value
            .trim()
            .toUpperCase();


        const machineType =
            document.getElementById(
                "machineType"
            ).value;


        const category =
            document.getElementById(
                "machineCategory"
            ).value
            .trim();


        const manufacturer =
            document.getElementById(
                "machineManufacturer"
            ).value
            .trim();


        const modelNumber =
            document.getElementById(
                "machineModelNumber"
            ).value
            .trim();


        const status =
            document.getElementById(
                "machineStatus"
            ).value;


        const location =
            document.getElementById(
                "machineLocation"
            ).value
            .trim();


        const ipAddress =
            document.getElementById(
                "machineIpAddress"
            ).value
            .trim();


        const portValue =
            document.getElementById(
                "machinePort"
            ).value;


        const protocol =
            document.getElementById(
                "machineProtocol"
            ).value
            .trim();


        const iotEnabled =
            document.getElementById(
                "machineIotEnabled"
            ).checked;


        const sensorId =
            document.getElementById(
                "machineSensorId"
            ).value
            .trim();


        const sensorType =
            document.getElementById(
                "machineSensorType"
            ).value
            .trim();


        const lastMaintenanceDate =
            document.getElementById(
                "machineLastMaintenanceDate"
            ).value;


        const nextMaintenanceDate =
            document.getElementById(
                "machineNextMaintenanceDate"
            ).value;


        const notes =
            document.getElementById(
                "machineNotes"
            ).value
            .trim();


        if (!name || !machineCode) {

            alert(
                "Machine name and machine code are required."
            );

            return;
        }


        button.disabled =
            true;


        button.textContent =
            "Creating...";


        const payload = {

            name,

            machineCode,

            machineType,

            category,
            manufacturer,
            modelNumber,
            status,
            location,

            network: {
                ipAddress,
                port:
                    portValue
                        ? Number(portValue)
                        : undefined,
                protocol
            },

            iot: {
                enabled: iotEnabled,
                sensorId,
                sensorType
            },

            lastMaintenanceDate:
                lastMaintenanceDate ||
                undefined,

            nextMaintenanceDate:
                nextMaintenanceDate ||
                undefined,

            notes
        };


        try {

            const response =
                await apiRequest(
                    "/machines",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            console.log(
                "Machine created:",
                response.machine
            );


            alert(
                response.message ||
                "Machine created successfully."
            );


            document
                .getElementById(
                    "machineModal"
                )
                .remove();


            await loadMachinesPage();

        } catch (error) {

            console.error(
                "Create Machine Error:",
                error
            );


            alert(
                error.message ||
                "Unable to create machine."
            );

        } finally {

            button.disabled =
                false;


            button.textContent =
                "Add Machine";

        }

    }


    // ==================================================
    // VIEW MACHINE
    // ==================================================

    async function openViewMachineModal(
        machine
    ) {

        const oldModal =
            document.getElementById(
                "viewMachineModal"
            );


        if (oldModal) {
            oldModal.remove();
        }


        const health =
            getHealthData(
                machine._id
            );


        const events =
            machineEvents.get(
                String(machine._id)
            ) || [];


        const latestEvent =
            events[0];


        const healthStatus =
            health?.healthStatus ||
            "";


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "viewMachineModal";


        modal.className =
            `
                fixed
                inset-0
                z-50
                bg-slate-900/40
                flex
                items-center
                justify-center
                p-4
            `;


        modal.innerHTML = `

            <div
                class="
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    w-full
                    max-w-2xl
                    max-h-[90vh]
                    overflow-y-auto
                    shadow-2xl
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

                        <h2
                            class="
                                text-2xl
                                font-bold
                            "
                        >
                            Machine Details
                        </h2>

                        <p
                            class="
                                text-sm
                                text-slate-500
                                mt-1
                            "
                        >
                            ${escapeHTML(
                                machine.machineCode ||
                                "—"
                            )}
                        </p>

                    </div>


                    <button
                        type="button"
                        id="closeViewMachineModal"
                        class="
                            text-slate-500
                            hover:text-slate-900
                            text-xl
                        "
                    >
                        <i
                            class="fas fa-xmark"
                        ></i>
                    </button>

                </div>


                <div
                    class="
                        grid
                        grid-cols-1
                        md:grid-cols-2
                        gap-4
                    "
                >

                    <div
                        class="
                            bg-slate-50
                            rounded-xl
                            p-4
                        "
                    >

                        <p
                            class="
                                text-xs
                                text-slate-500
                            "
                        >
                            Machine
                        </p>

                        <p
                            class="
                                font-semibold
                                mt-1
                            "
                        >
                            ${escapeHTML(
                                machine.name ||
                                "—"
                            )}
                        </p>

                    </div>


                    <div
                        class="
                            bg-slate-50
                            rounded-xl
                            p-4
                        "
                    >

                        <p
                            class="
                                text-xs
                                text-slate-500
                            "
                        >
                            Status
                        </p>

                        <div
                            class="mt-2"
                        >
                            ${getStatusBadge(
                                machine.status
                            )}
                        </div>

                    </div>


                    <div
                        class="
                            bg-slate-50
                            rounded-xl
                            p-4
                        "
                    >

                        <p
                            class="
                                text-xs
                                text-slate-500
                            "
                        >
                            Machine Type
                        </p>

                        <p
                            class="
                                font-semibold
                                mt-1
                            "
                        >
                            ${capitalize(
                                machine.machineType
                            )}
                        </p>

                    </div>


                    <div
                        class="
                            bg-slate-50
                            rounded-xl
                            p-4
                        "
                    >

                        <p
                            class="
                                text-xs
                                text-slate-500
                            "
                        >
                            Category
                        </p>

                        <p
                            class="
                                font-semibold
                                mt-1
                            "
                        >
                            ${escapeHTML(
                                machine.category ||
                                "—"
                            )}
                        </p>

                    </div>


                    <div
                        class="
                            bg-slate-50
                            rounded-xl
                            p-4
                        "
                    >

                        <p
                            class="
                                text-xs
                                text-slate-500
                            "
                        >
                            Manufacturer
                        </p>

                        <p
                            class="
                                font-semibold
                                mt-1
                            "
                        >
                            ${escapeHTML(
                                machine.manufacturer ||
                                "—"
                            )}
                        </p>

                    </div>


                    <div
                        class="
                            bg-slate-50
                            rounded-xl
                            p-4
                        "
                    >

                        <p
                            class="
                                text-xs
                                text-slate-500
                            "
                        >
                            Location
                        </p>

                        <p
                            class="
                                font-semibold
                                mt-1
                            "
                        >
                            ${escapeHTML(
                                machine.location ||
                                "—"
                            )}
                        </p>

                    </div>


                    <div
                        class="
                            bg-slate-50
                            rounded-xl
                            p-4
                        "
                    >

                        <p
                            class="
                                text-xs
                                text-slate-500
                            "
                        >
                            Last Maintenance
                        </p>

                        <p
                            class="
                                font-semibold
                                mt-1
                            "
                        >
                            ${formatDate(
                                machine.lastMaintenanceDate
                            )}
                        </p>

                    </div>


                    <div
                        class="
                            bg-slate-50
                            rounded-xl
                            p-4
                        "
                    >

                        <p
                            class="
                                text-xs
                                text-slate-500
                            "
                        >
                            Next Maintenance
                        </p>

                        <p
                            class="
                                font-semibold
                                mt-1
                            "
                        >
                            ${formatDate(
                                machine.nextMaintenanceDate
                            )}
                        </p>

                    </div>

                </div>


                <div
                    class="
                        mt-5
                        bg-slate-50
                        rounded-xl
                        p-5
                    "
                >

                    <div
                        class="
                            flex
                            items-center
                            justify-between
                            gap-4
                        "
                    >

                        <div>

                            <p
                                class="
                                    text-xs
                                    text-slate-500
                                "
                            >
                                Latest Health Check
                            </p>

                            <div
                                class="mt-2"
                            >
                                ${getHealthBadge(
                                    healthStatus
                                )}
                            </div>

                        </div>


                        <button
                            type="button"
                            id="viewHealthCheckBtn"
                            class="
                                bg-emerald-500
                                hover:bg-emerald-600
                                px-4
                                py-2
                                rounded-xl
                                text-sm
                                font-semibold
                            "
                        >
                            Run Health Check
                        </button>

                    </div>


                    ${
                        health
                            ? `
                                <div
                                    class="
                                        grid
                                        grid-cols-1
                                        md:grid-cols-3
                                        gap-3
                                        mt-4
                                    "
                                >

                                    <div>
                                        <p
                                            class="
                                                text-xs
                                                text-slate-500
                                            "
                                        >
                                            Temperature
                                        </p>

                                        <p
                                            class="
                                                font-semibold
                                                mt-1
                                            "
                                        >
                                            ${
                                                health.temperature ??
                                                "—"
                                            }°C
                                        </p>
                                    </div>


                                    <div>
                                        <p
                                            class="
                                                text-xs
                                                text-slate-500
                                            "
                                        >
                                            Vibration
                                        </p>

                                        <p
                                            class="
                                                font-semibold
                                                mt-1
                                            "
                                        >
                                            ${
                                                health.vibration ??
                                                "—"
                                            }
                                        </p>
                                    </div>


                                    <div>
                                        <p
                                            class="
                                                text-xs
                                                text-slate-500
                                            "
                                        >
                                            Pressure
                                        </p>

                                        <p
                                            class="
                                                font-semibold
                                                mt-1
                                            "
                                        >
                                            ${
                                                health.pressure ??
                                                "—"
                                            }
                                        </p>
                                    </div>

                                </div>

                                <p
                                    class="
                                        text-xs
                                        text-slate-500
                                        mt-4
                                    "
                                >
                                    Checked:
                                    ${formatDateTime(
                                        health.checkedAt
                                    )}
                                </p>
                            `
                            : `
                                <p
                                    class="
                                        text-sm
                                        text-slate-500
                                        mt-4
                                    "
                                >
                                    No health check has been recorded yet.
                                </p>
                            `
                    }

                </div>


                <div
                    class="
                        mt-5
                        bg-slate-50
                        rounded-xl
                        p-5
                    "
                >

                    <p
                        class="
                            text-xs
                            text-slate-500
                        "
                    >
                        Latest Activity
                    </p>

                    <p
                        class="
                            font-semibold
                            mt-2
                        "
                    >
                        ${
                            latestEvent
                                ? escapeHTML(
                                    getEventMessage(
                                        latestEvent,
                                        machine
                                    )
                                )
                                : "No activity recorded."
                        }
                    </p>

                    ${
                        latestEvent
                            ? `
                                <p
                                    class="
                                        text-xs
                                        text-slate-500
                                        mt-1
                                    "
                                >
                                    ${formatDateTime(
                                        latestEvent.createdAt ||
                                        latestEvent.startedAt
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>


                <div
                    class="
                        flex
                        gap-3
                        mt-6
                    "
                >

                    <button
                        type="button"
                        id="viewStatusBtn"
                        class="
                            flex-1
                            bg-yellow-500
                            hover:bg-yellow-600
                            text-slate-950
                            py-3
                            rounded-xl
                            font-semibold
                        "
                    >
                        Update Status
                    </button>


                    <button
                        type="button"
                        id="closeViewMachineBtn"
                        class="
                            flex-1
                            bg-slate-500
                            hover:bg-slate-600
                            py-3
                            rounded-xl
                            font-semibold
                        "
                    >
                        Close
                    </button>

                </div>

            </div>
        `;


        document.body.appendChild(
            modal
        );


        document
            .getElementById(
                "closeViewMachineModal"
            )
            .addEventListener(
                "click",
                () => modal.remove()
            );


        document
            .getElementById(
                "closeViewMachineBtn"
            )
            .addEventListener(
                "click",
                () => modal.remove()
            );


        document
            .getElementById(
                "viewStatusBtn"
            )
            .addEventListener(
                "click",
                () => {

                    modal.remove();

                    openStatusModal(
                        machine
                    );

                }
            );


        document
            .getElementById(
                "viewHealthCheckBtn"
            )
            .addEventListener(
                "click",
                () => {

                    modal.remove();

                    openHealthCheckModal(
                        machine
                    );

                }
            );


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


    // ==================================================
    // UPDATE STATUS MODAL
    // ==================================================

    function openStatusModal(
        machine
    ) {

        const oldModal =
            document.getElementById(
                "statusMachineModal"
            );


        if (oldModal) {
            oldModal.remove();
        }


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "statusMachineModal";


        modal.className =
            `
                fixed
                inset-0
                z-50
                bg-slate-950/80
                flex
                items-center
                justify-center
                p-4
            `;


        modal.innerHTML = `

            <div
                class="
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    w-full
                    max-w-md
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

                        <h2
                            class="
                                text-2xl
                                font-bold
                            "
                        >
                            Update Machine Status
                        </h2>

                        <p
                            class="
                                text-sm
                                text-slate-500
                                mt-1
                            "
                        >
                            ${escapeHTML(
                                machine.name
                            )}
                        </p>

                    </div>


                    <button
                        type="button"
                        id="closeStatusModal"
                        class="
                            text-slate-500
                            hover:text-slate-900
                            text-xl
                        "
                    >
                        <i
                            class="fas fa-xmark"
                        ></i>
                    </button>

                </div>


                <form
                    id="statusMachineForm"
                    class="space-y-4"
                >

                    <select
                        id="machineStatusUpdate"
                        class="
                            w-full
                            bg-slate-50
                            border
                            border-slate-200
                            rounded-xl
                            px-4
                            py-3
                        "
                    >

                        <option
                            value="running"
                            ${
                                machine.status ===
                                "running"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Running
                        </option>

                        <option
                            value="idle"
                            ${
                                machine.status ===
                                "idle"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Idle
                        </option>

                        <option
                            value="maintenance"
                            ${
                                machine.status ===
                                "maintenance"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Maintenance
                        </option>

                        <option
                            value="breakdown"
                            ${
                                machine.status ===
                                "breakdown"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Breakdown
                        </option>

                        <option
                            value="offline"
                            ${
                                machine.status ===
                                "offline"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Offline
                        </option>

                    </select>


                    <button
                        type="submit"
                        id="saveMachineStatus"
                        class="
                            w-full
                            bg-yellow-500
                            hover:bg-yellow-600
                            text-slate-950
                            py-3
                            rounded-xl
                            font-semibold
                        "
                    >
                        Update Status
                    </button>


                    ${
                        String(
                            machine.status ||
                            ""
                        ).toLowerCase() ===
                        "breakdown"
                            ? `
                                <button
                                    type="button"
                                    id="resolveBreakdownBtn"
                                    class="
                                        w-full
                                        bg-emerald-500
                                        hover:bg-emerald-600
                                        text-white
                                        py-3
                                        rounded-xl
                                        font-semibold
                                    "
                                >
                                    Resolve Breakdown
                                </button>
                            `
                            : ""
                    }

                </form>

            </div>
        `;


        document.body.appendChild(
            modal
        );


        document
            .getElementById(
                "closeStatusModal"
            )
            .addEventListener(
                "click",
                () => modal.remove()
            );


        document
            .getElementById(
                "statusMachineForm"
            )
            .addEventListener(
                "submit",
                event =>
                    submitMachineStatus(
                        event,
                        machine
                    )
            );


        const resolveButton =
            document.getElementById(
                "resolveBreakdownBtn"
            );


        if (resolveButton) {

            resolveButton.addEventListener(
                "click",
                async () => {

                    const confirmed =
                        confirm(
                            `Resolve breakdown for ${machine.name}?`
                        );


                    if (!confirmed) {
                        return;
                    }


                    resolveButton.disabled =
                        true;


                    resolveButton.textContent =
                        "Resolving...";


                    try {

                        const response =
                            await apiRequest(
                                `/machines/${machine._id}/resolve-breakdown`,
                                {
                                    method: "PUT",

                                    body:
                                        JSON.stringify({
                                            reason:
                                                "Breakdown resolved from Machines dashboard."
                                        })
                                }
                            );


                        alert(
                            response.message ||
                            "Machine breakdown resolved successfully."
                        );


                        modal.remove();


                        await loadMachinesPage();

                    } catch (error) {

                        alert(
                            error.message ||
                            "Unable to resolve breakdown."
                        );

                    } finally {

                        resolveButton.disabled =
                            false;


                        resolveButton.textContent =
                            "Resolve Breakdown";

                    }

                }
            );

        }


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


    // ==================================================
    // SUBMIT MACHINE STATUS
    // ==================================================

    async function submitMachineStatus(
        event,
        machine
    ) {

        event.preventDefault();


        const status =
            document.getElementById(
                "machineStatusUpdate"
            ).value;


        const button =
            document.getElementById(
                "saveMachineStatus"
            );


        button.disabled =
            true;


        button.textContent =
            "Updating...";


        try {

            const response =
                await apiRequest(
                    `/machines/${machine._id}/status`,
                    {
                        method: "PUT",

                        body:
                            JSON.stringify({
                                status
                            })
                    }
                );


            alert(
                response.message ||
                "Machine status updated successfully."
            );


            document
                .getElementById(
                    "statusMachineModal"
                )
                .remove();


            await loadMachinesPage();

        } catch (error) {

            alert(
                error.message ||
                "Unable to update machine status."
            );

        } finally {

            button.disabled =
                false;


            button.textContent =
                "Update Status";

        }

    }


    // ==================================================
    // HEALTH CHECK MODAL
    // ==================================================

    function openHealthCheckModal(
        machine
    ) {

        const oldModal =
            document.getElementById(
                "healthMachineModal"
            );


        if (oldModal) {
            oldModal.remove();
        }


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "healthMachineModal";


        modal.className =
            `
                fixed
                inset-0
                z-50
                bg-slate-900/40
                flex
                items-center
                justify-center
                p-4
            `;


        modal.innerHTML = `

            <div
                class="
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    w-full
                    max-w-md
                    p-6
                    shadow-2xl
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

                        <h2
                            class="
                                text-2xl
                                font-bold
                            "
                        >
                            Machine Health Check
                        </h2>

                        <p
                            class="
                                text-sm
                                text-slate-500
                                mt-1
                            "
                        >
                            ${escapeHTML(
                                machine.name
                            )}
                        </p>

                    </div>


                    <button
                        type="button"
                        id="closeHealthMachineModal"
                        class="
                            text-slate-500
                            hover:text-slate-900
                            text-xl
                        "
                    >
                        <i
                            class="fas fa-xmark"
                        ></i>
                    </button>

                </div>


                <form
                    id="healthMachineForm"
                    class="space-y-4"
                >

                    <div>

                        <label
                            class="
                                block
                                text-sm
                                text-slate-600
                                mb-2
                            "
                        >
                            Temperature (°C)
                        </label>

                        <input
                            id="healthTemperature"
                            type="number"
                            step="any"
                            placeholder="e.g. 72"
                            class="
                                w-full
                                bg-slate-50
                                border
                                border-slate-200
                                rounded-xl
                                px-4
                                py-3
                            "
                        >

                    </div>


                    <div>

                        <label
                            class="
                                block
                                text-sm
                                text-slate-600
                                mb-2
                            "
                        >
                            Vibration
                        </label>

                        <input
                            id="healthVibration"
                            type="number"
                            step="any"
                            placeholder="e.g. 3.5"
                            class="
                                w-full
                                bg-slate-50
                                border
                                border-slate-200
                                rounded-xl
                                px-4
                                py-3
                            "
                        >

                    </div>


                    <div>

                        <label
                            class="
                                block
                                text-sm
                                text-slate-600
                                mb-2
                            "
                        >
                            Pressure
                        </label>

                        <input
                            id="healthPressure"
                            type="number"
                            step="any"
                            placeholder="e.g. 120"
                            class="
                                w-full
                                bg-slate-50
                                border
                                border-slate-200
                                rounded-xl
                                px-4
                                py-3
                            "
                        >

                    </div>


                    <button
                        type="submit"
                        id="submitHealthCheck"
                        class="
                            w-full
                            bg-emerald-500
                            hover:bg-emerald-600
                            text-white
                            py-3
                            rounded-xl
                            font-semibold
                        "
                    >
                        Run Health Check
                    </button>

                </form>

            </div>
        `;


        document.body.appendChild(
            modal
        );


        document
            .getElementById(
                "closeHealthMachineModal"
            )
            .addEventListener(
                "click",
                () => modal.remove()
            );


        document
            .getElementById(
                "healthMachineForm"
            )
            .addEventListener(
                "submit",
                event =>
                    submitHealthCheck(
                        event,
                        machine
                    )
            );


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


    // ==================================================
    // SUBMIT HEALTH CHECK
    // ==================================================

    async function submitHealthCheck(
        event,
        machine
    ) {

        event.preventDefault();


        const temperatureValue =
            document.getElementById(
                "healthTemperature"
            ).value;


        const vibrationValue =
            document.getElementById(
                "healthVibration"
            ).value;


        const pressureValue =
            document.getElementById(
                "healthPressure"
            ).value;


        const button =
            document.getElementById(
                "submitHealthCheck"
            );


        if (
            temperatureValue === "" &&
            vibrationValue === "" &&
            pressureValue === ""
        ) {

            alert(
                "Enter at least one health reading."
            );

            return;
        }


        const payload = {};


        if (
            temperatureValue !== ""
        ) {

            payload.temperature =
                Number(
                    temperatureValue
                );

        }


        if (
            vibrationValue !== ""
        ) {

            payload.vibration =
                Number(
                    vibrationValue
                );

        }


        if (
            pressureValue !== ""
        ) {

            payload.pressure =
                Number(
                    pressureValue
                );

        }


        button.disabled =
            true;


        button.textContent =
            "Checking...";


        try {

            const response =
                await apiRequest(
                    `/machines/${machine._id}/health-check`,
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            const health =
                response.health;


            let message =
                response.message ||
                "Machine health check completed.";


            if (
                health?.healthStatus
            ) {

                message +=
                    `\n\nHealth Status: ${capitalize(
                        health.healthStatus
                    )}`;

            }


            if (
                health?.alert
            ) {

                message +=
                    `\nAlert: ${health.alert.message}`;

            }


            alert(
                message
            );


            document
                .getElementById(
                    "healthMachineModal"
                )
                .remove();


            await loadMachinesPage();

        } catch (error) {

            alert(
                error.message ||
                "Unable to complete health check."
            );

        } finally {

            button.disabled =
                false;


            button.textContent =
                "Run Health Check";

        }

    }


    // ==================================================
    // MACHINE HEALTH
    // ==================================================

    function renderMachineHealth() {

        const heading =
            [...document.querySelectorAll("h2")]
                .find(
                    element =>
                        element.textContent.trim() ===
                        "Machine Health"
                );


        if (!heading) {
            return;
        }


        const box =
            heading.closest(
                ".bg-slate-900"
            );


        if (!box) {
            return;
        }


        const container =
            box.querySelector(
                ".space-y-6"
            );


        if (!container) {
            return;
        }


        container.innerHTML = "";


        if (!machines.length) {

            container.innerHTML = `
                <p
                    class="
                        text-sm
                        text-slate-500
                    "
                >
                    No machines available.
                </p>
            `;

            return;
        }


        machines.forEach(
            machine => {

                const health =
                    getHealthData(
                        machine._id
                    );


                const healthStatus =
                    health?.healthStatus ||
                    "";


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    `
                        bg-slate-50
                        rounded-xl
                        p-4
                    `;


                item.innerHTML = `

                    <div
                        class="
                            flex
                            items-center
                            justify-between
                            gap-4
                        "
                    >

                        <div>

                            <p
                                class="
                                    font-semibold
                                "
                            >
                                ${escapeHTML(
                                    machine.name
                                )}
                            </p>

                            <p
                                class="
                                    text-xs
                                    text-slate-500
                                    mt-1
                                "
                            >
                                ${
                                    health
                                        ? `Checked ${formatDateTime(
                                            health.checkedAt
                                        )}`
                                        : "No health check yet"
                                }
                            </p>

                        </div>


                        <div>

                            ${getHealthBadge(
                                healthStatus
                            )}

                        </div>

                    </div>


                    ${
                        health
                            ? `
                                <div
                                    class="
                                        grid
                                        grid-cols-3
                                        gap-3
                                        mt-4
                                    "
                                >

                                    <div>
                                        <p
                                            class="
                                                text-xs
                                                text-slate-500
                                            "
                                        >
                                            Temp
                                        </p>

                                        <p
                                            class="
                                                font-semibold
                                                mt-1
                                            "
                                        >
                                            ${
                                                health.temperature ??
                                                "—"
                                            }°C
                                        </p>
                                    </div>


                                    <div>
                                        <p
                                            class="
                                                text-xs
                                                text-slate-500
                                            "
                                        >
                                            Vibration
                                        </p>

                                        <p
                                            class="
                                                font-semibold
                                                mt-1
                                            "
                                        >
                                            ${
                                                health.vibration ??
                                                "—"
                                            }
                                        </p>
                                    </div>


                                    <div>
                                        <p
                                            class="
                                                text-xs
                                                text-slate-500
                                            "
                                        >
                                            Pressure
                                        </p>

                                        <p
                                            class="
                                                font-semibold
                                                mt-1
                                            "
                                        >
                                            ${
                                                health.pressure ??
                                                "—"
                                            }
                                        </p>
                                    </div>

                                </div>
                            `
                            : ""
                    }

                `;


                container.appendChild(
                    item
                );

            }
        );

    }


    // ==================================================
    // TODAY'S MAINTENANCE
    // ==================================================

    function renderTodaysMaintenance() {

        const heading =
            [...document.querySelectorAll("h2")]
                .find(
                    element =>
                        element.textContent.trim() ===
                        "Today's Maintenance"
                );


        if (!heading) {
            return;
        }


        const container =
            heading.parentElement
                .querySelector(
                    ".space-y-4"
                );


        if (!container) {
            return;
        }


        container.innerHTML = "";


        const scheduledMachines =
            machines
                .filter(
                    machine =>
                        machine.nextMaintenanceDate
                )
                .sort(
                    (a, b) =>
                        new Date(
                            a.nextMaintenanceDate
                        ) -
                        new Date(
                            b.nextMaintenanceDate
                        )
                )
                .slice(0, 5);


        if (!scheduledMachines.length) {

            container.innerHTML = `
                <div
                    class="
                        bg-slate-50
                        rounded-xl
                        p-4
                    "
                >

                    <p
                        class="
                            font-semibold
                            text-green-400
                        "
                    >
                        ✓ No upcoming maintenance scheduled
                    </p>

                    <p
                        class="
                            text-slate-500
                            text-sm
                            mt-1
                        "
                    >
                        Add next maintenance dates to machines.
                    </p>

                </div>
            `;

            return;
        }


        scheduledMachines.forEach(
            machine => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    `
                        bg-slate-50
                        rounded-xl
                        p-4
                    `;


                item.innerHTML = `

                    <p
                        class="
                            font-semibold
                        "
                    >
                        🛠 Machine Maintenance
                    </p>


                    <p
                        class="
                            text-slate-500
                            text-sm
                            mt-1
                        "
                    >
                        ${escapeHTML(
                            machine.name
                        )}
                    </p>


                    <p
                        class="
                            text-cyan-400
                            mt-2
                        "
                    >
                        ${formatDate(
                            machine.nextMaintenanceDate
                        )}
                    </p>

                `;


                container.appendChild(
                    item
                );

            }
        );

    }


    // ==================================================
    // EVENT MESSAGE
    // ==================================================

    function getEventMessage(
        event,
        machine
    ) {

        const eventType =
            String(
                event.eventType ||
                ""
            ).toLowerCase();


        if (
            eventType ===
            "health_check"
        ) {

            const health =
                parseHealthNotes(
                    event.notes
                );


            return (
                `${machine.name} health check: ` +
                `${capitalize(
                    health.healthStatus
                )}`
            );
        }


        if (
            eventType ===
            "breakdown"
        ) {

            return (
                `${machine.name} breakdown reported`
            );
        }


        if (
            eventType ===
            "maintenance"
        ) {

            return (
                `${machine.name} maintenance status updated`
            );
        }


        if (
            eventType ===
            "status_change"
        ) {

            return (
                `${machine.name} status changed to ` +
                `${capitalize(
                    event.newStatus
                )}`
            );
        }


        return (
            `${machine.name} machine activity`
        );

    }


    // ==================================================
    // RECENT ACTIVITY
    // ==================================================

    function renderRecentActivity() {

        const heading =
            [...document.querySelectorAll("h2")]
                .find(
                    element =>
                        element.textContent.trim() ===
                        "Recent Machine Activity"
                );


        if (!heading) {
            return;
        }


        const container =
            heading.parentElement
                .parentElement
                .querySelector(
                    ".space-y-4"
                );


        if (!container) {
            return;
        }


        container.innerHTML = "";


        const allEvents = [];


        machines.forEach(
            machine => {

                const events =
                    machineEvents.get(
                        String(machine._id)
                    ) || [];


                events.forEach(
                    event => {

                        allEvents.push({
                            ...event,

                            machineName:
                                machine.name
                        });

                    }
                );

            }
        );


        allEvents.sort(
            (a, b) =>
                new Date(
                    b.createdAt ||
                    b.startedAt ||
                    0
                ) -
                new Date(
                    a.createdAt ||
                    a.startedAt ||
                    0
                )
        );


        const recentEvents =
            allEvents.slice(0, 8);


        if (!recentEvents.length) {

            container.innerHTML = `
                <div
                    class="
                        bg-slate-50
                        rounded-xl
                        p-4
                    "
                >

                    <p
                        class="
                            text-slate-500
                            text-sm
                        "
                    >
                        No machine activity recorded yet.
                    </p>

                </div>
            `;

            return;
        }


        recentEvents.forEach(
            event => {

                const item =
                    document.createElement(
                        "div"
                    );


                const isDanger =
                    [
                        "breakdown"
                    ].includes(
                        String(
                            event.eventType ||
                            ""
                        ).toLowerCase()
                    );


                item.className =
                    `
                        flex
                        items-center
                        justify-between
                        gap-4
                        bg-slate-50
                        rounded-xl
                        p-4
                    `;


                item.innerHTML = `

                    <div>

                        <h3
                            class="
                                font-semibold
                            "
                        >
                            ${escapeHTML(
                                getEventMessage(
                                    event,
                                    {
                                        name:
                                            event.machineName
                                    }
                                )
                            )}
                        </h3>


                        <p
                            class="
                                text-slate-500
                                text-sm
                                mt-1
                            "
                        >
                            ${
                                event.reason
                                    ? escapeHTML(
                                        event.reason
                                    )
                                    : capitalize(
                                        event.eventType
                                    )
                            }
                        </p>

                    </div>


                    <span
                        class="
                            ${
                                isDanger
                                    ? "text-red-400"
                                    : "text-cyan-400"
                            }
                            whitespace-nowrap
                        "
                    >
                        ${formatTime(
                            event.createdAt ||
                            event.startedAt
                        )}
                    </span>

                `;


                container.appendChild(
                    item
                );

            }
        );

    }


    // ==================================================
    // TABLE ACTIONS
    // ==================================================

    const table =
        document.querySelector(
            "main table"
        );


    if (table) {

        table.addEventListener(
            "click",
            event => {

                const viewButton =
                    event.target.closest(
                        ".view-machine"
                    );


                if (viewButton) {

                    const machine =
                        machines.find(
                            item =>
                                String(
                                    item._id
                                ) ===
                                String(
                                    viewButton.dataset.id
                                )
                        );


                    if (machine) {

                        openViewMachineModal(
                            machine
                        );

                    }


                    return;
                }


                const statusButton =
                    event.target.closest(
                        ".status-machine"
                    );


                if (statusButton) {

                    const machine =
                        machines.find(
                            item =>
                                String(
                                    item._id
                                ) ===
                                String(
                                    statusButton.dataset.id
                                )
                        );


                    if (machine) {

                        openStatusModal(
                            machine
                        );

                    }


                    return;
                }


                const healthButton =
                    event.target.closest(
                        ".health-machine"
                    );


                if (healthButton) {

                    const machine =
                        machines.find(
                            item =>
                                String(
                                    item._id
                                ) ===
                                String(
                                    healthButton.dataset.id
                                )
                        );


                    if (machine) {

                        openHealthCheckModal(
                            machine
                        );

                    }

                }

            }
        );

    }


    // ==================================================
    // ADD MACHINE BUTTON
    // ==================================================

    const addMachineButton =
        [...document.querySelectorAll("button")]
            .find(
                button =>
                    button.textContent
                        .trim()
                        .toLowerCase()
                        .includes(
                            "add machine"
                        )
            );


    if (addMachineButton) {

        addMachineButton.addEventListener(
            "click",
            openAddMachineModal
        );

    }


    // ==================================================
    // EXPORT MACHINE REPORT
    // ==================================================

    const exportMachineButton =
        [...document.querySelectorAll("button")]
            .find(
                button =>
                    button.textContent
                        .trim()
                        .toLowerCase() ===
                    "export report"
            );


    if (exportMachineButton) {

        exportMachineButton.addEventListener(
            "click",
            exportMachinesCSV
        );

    }


    // ==================================================
    // EXPORT CSV
    // ==================================================

    function exportMachinesCSV() {

        if (!machines.length) {

            alert(
                "No machine data available."
            );

            return;
        }


        const headers = [
            "Machine Code",
            "Machine Name",
            "Machine Type",
            "Category",
            "Status",
            "Location",
            "Manufacturer",
            "Model Number",
            "Last Maintenance",
            "Next Maintenance",
            "Latest Health Status",
            "Latest Temperature",
            "Latest Vibration",
            "Latest Pressure"
        ];


        const rows =
            machines.map(
                machine => {

                    const health =
                        getHealthData(
                            machine._id
                        );


                    return [

                        machine.machineCode ||
                        "",

                        machine.name ||
                        "",

                        machine.machineType ||
                        "",

                        machine.category ||
                        "",

                        machine.status ||
                        "",

                        machine.location ||
                        "",

                        machine.manufacturer ||
                        "",

                        machine.modelNumber ||
                        "",

                        formatDate(
                            machine.lastMaintenanceDate
                        ),

                        formatDate(
                            machine.nextMaintenanceDate
                        ),

                        health?.healthStatus ||
                        "",

                        health?.temperature ??
                        "",

                        health?.vibration ??
                        "",

                        health?.pressure ??
                        ""

                    ];

                }
            );


        const csvContent =
            [
                headers,
                ...rows
            ]
            .map(
                row =>
                    row
                        .map(
                            value =>
                                `"${String(
                                    value
                                )
                                .replaceAll(
                                    '"',
                                    '""'
                                )}"`
                        )
                        .join(",")
            )
            .join("\n");


        const blob =
            new Blob(
                [
                    "\uFEFF" +
                    csvContent
                ],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            `FactoryOS-Machines-${new Date()
                .toISOString()
                .split("T")[0]}.csv`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );

    }


    // ==================================================
    // INITIAL LOAD
    // ==================================================

    loadMachinesPage();

});