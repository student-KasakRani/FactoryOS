
document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "http://localhost:5000/api";

    const tableBody = document.getElementById("employeesTableBody");
    const searchInput = document.getElementById("employeeSearch");
    const addEmployeeBtn = document.getElementById("addEmployeeBtn");

    const totalEmployeesEl = document.getElementById("totalEmployees");
    const presentEmployeesEl = document.getElementById("presentEmployees");
    const leaveEmployeesEl = document.getElementById("leaveEmployees");
    const absentEmployeesEl = document.getElementById("absentEmployees");

    const chartCanvas = document.getElementById("attendanceChart");

    let employees = [];
    let attendanceChart = null;

    // -----------------------------
    // AUTHENTICATION
    // -----------------------------
    function getToken() {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken")
        );
    }

    async function apiRequest(endpoint, options = {}) {
        const token = getToken();

        if (!token) {
            throw new Error(
                "Login session nahi mili. Pehle FactoryOS mein login karo."
            );
        }

        const headers = {
            Authorization: `Bearer ${token}`,
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        };

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    data.message || "Session expire hai ya permission nahi hai."
                );
            }

            throw new Error(data.message || "API request failed.");
        }

        return data;
    }

    // -----------------------------
    // HELPERS
    // -----------------------------
    function showMessage(message) {
        alert(message);
    }

    function formatDate(dateValue) {
        if (!dateValue) return "—";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function titleCase(value) {
        if (!value) return "—";

        return value
            .replaceAll("_", " ")
            .replace(/\b\w/g, letter => letter.toUpperCase());
    }

    function createCell(text, className = "px-6 py-4") {
        const cell = document.createElement("td");
        cell.className = className;
        cell.textContent = text ?? "—";
        return cell;
    }

    function getStatusClass(status) {
        if (status === "active") {
            return "bg-green-500/20 text-green-400";
        }

        if (status === "on_leave") {
            return "bg-yellow-500/20 text-yellow-400";
        }

        return "bg-red-500/20 text-red-400";
    }

    // -----------------------------
    // LOAD EMPLOYEES
    // -----------------------------
    async function loadEmployees() {
        try {
            const data = await apiRequest("/employees");

            employees = Array.isArray(data.employees)
                ? data.employees
                : [];

            renderEmployees();
            updateTotalEmployees();
        } catch (error) {
            console.error("Load employees error:", error);

            if (tableBody) {
                tableBody.replaceChildren();

                const row = document.createElement("tr");
                const cell = document.createElement("td");

                cell.colSpan = 4;
                cell.className =
                    "px-6 py-8 text-center text-red-400";
                cell.textContent = error.message;

                row.appendChild(cell);
                tableBody.appendChild(row);
            }
        }
    }

    // -----------------------------
    // RENDER EMPLOYEE TABLE
    // -----------------------------
    function renderEmployees() {
        if (!tableBody) return;

        const query = searchInput?.value.trim().toLowerCase() || "";

        const filteredEmployees = employees.filter(employee => {
            const searchableText = [
                employee.name,
                employee.employeeId,
                employee.email,
                employee.department,
                employee.designation,
                employee.currentShift,
                employee.status
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(query);
        });

        tableBody.replaceChildren();

        if (filteredEmployees.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 4;
            cell.className =
                "px-6 py-8 text-center text-slate-400";
            cell.textContent = query
                ? "No matching employees found."
                : "No employees found. Click Add Employee to create one.";

            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }

        filteredEmployees.forEach(employee => {
            const row = document.createElement("tr");
            row.className = "border-t border-slate-800 hover:bg-slate-800/50";

            // Employee name and ID
            const employeeCell = document.createElement("td");
            employeeCell.className = "px-6 py-4";

            const name = document.createElement("p");
            name.className = "font-medium";
            name.textContent = employee.name || "Unnamed Employee";

            const id = document.createElement("p");
            id.className = "text-xs text-slate-400 mt-1";
            id.textContent = employee.employeeId || "No employee ID";

            employeeCell.append(name, id);

            // Department
            const departmentCell = createCell(employee.department || "Other");

            // Shift
            const shiftCell = createCell(
                titleCase(employee.currentShift),
                "px-6 py-4 text-center"
            );

            // Employee account status, not today's attendance
            const statusCell = document.createElement("td");
            statusCell.className = "px-6 py-4 text-center";

            const statusBadge = document.createElement("span");
            statusBadge.className =
                `${getStatusClass(employee.status)} px-3 py-1 rounded-full text-xs`;

            statusBadge.textContent = titleCase(employee.status);

            statusCell.appendChild(statusBadge);

            row.append(
                employeeCell,
                departmentCell,
                shiftCell,
                statusCell
            );

            tableBody.appendChild(row);
        });
    }

    function updateTotalEmployees() {
        if (totalEmployeesEl) {
            totalEmployeesEl.textContent = employees.length;
        }
    }

    // -----------------------------
    // ATTENDANCE ANALYTICS
    // -----------------------------
    async function loadAttendanceAnalytics() {
        try {
            const data = await apiRequest(
                "/employees/attendance/analytics"
            );

            const summary = data.summary || {};

            if (presentEmployeesEl) {
                presentEmployeesEl.textContent = summary.present ?? 0;
            }

            if (leaveEmployeesEl) {
                leaveEmployeesEl.textContent = summary.onLeave ?? 0;
            }

            if (absentEmployeesEl) {
                absentEmployeesEl.textContent = summary.absent ?? 0;
            }

            renderAttendanceChart(summary);
        } catch (error) {
            console.error("Attendance analytics error:", error);

            if (presentEmployeesEl) presentEmployeesEl.textContent = "—";
            if (leaveEmployeesEl) leaveEmployeesEl.textContent = "—";
            if (absentEmployeesEl) absentEmployeesEl.textContent = "—";
        }
    }

    // -----------------------------
    // ATTENDANCE CHART
    // -----------------------------
    function renderAttendanceChart(summary) {
        if (!chartCanvas || typeof Chart === "undefined") return;

        if (attendanceChart) {
            attendanceChart.destroy();
        }

        attendanceChart = new Chart(chartCanvas, {
            type: "bar",
            data: {
                labels: ["Present", "Absent", "On Leave"],
                datasets: [{
                    label: "Attendance records (last 7 days)",
                    data: [
                        summary.present || 0,
                        summary.absent || 0,
                        summary.onLeave || 0
                    ],
                    backgroundColor: [
                        "rgba(74, 222, 128, 0.75)",
                        "rgba(248, 113, 113, 0.75)",
                        "rgba(250, 204, 21, 0.75)"
                    ],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: "#cbd5e1"
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: "#cbd5e1" },
                        grid: { color: "rgba(148, 163, 184, 0.1)" }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: "#cbd5e1",
                            precision: 0
                        },
                        grid: { color: "rgba(148, 163, 184, 0.1)" }
                    }
                }
            }
        });
    }

    // -----------------------------
    // ADD EMPLOYEE MODAL
    // -----------------------------
    function openAddEmployeeModal() {
        if (document.getElementById("employeeModal")) return;

        const modal = document.createElement("div");
        modal.id = "employeeModal";
        modal.className =
            "fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4";

        modal.innerHTML = `
            <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold">Add Employee</h2>
                    <button type="button" id="closeEmployeeModal"
                        class="text-slate-400 hover:text-white text-2xl"
                        aria-label="Close">&times;</button>
                </div>

                <form id="employeeForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm text-slate-300 mb-2">Full Name *</label>
                        <input name="name" required maxlength="100"
                            class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
                            placeholder="Employee name">
                    </div>

                    <div>
                        <label class="block text-sm text-slate-300 mb-2">Employee ID *</label>
                        <input name="employeeId" required maxlength="50"
                            class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
                            placeholder="EMP002">
                    </div>

                    <div>
                        <label class="block text-sm text-slate-300 mb-2">Email *</label>
                        <input name="email" type="email" required
                            class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
                            placeholder="employee@example.com">
                    </div>

                    <div>
                        <label class="block text-sm text-slate-300 mb-2">Temporary Password *</label>
                        <input name="password" type="password" required minlength="6" autocomplete="new-password"
                            class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
                            placeholder="Create password">
                    </div>

                    <div>
                        <label class="block text-sm text-slate-300 mb-2">Department</label>
                        <select name="department"
                            class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none">
                            <option value="Production">Production</option>
                            <option value="Inventory">Inventory</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Accounts">Accounts</option>
                            <option value="Management">Management</option>
                            <option value="Quality">Quality</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm text-slate-300 mb-2">Designation</label>
                        <input name="designation" maxlength="100"
                            class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none"
                            placeholder="Production Operator">
                    </div>

                    <div>
                        <label class="block text-sm text-slate-300 mb-2">Phone</label>
                        <input name="phone" type="tel" maxlength="20"
                            class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none"
                            placeholder="Phone number">
                    </div>

                    <div>
                        <label class="block text-sm text-slate-300 mb-2">Shift</label>
                        <select name="currentShift"
                            class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none">
                            <option value="morning">Morning</option>
                            <option value="evening">Evening</option>
                            <option value="night">Night</option>
                        </select>
                    </div>

                    <div class="md:col-span-2 flex justify-end gap-3 pt-4">
                        <button type="button" id="cancelEmployeeModal"
                            class="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600">
                            Cancel
                        </button>

                        <button type="submit" id="saveEmployeeBtn"
                            class="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 font-semibold">
                            Save Employee
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();

        modal.querySelector("#closeEmployeeModal")
            .addEventListener("click", closeModal);

        modal.querySelector("#cancelEmployeeModal")
            .addEventListener("click", closeModal);

        modal.addEventListener("click", event => {
            if (event.target === modal) closeModal();
        });

        modal.querySelector("#employeeForm")
            .addEventListener("submit", async event => {
                event.preventDefault();

                const form = event.currentTarget;
                const saveButton = modal.querySelector("#saveEmployeeBtn");
                const formData = new FormData(form);

                const employeeData = Object.fromEntries(formData.entries());

                // Remove accidental leading/trailing spaces from text fields.
                Object.keys(employeeData).forEach(key => {
                    if (typeof employeeData[key] === "string") {
                        employeeData[key] = employeeData[key].trim();
                    }
                });

                saveButton.disabled = true;
                saveButton.textContent = "Saving...";

                try {
                    await apiRequest("/employees", {
                        method: "POST",
                        body: JSON.stringify(employeeData)
                    });

                    closeModal();
                    showMessage("Employee created successfully.");

                    await Promise.all([
                        loadEmployees(),
                        loadAttendanceAnalytics()
                    ]);
                } catch (error) {
                    console.error("Create employee error:", error);
                    showMessage(error.message);
                    saveButton.disabled = false;
                    saveButton.textContent = "Save Employee";
                }
            });
    }

    // -----------------------------
    // EVENTS
    // -----------------------------
    if (searchInput) {
        searchInput.addEventListener("input", renderEmployees);
    }

    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener("click", openAddEmployeeModal);
    }

    // -----------------------------
    // INITIAL LOAD
    // -----------------------------
    loadEmployees();
    loadAttendanceAnalytics();

    console.log("FactoryOS Employee module loaded.");
});
