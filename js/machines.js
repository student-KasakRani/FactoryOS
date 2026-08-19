// =========================================
// FACTORYOS - MACHINES PAGE
// PART 1
// Data + Table + KPI + Search
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------------------
    // Machine Data
    // -----------------------------------------

    let machines = JSON.parse(
        localStorage.getItem("factoryMachines")
    ) || [
        {
            id: "M001",
            name: "Extruder Machine",
            status: "Running",
            rpm: 1450,
            temperature: 78,
            efficiency: 96,
            health: 95
        },
        {
            id: "M002",
            name: "Printing Machine",
            status: "Maintenance",
            rpm: 1120,
            temperature: 69,
            efficiency: 88,
            health: 82
        },
        {
            id: "M003",
            name: "Cutting Machine",
            status: "Stopped",
            rpm: 0,
            temperature: 32,
            efficiency: 40,
            health: 40
        }
    ];


    // -----------------------------------------
    // Save Machines
    // -----------------------------------------

    function saveMachines() {

        localStorage.setItem(
            "factoryMachines",
            JSON.stringify(machines)
        );

    }


    // -----------------------------------------
    // Important Elements
    // -----------------------------------------

    const tableBody = document.querySelector("tbody");

    const searchInput = document.querySelector(
        'input[placeholder="Search Machine..."]'
    );


    // -----------------------------------------
    // Status Badge
    // -----------------------------------------

    function getStatusBadge(status) {

        if (status === "Running") {

            return `
                <span class="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs">
                    Running
                </span>
            `;

        }

        if (status === "Maintenance") {

            return `
                <span class="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs">
                    Maintenance
                </span>
            `;

        }

        return `
            <span class="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs">
                Stopped
            </span>
        `;

    }


    // -----------------------------------------
    // Render Machine Table
    // -----------------------------------------

    function renderMachines(list = machines) {

        if (!tableBody) return;

        tableBody.innerHTML = "";

        if (list.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7"
                        class="px-6 py-10 text-center text-slate-400">

                        No machines found

                    </td>
                </tr>
            `;

            updateCards();

            return;
        }


        list.forEach((machine) => {

            const row = document.createElement("tr");

            row.className =
                "border-t border-slate-800 hover:bg-slate-800/60 transition-all duration-300";


            row.innerHTML = `

                <td class="px-6 py-4">
                    ${machine.id}
                </td>

                <td class="px-6 py-4 min-w-[220px]">
                    ${machine.name}
                </td>

                <td class="px-6 py-4">
                    ${getStatusBadge(machine.status)}
                </td>

                <td class="px-6 py-4 text-center">
                    ${machine.rpm}
                </td>

                <td class="px-6 py-4 text-center">
                    ${machine.temperature}°C
                </td>

                <td class="px-6 py-4 text-center">
                    ${machine.efficiency}%
                </td>

                <td class="px-6 py-4">

                    <div class="flex items-center justify-center gap-4">

                        <button
                            class="view-machine text-cyan-400 hover:text-cyan-300 hover:scale-110 transition"
                            data-id="${machine.id}"
                            title="View">

                            <i class="fas fa-eye"></i>

                        </button>


                        <button
                            class="edit-machine text-yellow-400 hover:text-yellow-300 hover:scale-110 transition"
                            data-id="${machine.id}"
                            title="Edit">

                            <i class="fas fa-pen"></i>

                        </button>


                        <button
                            class="delete-machine text-red-400 hover:text-red-300 hover:scale-110 transition"
                            data-id="${machine.id}"
                            title="Delete">

                            <i class="fas fa-trash"></i>

                        </button>

                    </div>

                </td>

            `;


            tableBody.appendChild(row);

        });


        updateCards();

    }


    // -----------------------------------------
    // Update KPI Cards
    // -----------------------------------------

    function updateCards() {

        const cards = document.querySelectorAll(
            "section .grid.grid-cols-4 > div"
        );

        if (cards.length < 4) return;


        const total =
            machines.length;


        const running =
            machines.filter(
                machine => machine.status === "Running"
            ).length;


        const maintenance =
            machines.filter(
                machine => machine.status === "Maintenance"
            ).length;


        const stopped =
            machines.filter(
                machine => machine.status === "Stopped"
            ).length;


        const runningPercent =
            total > 0
                ? ((running / total) * 100).toFixed(1)
                : 0;


        // Total Machines

        cards[0]
            .querySelector("h2")
            .textContent = total;


        cards[0]
            .querySelector("p:last-child")
            .textContent = "+ This Month";


        // Running

        cards[1]
            .querySelector("h2")
            .textContent = running;


        cards[1]
            .querySelector("p:last-child")
            .textContent =
                `${runningPercent}% Active`;


        // Maintenance

        cards[2]
            .querySelector("h2")
            .textContent = maintenance;


        cards[2]
            .querySelector("p:last-child")
            .textContent = "Scheduled";


        // Stopped

        cards[3]
            .querySelector("h2")
            .textContent = stopped;


        cards[3]
            .querySelector("p:last-child")
            .textContent =
                stopped > 0
                    ? "Needs Attention"
                    : "All Running";

    }


    // -----------------------------------------
    // Search Machine
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
                    machines.filter(machine =>

                        machine.id
                            .toLowerCase()
                            .includes(value)

                        ||

                        machine.name
                            .toLowerCase()
                            .includes(value)

                        ||

                        machine.status
                            .toLowerCase()
                            .includes(value)

                    );


                renderMachines(filtered);

            }
        );

    }


    // -----------------------------------------
    // Initial Render
    // -----------------------------------------

    renderMachines();


    console.log(
        "FactoryOS Machines - Part 1 Loaded"
    );

// =========================================
// FACTORYOS - MACHINES PAGE
// PART 2
// ADD + VIEW + EDIT + DELETE
// =========================================


// -----------------------------------------
// Add Machine Button
// -----------------------------------------

const addMachineButton = [...document.querySelectorAll("button")]
    .find(button =>
        button.textContent.trim().includes("Add Machine")
    );


// -----------------------------------------
// Create Modal
// -----------------------------------------

function createMachineModal(title = "Add Machine") {

    const oldModal =
        document.getElementById("machineModal");

    if (oldModal) {
        oldModal.remove();
    }


    const modal =
        document.createElement("div");

    modal.id = "machineModal";

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
                    id="closeMachineModal"
                    class="text-slate-400 hover:text-white text-xl">

                    <i class="fas fa-xmark"></i>

                </button>

            </div>


            <form id="machineForm" class="space-y-3">

                <input
                    id="machineId"
                    type="text"
                    placeholder="Machine ID (e.g. M004)"
                    required
                    class="w-full bg-slate-800 border border-slate-700
                    rounded-xl px-4 py-3 outline-none
                    focus:border-cyan-400">


                <input
                    id="machineName"
                    type="text"
                    placeholder="Machine Name"
                    required
                    class="w-full bg-slate-800 border border-slate-700
                    rounded-xl px-4 py-3 outline-none
                    focus:border-cyan-400">


                <select
                    id="machineStatus"
                    class="w-full bg-slate-800 border border-slate-700
                    rounded-xl px-4 py-3 outline-none
                    focus:border-cyan-400">

                    <option value="Running">
                        Running
                    </option>

                    <option value="Maintenance">
                        Maintenance
                    </option>

                    <option value="Stopped">
                        Stopped
                    </option>

                </select>


                <input
                    id="machineRPM"
                    type="number"
                    min="0"
                    placeholder="RPM"
                    required
                    class="w-full bg-slate-800 border border-slate-700
                    rounded-xl px-4 py-3 outline-none
                    focus:border-cyan-400">


                <input
                    id="machineTemperature"
                    type="number"
                    min="0"
                    placeholder="Temperature °C"
                    required
                    class="w-full bg-slate-800 border border-slate-700
                    rounded-xl px-4 py-3 outline-none
                    focus:border-cyan-400">


                <input
                    id="machineEfficiency"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Efficiency %"
                    required
                    class="w-full bg-slate-800 border border-slate-700
                    rounded-xl px-4 py-3 outline-none
                    focus:border-cyan-400">


                <input
                    id="machineHealth"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Machine Health %"
                    required
                    class="w-full bg-slate-800 border border-slate-700
                    rounded-xl px-4 py-3 outline-none
                    focus:border-cyan-400">


                <button
                    id="machineSubmitButton"
                    type="submit"
                    class="w-full bg-cyan-500 hover:bg-cyan-600
                    py-3 rounded-xl font-semibold">

                    ${title === "Edit Machine"
                        ? "Save Changes"
                        : "Add Machine"}

                </button>

            </form>

        </div>

    `;


    document.body.appendChild(modal);


    // -----------------------------------------
    // Close
    // -----------------------------------------

    document
        .getElementById("closeMachineModal")
        .addEventListener(
            "click",
            closeMachineModal
        );


    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {

                closeMachineModal();

            }

        }
    );


    // -----------------------------------------
    // Submit
    // -----------------------------------------

    document
        .getElementById("machineForm")
        .addEventListener(
            "submit",
            handleMachineSubmit
        );

}


// -----------------------------------------
// Open Add Modal
// -----------------------------------------

function openAddMachineModal() {

    createMachineModal("Add Machine");

    document
        .getElementById("machineForm")
        .removeAttribute("data-editing-id");

    document
        .getElementById("machineForm")
        .reset();

    document
        .getElementById("machineId")
        .focus();

}


// -----------------------------------------
// Close Modal
// -----------------------------------------

function closeMachineModal() {

    const modal =
        document.getElementById("machineModal");

    if (modal) {

        modal.remove();

    }

}


// -----------------------------------------
// Add Button Click
// -----------------------------------------

if (addMachineButton) {

    addMachineButton.addEventListener(
        "click",
        openAddMachineModal
    );

}


// -----------------------------------------
// Add / Edit Submit
// -----------------------------------------

function handleMachineSubmit(event) {

    event.preventDefault();


    const form = event.target;


    const id =
        document
            .getElementById("machineId")
            .value
            .trim();


    const name =
        document
            .getElementById("machineName")
            .value
            .trim();


    const status =
        document
            .getElementById("machineStatus")
            .value;


    const rpm =
        Number(
            document
                .getElementById("machineRPM")
                .value
        );


    const temperature =
        Number(
            document
                .getElementById("machineTemperature")
                .value
        );


    const efficiency =
        Number(
            document
                .getElementById("machineEfficiency")
                .value
        );


    const health =
        Number(
            document
                .getElementById("machineHealth")
                .value
        );


    if (!id || !name) {

        alert(
            "Please enter Machine ID and Machine Name."
        );

        return;

    }


    // -----------------------------------------
    // EDIT
    // -----------------------------------------

    const editingId =
        form.dataset.editingId;


    if (editingId) {

        const machine =
            machines.find(
                item => item.id === editingId
            );


        if (!machine) {

            alert("Machine not found.");

            return;

        }


        // Check duplicate ID
        const duplicate =
            machines.some(
                item =>
                    item.id.toLowerCase() ===
                    id.toLowerCase() &&
                    item.id !== editingId
            );


        if (duplicate) {

            alert(
                "Another machine already uses this ID."
            );

            return;

        }


        machine.id = id;
        machine.name = name;
        machine.status = status;
        machine.rpm = rpm;
        machine.temperature = temperature;
        machine.efficiency = efficiency;
        machine.health = health;


        saveMachines();

        renderMachines();

        closeMachineModal();


        alert(
            `${machine.name} updated successfully!`
        );


        return;

    }


    // -----------------------------------------
    // ADD NEW MACHINE
    // -----------------------------------------

    const duplicate =
        machines.some(
            machine =>
                machine.id.toLowerCase() ===
                id.toLowerCase()
        );


    if (duplicate) {

        alert(
            "This Machine ID already exists."
        );

        return;

    }


    const newMachine = {

        id: id,

        name: name,

        status: status,

        rpm: rpm,

        temperature: temperature,

        efficiency: efficiency,

        health: health

    };


    machines.push(newMachine);


    saveMachines();

    renderMachines();

    closeMachineModal();


    alert(
        `${name} added successfully!`
    );

}


// -----------------------------------------
// Get Machine By ID
// -----------------------------------------

function getMachineById(id) {

    return machines.find(
        machine => machine.id === id
    );

}


// -----------------------------------------
// VIEW MACHINE
// -----------------------------------------

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(".view-machine");


        if (!button) return;


        const machine =
            getMachineById(
                button.dataset.id
            );


        if (!machine) {

            alert("Machine not found.");

            return;

        }


        alert(`
Machine Details

ID: ${machine.id}

Machine: ${machine.name}

Status: ${machine.status}

RPM: ${machine.rpm}

Temperature: ${machine.temperature}°C

Efficiency: ${machine.efficiency}%

Health: ${machine.health}%
        `);

    }
);


// -----------------------------------------
// EDIT MACHINE
// -----------------------------------------

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(".edit-machine");


        if (!button) return;


        const machine =
            getMachineById(
                button.dataset.id
            );


        if (!machine) {

            alert("Machine not found.");

            return;

        }


        createMachineModal("Edit Machine");


        document
            .getElementById("machineId")
            .value = machine.id;


        document
            .getElementById("machineName")
            .value = machine.name;


        document
            .getElementById("machineStatus")
            .value = machine.status;


        document
            .getElementById("machineRPM")
            .value = machine.rpm;


        document
            .getElementById("machineTemperature")
            .value = machine.temperature;


        document
            .getElementById("machineEfficiency")
            .value = machine.efficiency;


        document
            .getElementById("machineHealth")
            .value = machine.health;


        document
            .getElementById("machineForm")
            .dataset.editingId = machine.id;

    }
);


// -----------------------------------------
// DELETE MACHINE
// -----------------------------------------

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(".delete-machine");


        if (!button) return;


        const machine =
            getMachineById(
                button.dataset.id
            );


        if (!machine) {

            alert("Machine not found.");

            return;

        }


        const confirmed =
            confirm(
                `Delete ${machine.name} (${machine.id})?`
            );


        if (!confirmed) return;


        machines =
            machines.filter(
                item => item.id !== machine.id
            );


        saveMachines();

        renderMachines();


        alert(
            `${machine.name} deleted successfully!`
        );

    }
);


// =========================================
// END PART 2
// =========================================



// =========================================
// FACTORYOS - MACHINES PAGE
// PART 3
// Health + Maintenance + Recent Activity
// =========================================


// -----------------------------------------
// Activity Data
// -----------------------------------------

let machineActivities =
    JSON.parse(
        localStorage.getItem("factoryMachineActivities")
    ) || [

        {
            message: "Extruder Machine Started",
            detail: "Production Line A",
            time: "09:18 AM",
            type: "normal"
        },

        {
            message: "Printing Machine Maintenance Completed",
            detail: "Machine Ready",
            time: "10:05 AM",
            type: "normal"
        },

        {
            message: "Cutting Machine Stopped",
            detail: "Operator Requested",
            time: "11:42 AM",
            type: "danger"
        }

    ];


// -----------------------------------------
// Save Activities
// -----------------------------------------

function saveActivities() {

    localStorage.setItem(
        "factoryMachineActivities",
        JSON.stringify(machineActivities)
    );

}


// -----------------------------------------
// Get Machine Health Section
// -----------------------------------------
function updateMachineHealth() {

    const healthHeading = [...document.querySelectorAll("h2")]
        .find(heading =>
            heading.textContent.trim() === "Machine Health"
        );

    if (!healthHeading) {
        console.log("Machine Health heading not found");
        return;
    }

    const healthBox = healthHeading.closest(
        ".bg-slate-900"
    );

    if (!healthBox) {
        console.log("Machine Health box not found");
        return;
    }

    const healthContainer =
        healthBox.querySelector(".space-y-6");

    if (!healthContainer) {
        console.log("Machine Health container not found");
        return;
    }

    healthContainer.innerHTML = "";

    machines.forEach(machine => {

        let barClass = "bg-green-500";
        let textClass = "text-green-400";

        if (machine.health < 70) {

            barClass = "bg-red-500";
            textClass = "text-red-400";

        } else if (machine.health < 90) {

            barClass = "bg-yellow-400";
            textClass = "text-yellow-400";

        }

        const item = document.createElement("div");

        item.innerHTML = `

            <div class="flex justify-between mb-2">

                <span>
                    ${machine.name}
                </span>

                <span class="${textClass}">
                    ${machine.health}%
                </span>

            </div>

            <div class="w-full bg-slate-800 rounded-full h-3">

                <div
                    class="${barClass} h-3 rounded-full transition-all duration-500"
                    style="width: ${machine.health}%">
                </div>

            </div>

        `;

        healthContainer.appendChild(item);

    });

}


// -----------------------------------------
// Today's Maintenance
// -----------------------------------------

function updateMaintenance() {

    const heading =
        [...document.querySelectorAll("h2")]
            .find(
                element =>
                    element.textContent.trim() ===
                    "Today's Maintenance"
            );


    if (!heading) return;


    const container =
        heading.parentElement
            .querySelector(".space-y-4");


    if (!container) return;


    container.innerHTML = "";


    const maintenanceMachines =
        machines.filter(
            machine =>
                machine.status === "Maintenance"
        );


    if (maintenanceMachines.length === 0) {

        container.innerHTML = `

            <div class="bg-slate-800 rounded-xl p-4">

                <p class="font-semibold text-green-400">
                    ✓ No Maintenance Required
                </p>

                <p class="text-slate-400 text-sm mt-1">
                    All machines are running normally.
                </p>

            </div>

        `;

        return;

    }


    maintenanceMachines.forEach(
        (machine, index) => {

            const times = [
                "09:00 AM",
                "11:30 AM",
                "03:00 PM",
                "04:30 PM"
            ];


            const item =
                document.createElement("div");


            item.className =
                "bg-slate-800 rounded-xl p-4";


            item.innerHTML = `

                <p class="font-semibold">
                    🛠 Machine Maintenance
                </p>

                <p class="text-slate-400 text-sm">
                    ${machine.name}
                </p>

                <p class="text-cyan-400 mt-2">
                    ${times[index % times.length]}
                </p>

            `;


            container.appendChild(item);

        }
    );

}


// -----------------------------------------
// Recent Activity
// -----------------------------------------

function updateRecentActivity() {

    const heading =
        [...document.querySelectorAll("h2")]
            .find(
                element =>
                    element.textContent.trim() ===
                    "Recent Machine Activity"
            );


    if (!heading) return;


    const container =
        heading.parentElement
            .parentElement
            .querySelector(".space-y-4");


    if (!container) return;


    container.innerHTML = "";


    machineActivities
        .slice(0, 8)
        .forEach(activity => {

            const item =
                document.createElement("div");


            item.className =
                "flex items-center justify-between bg-slate-800 rounded-xl p-4";


            const timeClass =
                activity.type === "danger"
                    ? "text-red-400"
                    : "text-cyan-400";


            item.innerHTML = `

                <div>

                    <h3 class="font-semibold">
                        ${activity.message}
                    </h3>

                    <p class="text-slate-400 text-sm">
                        ${activity.detail}
                    </p>

                </div>

                <span class="${timeClass}">
                    ${activity.time}
                </span>

            `;


            container.appendChild(item);

        });

}


// -----------------------------------------
// Add Activity
// -----------------------------------------

function addMachineActivity(
    message,
    detail,
    type = "normal"
) {

    const now =
        new Date();


    const time =
        now.toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    machineActivities.unshift({

        message,

        detail,

        time,

        type

    });


    machineActivities =
        machineActivities.slice(0, 8);


    saveActivities();

    updateRecentActivity();

}


// -----------------------------------------
// Update All Bottom Sections
// -----------------------------------------

function updateBottomSections() {

    updateMachineHealth();


console.log("MACHINES:", machines);
console.log("HEALTH FUNCTION RUNNING");

    updateMaintenance();

    updateRecentActivity();

}


// -----------------------------------------
// Initial Bottom Section Load
// -----------------------------------------

console.log("PART 3 LOADED");

updateBottomSections();

console.log("MACHINES:", machines);
console.log("HEALTH FUNCTION RUNNING");


});

// =========================================
// END PART 3
// =========================================

