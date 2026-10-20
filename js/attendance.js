
document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "http://localhost:5000/api";

    const employeeSelect = document.getElementById("employeeSelect");
    const dateInput = document.getElementById("attendanceDate");
    const shiftInput = document.getElementById("attendanceShift");
    const statusInput = document.getElementById("attendanceStatus");
    const form = document.getElementById("attendanceForm");
    const saveButton = document.getElementById("saveAttendanceBtn");
    const refreshButton = document.getElementById("refreshAttendanceBtn");
    const message = document.getElementById("attendanceMessage");
    const historyBody = document.getElementById("attendanceHistoryBody");
    const historyEmployee = document.getElementById("historyEmployee");
    const historySearch = document.getElementById("historySearch");

    let employees = [];
    let historyRecords = [];

    function getToken() {
        return localStorage.getItem("token") ||
               localStorage.getItem("accessToken");
    }

    async function apiRequest(endpoint, options = {}) {
        const token = getToken();

        if (!token) {
            throw new Error("Login session nahi mili. Pehle FactoryOS mein login karo.");
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
            throw new Error(data.message || `Request failed (${response.status})`);
        }

        return data;
    }

    function showMessage(text, isError = false) {
        message.textContent = text;
        message.className = isError
            ? "text-sm text-red-400"
            : "text-sm text-emerald-400";
    }

    function todayString() {
        const now = new Date();
        const localDate = new Date(
            now.getTime() - now.getTimezoneOffset() * 60000
        );
        return localDate.toISOString().slice(0, 10);
    }

    function displayDate(value) {
        if (!value) return "—";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "UTC"
        });
    }

    function displayDateTime(value) {
        if (!value) return "—";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleString("en-IN");
    }

    function addCell(row, value, className = "p-4") {
        const cell = document.createElement("td");
        cell.className = className;
        cell.textContent = value ?? "—";
        row.appendChild(cell);
        return cell;
    }

    function showEmptyHistory(text) {
        historyBody.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.className = "p-6 text-center text-slate-400";
        cell.textContent = text;

        row.appendChild(cell);
        historyBody.appendChild(row);
    }

    async function loadEmployees() {
        employeeSelect.innerHTML = '<option value="">Loading employees...</option>';

        const data = await apiRequest("/employees");
        employees = Array.isArray(data.employees) ? data.employees : [];

        employeeSelect.replaceChildren();

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Select employee";
        employeeSelect.appendChild(placeholder);

        employees.forEach(employee => {
            const option = document.createElement("option");
            option.value = employee.employeeId;
            option.textContent =
                `${employee.name || "Unnamed"} (${employee.employeeId})` +
                (employee.status === "inactive" ? " — Inactive" : "");
            employeeSelect.appendChild(option);
        });

        if (employees.length === 0) {
            showMessage("No employees found. Pehle Employees page par employee add karo.", true);
        }
    }

    function renderHistory() {
        historyBody.replaceChildren();

        const filterDate = historySearch.value;
        const filteredRecords = historyRecords.filter(record => {
            if (!filterDate) return true;

            const recordDate = record.date
                ? new Date(record.date).toISOString().slice(0, 10)
                : "";

            return recordDate === filterDate;
        });

        const present = filteredRecords.filter(item => item.status === "present").length;
        const absent = filteredRecords.filter(item => item.status === "absent").length;
        const leave = filteredRecords.filter(item => item.status === "on_leave").length;

       

        if (filteredRecords.length === 0) {
            showEmptyHistory(
                filterDate
                    ? "No attendance record found for this date."
                    : "No attendance records saved for this employee yet."
            );
            return;
        }

        filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

        filteredRecords.forEach(record => {
            const row = document.createElement("tr");
            row.className = "border-b border-slate-800 hover:bg-slate-800/50";

            addCell(row, displayDate(record.date));
            addCell(row, (record.shift || "—").replace("_", " "));

            const statusCell = document.createElement("td");
            statusCell.className = "p-4";

            const badge = document.createElement("span");
            badge.className = "inline-block rounded-full px-3 py-1 text-xs font-semibold";

            if (record.status === "present") {
                badge.classList.add("bg-emerald-500/20", "text-emerald-400");
                badge.textContent = "Present";
            } else if (record.status === "absent") {
                badge.classList.add("bg-red-500/20", "text-red-400");
                badge.textContent = "Absent";
            } else {
                badge.classList.add("bg-amber-500/20", "text-amber-400");
                badge.textContent = "On Leave";
            }

            statusCell.appendChild(badge);
            row.appendChild(statusCell);
            addCell(row, displayDateTime(record.updatedAt || record.createdAt));

            historyBody.appendChild(row);
        });
    }

   
async function loadAttendanceAnalytics() {
    const data = await apiRequest("/employees/attendance/analytics");
    const summary = data.summary || {};

    document.getElementById("presentCount").textContent =
        summary.present ?? 0;

    document.getElementById("absentCount").textContent =
        summary.absent ?? 0;

    document.getElementById("leaveCount").textContent =
        summary.onLeave ?? 0;
}


    async function loadHistory() {
        const employeeId = employeeSelect.value;

        if (!employeeId) {
            historyRecords = [];
            historyEmployee.textContent = "Select an employee to view saved records.";
            renderHistory();
            return;
        }

        historyEmployee.textContent = "Loading attendance history...";

        try {
            const data = await apiRequest(
                `/employees/${encodeURIComponent(employeeId)}/attendance`
            );

            historyRecords = Array.isArray(data.attendance) ? data.attendance : [];

            const employee = employees.find(item => item.employeeId === employeeId);
            historyEmployee.textContent =
                `${employee?.name || data.employee?.name || "Employee"} (${employeeId})`;

            renderHistory();
        } catch (error) {
            historyRecords = [];
            renderHistory();
            historyEmployee.textContent = "Could not load attendance history.";
            showMessage(error.message, true);
        }
    }

    async function saveAttendance(event) {
        event.preventDefault();

        const employeeId = employeeSelect.value;
        const date = dateInput.value;
        const shift = shiftInput.value;
        const status = statusInput.value;

        if (!employeeId || !date || !shift || !status) {
            showMessage("Please fill all required fields.", true);
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {
            const data = await apiRequest("/employees/attendance", {
                method: "POST",
                body: JSON.stringify({
                    employeeId,
                    date,
                    shift,
                    status
                })
            });

            showMessage(data.message || "Attendance saved successfully.");

            historySearch.value = "";
            await loadHistory();
            await loadAttendanceAnalytics();
        } catch (error) {
            showMessage(error.message, true);
        } finally {
            saveButton.disabled = false;
            saveButton.innerHTML = '<i class="fas fa-save mr-2"></i> Save Attendance';
        }
    }

    dateInput.value = todayString();

    form.addEventListener("submit", saveAttendance);

    employeeSelect.addEventListener("change", () => {
        historySearch.value = "";
        loadHistory();
    });

    historySearch.addEventListener("change", renderHistory);

    refreshButton.addEventListener("click", async () => {
        try {
            showMessage("Refreshing...");
            await loadEmployees();
            await loadAttendanceAnalytics();
            await loadHistory();
            showMessage("Attendance data refreshed.");
        } catch (error) {
            showMessage(error.message, true);
        }
    });

    (async function init() {
        try {
            await loadEmployees();
            await loadAttendanceAnalytics();
            await loadHistory();
        } catch (error) {
            showMessage(error.message, true);
            employeeSelect.innerHTML = '<option value="">Could not load employees</option>';
            showEmptyHistory("Attendance could not be loaded.");
        }
    })();
});
