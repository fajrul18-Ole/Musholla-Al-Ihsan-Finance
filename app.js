// ==========================================
// FASTAPI CONFIGURATION
// ==========================================

const API_BASE_URL = "http://localhost:8000";


// ==========================================
// API HELPER
// ==========================================

async function apiRequest(url, options = {}) {

    const response = await fetch(
        `${API_BASE_URL}${url}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {

        const message =
            data?.detail ||
            data?.message ||
            `Request gagal (${response.status})`;

        throw new Error(message);
    }

    return data;
}


// ==========================================
// GET ALL TRANSACTIONS
// ==========================================

async function getTransactions() {

    return await apiRequest(
        "/api/transactions"
    );

}


// ==========================================
// ADD TRANSACTION
// ==========================================

async function addTransaction(data) {

    return await apiRequest(
        "/api/transactions",
        {
            method: "POST",
            body: JSON.stringify(data)
        }
    );

}


// ==========================================
// UPDATE TRANSACTION
// ==========================================

async function updateTransaction(id, data) {

    return await apiRequest(
        `/api/transactions/${Number(id)}`,
        {
            method: "PUT",
            body: JSON.stringify(data)
        }
    );

}


// ==========================================
// DELETE TRANSACTION
// ==========================================

async function removeTransaction(id) {

    return await apiRequest(
        `/api/transactions/${Number(id)}`,
        {
            method: "DELETE"
        }
    );

}


// ==========================================
// GET SUMMARY
// ==========================================
// Fungsi ini disediakan jika nanti ingin
// menggunakan endpoint /api/summary dari FastAPI.
//
// Saat ini perhitungan summary dilakukan
// dari data transaksi di frontend.

async function getSummary() {

    return await apiRequest(
        "/api/summary"
    );

}


// ==========================================
// GLOBAL VARIABLES
// ==========================================

let allTransactions = [];
let filteredTransactions = [];

let financeChart = null;

let selectedYear =
    new Date().getFullYear();

let selectedMonth =
    new Date().getMonth() + 1;

let pickerYear =
    selectedYear;


// ==========================================
// MONTH NAMES
// ==========================================

const monthNames = [

    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"

];


// ==========================================
// FORMAT RUPIAH
// ==========================================

function formatRupiah(amount) {

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }
    ).format(
        Number(amount) || 0
    );

}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const value =
        String(dateString).substring(0, 10);

    const parts =
        value.split("-");

    if (parts.length !== 3) {
        return "-";
    }

    const year =
        Number(parts[0]);

    const month =
        Number(parts[1]);

    const day =
        Number(parts[2]);

    if (
        !year ||
        !month ||
        !day
    ) {
        return "-";
    }

    const date =
        new Date(
            year,
            month - 1,
            day
        );

    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// ==========================================
// TOAST
// ==========================================

function showToast(message) {

    const toast =
        document.getElementById("toast");

    if (!toast) {

        alert(message);

        return;
    }

    toast.textContent =
        message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


// ==========================================
// GET SELECTED MONTH VALUE
// ==========================================

function getSelectedMonthValue() {

    return (
        `${selectedYear}-${String(
            selectedMonth
        ).padStart(2, "0")}`
    );

}


// ==========================================
// UPDATE MONTH DISPLAY
// ==========================================

function updateMonthDisplay() {

    const element =
        document.getElementById(
            "selectedMonth"
        );

    if (!element) {
        return;
    }

    element.textContent =
        `${monthNames[selectedMonth - 1]} ${selectedYear}`;

}


// ==========================================
// CHANGE MONTH
// ==========================================

function changeMonth(direction) {

    selectedMonth += direction;

    if (selectedMonth > 12) {

        selectedMonth = 1;

        selectedYear++;

    }

    if (selectedMonth < 1) {

        selectedMonth = 12;

        selectedYear--;

    }

    pickerYear =
        selectedYear;

    updateMonthDisplay();

    renderMonthGrid();

    applyFilters();

}


// ==========================================
// TOGGLE MONTH PICKER
// ==========================================

function toggleMonthPicker() {

    const picker =
        document.getElementById(
            "monthPicker"
        );

    if (!picker) {
        return;
    }

    picker.classList.toggle("show");

    if (
        picker.classList.contains("show")
    ) {

        pickerYear =
            selectedYear;

        renderMonthGrid();

    }

}


// ==========================================
// CHANGE PICKER YEAR
// ==========================================

function changePickerYear(direction) {

    pickerYear += direction;

    renderMonthGrid();

}


// ==========================================
// RENDER MONTH GRID
// ==========================================

function renderMonthGrid() {

    const grid =
        document.getElementById(
            "monthGrid"
        );

    const yearElement =
        document.getElementById(
            "pickerYear"
        );

    if (
        !grid ||
        !yearElement
    ) {
        return;
    }

    yearElement.textContent =
        pickerYear;

    grid.innerHTML = "";

    monthNames.forEach(
        (month, index) => {

            const monthNumber =
                index + 1;

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "month-option";

            button.textContent =
                month;

            if (
                pickerYear === selectedYear &&
                monthNumber === selectedMonth
            ) {

                button.classList.add(
                    "active"
                );

            }

            button.addEventListener(
                "click",
                () => {

                    selectedYear =
                        pickerYear;

                    selectedMonth =
                        monthNumber;

                    updateMonthDisplay();

                    applyFilters();

                    const picker =
                        document.getElementById(
                            "monthPicker"
                        );

                    if (picker) {

                        picker.classList.remove(
                            "show"
                        );

                    }

                }
            );

            grid.appendChild(
                button
            );

        }
    );

}


// ==========================================
// RESET FILTER
// ==========================================

function resetFilter() {

    selectedYear =
        new Date().getFullYear();

    selectedMonth =
        new Date().getMonth() + 1;

    pickerYear =
        selectedYear;

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    if (searchInput) {

        searchInput.value =
            "";

    }

    updateMonthDisplay();

    renderMonthGrid();

    applyFilters();

}


// ==========================================
// LOAD TRANSACTIONS
// ==========================================

async function loadTransactions() {

    const table =
        document.getElementById(
            "transactionTable"
        );

    try {

        allTransactions =
            await getTransactions();

        // Terapkan filter bulan yang sedang dipilih
        applyFilters();

    } catch (error) {

        console.error(error);

        if (table) {

            table.innerHTML = `
                <tr>
                    <td colspan="6" class="empty">
                        Gagal mengambil data transaksi
                    </td>
                </tr>
            `;

        }

        showToast(
            "Gagal mengambil data transaksi"
        );

    }

}


// ==========================================
// FILTER TRANSACTIONS
// ==========================================

function applyFilters() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";

    const selectedMonthValue =
        getSelectedMonthValue();

    filteredTransactions =
        allTransactions.filter(
            transaction => {

                const transactionDate =
                    String(
                        transaction.transaction_date ||
                        ""
                    ).substring(0, 10);

                const transactionMonth =
                    transactionDate.substring(
                        0,
                        7
                    );

                const searchText = [

                    transaction.type || "",

                    transaction.category || "",

                    transaction.note || "",

                    transactionDate

                ]
                    .join(" ")
                    .toLowerCase();

                const matchesSearch =
                    search === "" ||
                    searchText.includes(
                        search
                    );

                const matchesMonth =
                    transactionMonth ===
                    selectedMonthValue;

                return (
                    matchesSearch &&
                    matchesMonth
                );

            }
        );

    renderTransactions();

    updateSummary();

    updateChart();

    updateReportPeriod();

    updateReportPage();

}


// ==========================================
// SEARCH
// ==========================================

function filterTransactions() {

    applyFilters();

}


// ==========================================
// RENDER TRANSACTIONS
// ==========================================

function renderTransactions() {

    const table =
        document.getElementById(
            "transactionTable"
        );

    if (!table) {
        return;
    }

    table.innerHTML = "";

    if (
        filteredTransactions.length === 0
    ) {

        table.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    Tidak ada transaksi pada periode ini
                </td>
            </tr>
        `;

        return;
    }

    filteredTransactions.forEach(
        transaction => {

            const row =
                document.createElement(
                    "tr"
                );

            const isIncome =
                transaction.type ===
                "pemasukan";

            row.innerHTML = `

                <td>
                    ${formatDate(
                        transaction.transaction_date
                    )}
                </td>

                <td>
                    ${
                        isIncome
                            ? "Pemasukan"
                            : "Pengeluaran"
                    }
                </td>

                <td>
                    ${
                        transaction.category ||
                        "-"
                    }
                </td>

                <td class="${
                    isIncome
                        ? "income-text"
                        : "expense-text"
                }">

                    ${
                        isIncome
                            ? "+"
                            : "-"
                    }

                    ${formatRupiah(
                        transaction.amount
                    )}

                </td>

                <td>
                    ${
                        transaction.note ||
                        "-"
                    }
                </td>

                <td>

                    <button
                        type="button"
                        class="edit-btn"
                        onclick="openEditModal(${Number(transaction.id)})"
                        title="Edit"
                    >
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        onclick="deleteTransaction(${Number(transaction.id)})"
                        title="Hapus"
                    >
                        🗑
                    </button>

                </td>

            `;

            table.appendChild(
                row
            );

        }
    );

}


// ==========================================
// CALCULATE ACCUMULATED BALANCE
// ==========================================

function calculateAccumulatedBalance() {

    let accumulatedIncome = 0;

    let accumulatedExpense = 0;

    const selectedPeriod =
        getSelectedMonthValue();

    allTransactions.forEach(
        transaction => {

            const transactionPeriod =
                String(
                    transaction.transaction_date ||
                    ""
                ).substring(0, 7);

            if (
                transactionPeriod <=
                selectedPeriod
            ) {

                const amount =
                    Number(
                        transaction.amount
                    ) || 0;

                if (
                    transaction.type ===
                    "pemasukan"
                ) {

                    accumulatedIncome +=
                        amount;

                }

                if (
                    transaction.type ===
                    "pengeluaran"
                ) {

                    accumulatedExpense +=
                        amount;

                }

            }

        }
    );

    return (
        accumulatedIncome -
        accumulatedExpense
    );

}


// ==========================================
// UPDATE SUMMARY
// ==========================================

function updateSummary() {

    const selectedPeriod =
        `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

    // ==========================================
    // TOTAL BULAN TERPILIH
    // ==========================================

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    // ==========================================
    // TOTAL AKUMULATIF SAMPAI BULAN TERPILIH
    // ==========================================

    let accumulatedIncome = 0;
    let accumulatedExpense = 0;

    // ==========================================
    // HITUNG SEMUA TRANSAKSI
    // ==========================================

    allTransactions.forEach(transaction => {

        const amount =
            Number(transaction.amount) || 0;

        const transactionPeriod =
            String(
                transaction.transaction_date || ""
            ).substring(0, 7);

        if (!transactionPeriod) {
            return;
        }

        // ==========================================
        // PEMASUKAN
        // ==========================================

        if (transaction.type === "pemasukan") {

            // Pemasukan bulan terpilih
            if (transactionPeriod === selectedPeriod) {
                monthlyIncome += amount;
            }

            // Pemasukan kumulatif
            if (transactionPeriod <= selectedPeriod) {
                accumulatedIncome += amount;
            }
        }

        // ==========================================
        // PENGELUARAN
        // ==========================================

        if (transaction.type === "pengeluaran") {

            // Pengeluaran bulan terpilih
            if (transactionPeriod === selectedPeriod) {
                monthlyExpense += amount;
            }

            // Pengeluaran kumulatif
            if (transactionPeriod <= selectedPeriod) {
                accumulatedExpense += amount;
            }
        }

    });

    // ==========================================
    // SALDO BERJALAN
    // ==========================================

    const balance =
        accumulatedIncome -
        accumulatedExpense;

    // ==========================================
    // DASHBOARD
    // ==========================================

    const saldoElement =
        document.getElementById("saldo");

    if (saldoElement) {
        saldoElement.textContent =
            formatRupiah(balance);
    }

    const incomeElement =
        document.getElementById("totalPemasukan");

    if (incomeElement) {
        incomeElement.textContent =
            formatRupiah(monthlyIncome);
    }

    const expenseElement =
        document.getElementById("totalPengeluaran");

    if (expenseElement) {
        expenseElement.textContent =
            formatRupiah(monthlyExpense);
    }

    const countElement =
        document.getElementById("jumlahTransaksi");

    if (countElement) {
        countElement.textContent =
            filteredTransactions.length;
    }

    // ==========================================
    // REPORT
    // ==========================================

    const reportIncome =
        document.getElementById("reportIncome");

    if (reportIncome) {
        reportIncome.textContent =
            formatRupiah(monthlyIncome);
    }

    const reportExpense =
        document.getElementById("reportExpense");

    if (reportExpense) {
        reportExpense.textContent =
            formatRupiah(monthlyExpense);
    }

    const reportBalance =
        document.getElementById("reportBalance");

    if (reportBalance) {
        reportBalance.textContent =
            formatRupiah(balance);
    }

    const reportCount =
        document.getElementById("reportCount");

    if (reportCount) {
        reportCount.textContent =
            filteredTransactions.length;
    }

}


// ==========================================
// REPORT PERIOD
// ==========================================

function updateReportPeriod() {

    const element =
        document.getElementById(
            "reportPeriod"
        );

    if (!element) {
        return;
    }

    element.textContent =
        `${monthNames[selectedMonth - 1]} ${selectedYear}`;

}


// ==========================================
// UPDATE REPORT PAGE
// ==========================================

function updateReportPage() {

    const period =
        `${monthNames[selectedMonth - 1]} ${selectedYear}`;


    // ==========================================
    // PERIOD
    // ==========================================

    const periodElement =
        document.getElementById(
            "reportSelectedPeriod"
        );

    if (periodElement) {

        periodElement.textContent =
            period;

    }


    const reportPagePeriod =
        document.getElementById(
            "reportPagePeriod"
        );

    if (reportPagePeriod) {

        reportPagePeriod.textContent =
            period;

    }


    const printReportPeriod =
        document.getElementById(
            "printReportPeriod"
        );

    if (printReportPeriod) {

        printReportPeriod.textContent =
            period;

    }


    // ==========================================
    // CALCULATE MONTHLY TOTAL
    // ==========================================

    let totalIncome = 0;

    let totalExpense = 0;

    filteredTransactions.forEach(
        transaction => {

            const amount =
                Number(
                    transaction.amount
                ) || 0;

            if (
                transaction.type ===
                "pemasukan"
            ) {

                totalIncome +=
                    amount;

            }

            if (
                transaction.type ===
                "pengeluaran"
            ) {

                totalExpense +=
                    amount;

            }

        }
    );


    // Saldo laporan menggunakan saldo kumulatif,
    // sama dengan dashboard.
    const balance =
        calculateAccumulatedBalance();


    // ==========================================
    // REPORT SUMMARY
    // ==========================================

    const income =
        document.getElementById(
            "reportPageIncome"
        );

    if (income) {

        income.textContent =
            formatRupiah(totalIncome);

    }


    const expense =
        document.getElementById(
            "reportPageExpense"
        );

    if (expense) {

        expense.textContent =
            formatRupiah(totalExpense);

    }


    const balanceElement =
        document.getElementById(
            "reportPageBalance"
        );

    if (balanceElement) {

        balanceElement.textContent =
            formatRupiah(balance);

    }


    const count =
        document.getElementById(
            "reportPageCount"
        );

    if (count) {

        count.textContent =
            filteredTransactions.length;

    }


    // ==========================================
    // REPORT DETAIL
    // ==========================================

    const detailIncome =
        document.getElementById(
            "reportDetailIncome"
        );

    if (detailIncome) {

        detailIncome.textContent =
            formatRupiah(totalIncome);

    }


    const detailExpense =
        document.getElementById(
            "reportDetailExpense"
        );

    if (detailExpense) {

        detailExpense.textContent =
            formatRupiah(totalExpense);

    }


    const detailBalance =
        document.getElementById(
            "reportDetailBalance"
        );

    if (detailBalance) {

        detailBalance.textContent =
            formatRupiah(balance);

    }


    renderReportTable();

}

// ==========================================
// CHART KEUANGAN
// ==========================================

function updateChart() {

    const canvas =
        document.getElementById("financeChart");

    if (!canvas) {
        return;
    }

    // Hapus chart lama
    if (financeChart) {
        financeChart.destroy();
        financeChart = null;
    }

    // ==========================================
    // DATA 12 BULAN DALAM TAHUN TERPILIH
    // ==========================================

    const incomeData = Array(12).fill(0);
    const expenseData = Array(12).fill(0);

    allTransactions.forEach(transaction => {

        const date =
            String(
                transaction.transaction_date || ""
            ).substring(0, 10);

        if (!date) {
            return;
        }

        const parts = date.split("-");

        if (parts.length < 3) {
            return;
        }

        const year = Number(parts[0]);
        const month = Number(parts[1]);

        // Hanya tahun yang sedang dipilih
        if (year !== selectedYear) {
            return;
        }

        const amount =
            Number(transaction.amount) || 0;

        if (transaction.type === "pemasukan") {

            incomeData[month - 1] += amount;

        }

        if (transaction.type === "pengeluaran") {

            expenseData[month - 1] += amount;

        }

    });

    // ==========================================
    // BUAT CHART
    // ==========================================

    financeChart = new Chart(
        canvas,
        {
            type: "bar",

            data: {

                labels: monthNames,

                datasets: [

                    {
                        label: "Pemasukan",

                        data: incomeData,

                        backgroundColor:
                            "#22c55e",

                        borderRadius: 8,

                        borderSkipped: false

                    },

                    {
                        label: "Pengeluaran",

                        data: expenseData,

                        backgroundColor:
                            "#ef4444",

                        borderRadius: 8,

                        borderSkipped: false

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                interaction: {
                    mode: "index",
                    intersect: false
                },

                plugins: {

                    legend: {
                        display: true,

                        position: "top"
                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                return (
                                    context.dataset.label +
                                    ": " +
                                    formatRupiah(
                                        context.raw
                                    )
                                );

                            }

                        }

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            callback: function(value) {

                                return formatRupiah(
                                    value
                                );

                            }

                        }

                    }

                }

            }

        }
    );

}


// ==========================================
// RENDER REPORT TABLE
// ==========================================

function renderReportTable() {

    const table =
        document.getElementById(
            "reportTable"
        );

    if (!table) {
        return;
    }

    table.innerHTML = "";

    if (
        filteredTransactions.length === 0
    ) {

        table.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty"
                >
                    Tidak ada transaksi pada periode ini
                </td>
            </tr>
        `;

        return;
    }

    filteredTransactions.forEach(
        (transaction, index) => {

            const row =
                document.createElement(
                    "tr"
                );

            const isIncome =
                transaction.type ===
                "pemasukan";

            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${formatDate(
                        transaction.transaction_date
                    )}
                </td>

                <td class="${
                    isIncome
                        ? "type-income"
                        : "type-expense"
                }">

                    ${
                        isIncome
                            ? "Pemasukan"
                            : "Pengeluaran"
                    }

                </td>

                <td>
                    ${
                        transaction.category ||
                        "-"
                    }
                </td>

                <td>
                    ${
                        transaction.note ||
                        "-"
                    }
                </td>

                <td class="${
                    isIncome
                        ? "amount-income"
                        : "amount-expense"
                }">

                    ${
                        isIncome
                            ? "+"
                            : "-"
                    }

                    ${formatRupiah(
                        transaction.amount
                    )}

                </td>

            `;

            table.appendChild(
                row
            );

        }
    );

}


// ==========================================
// CREATE TRANSACTION
// ==========================================

async function handleCreateTransaction(
    event
) {

    event.preventDefault();

    const typeElement =
        document.getElementById(
            "type"
        );

    const categoryElement =
        document.getElementById(
            "category"
        );

    const amountElement =
        document.getElementById(
            "amount"
        );

    const dateElement =
        document.getElementById(
            "transactionDate"
        );

    const noteElement =
        document.getElementById(
            "note"
        );

    if (
        !typeElement ||
        !categoryElement ||
        !amountElement ||
        !dateElement ||
        !noteElement
    ) {

        showToast(
            "Form transaksi tidak lengkap"
        );

        return;
    }

    const type =
        typeElement.value;

    const category =
        categoryElement.value;

    const amount =
        Number(
            amountElement.value
        );

    const transactionDate =
        dateElement.value;

    const note =
        noteElement.value.trim();


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!type) {

        showToast(
            "Silakan pilih jenis transaksi"
        );

        return;
    }

    if (
        !category
    ) {

        showToast(
            "Silakan pilih kategori"
        );

        return;
    }

    if (
        !amount ||
        amount <= 0
    ) {

        showToast(
            "Jumlah transaksi harus lebih dari 0"
        );

        return;
    }

    if (!transactionDate) {

        showToast(
            "Silakan pilih tanggal transaksi"
        );

        return;
    }


    try {

        await addTransaction({

            type: type,

            category: category,

            amount: amount,

            transaction_date:
                transactionDate,

            note: note

        });


        showToast(
            "Transaksi berhasil ditambahkan"
        );


        const form =
            document.getElementById(
                "transactionForm"
            );

        if (form) {

            form.reset();

        }


        setToday();

        updateCategoryOptions();

        await loadTransactions();

    } catch (error) {

        console.error(
            error
        );

        showToast(
            error.message ||
            "Gagal menambahkan transaksi"
        );

    }

}


// ==========================================
// DELETE TRANSACTION
// ==========================================

async function deleteTransaction(id) {

    const confirmed =
        confirm(
            "Yakin ingin menghapus transaksi ini?"
        );

    if (!confirmed) {
        return;
    }

    try {

        await removeTransaction(
            id
        );

        showToast(
            "Transaksi berhasil dihapus"
        );

        await loadTransactions();

    } catch (error) {

        console.error(
            error
        );

        showToast(
            error.message ||
            "Gagal menghapus transaksi"
        );

    }

}


// ==========================================
// OPEN EDIT MODAL
// ==========================================

function openEditModal(id) {

    const transaction =
        allTransactions.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!transaction) {

        showToast(
            "Transaksi tidak ditemukan"
        );

        return;
    }


    const editId =
        document.getElementById(
            "editId"
        );

    const editType =
        document.getElementById(
            "editType"
        );

    const editCategory =
        document.getElementById(
            "editCategory"
        );

    const editAmount =
        document.getElementById(
            "editAmount"
        );

    const editDate =
        document.getElementById(
            "editDate"
        );

    const editNote =
        document.getElementById(
            "editNote"
        );

    const editModal =
        document.getElementById(
            "editModal"
        );


    if (
        !editId ||
        !editType ||
        !editCategory ||
        !editAmount ||
        !editDate ||
        !editNote ||
        !editModal
    ) {

        showToast(
            "Form edit tidak lengkap"
        );

        return;
    }


    editId.value =
        transaction.id;

    editType.value =
        transaction.type;

    updateCategoryOptions(
        "editCategory"
    );

    editCategory.value =
        transaction.category || "";

    editAmount.value =
        transaction.amount;

    editDate.value =
        String(
            transaction.transaction_date ||
            ""
        ).substring(0, 10);

    editNote.value =
        transaction.note || "";


    editModal.classList.add(
        "show"
    );

}


// ==========================================
// CLOSE EDIT MODAL
// ==========================================

function closeEditModal() {

    const editModal =
        document.getElementById(
            "editModal"
        );

    if (!editModal) {
        return;
    }

    editModal.classList.remove(
        "show"
    );

}


// ==========================================
// UPDATE TRANSACTION
// ==========================================

async function handleUpdateTransaction(
    event
) {

    event.preventDefault();


    const idElement =
        document.getElementById(
            "editId"
        );

    const typeElement =
        document.getElementById(
            "editType"
        );

    const categoryElement =
        document.getElementById(
            "editCategory"
        );

    const amountElement =
        document.getElementById(
            "editAmount"
        );

    const dateElement =
        document.getElementById(
            "editDate"
        );

    const noteElement =
        document.getElementById(
            "editNote"
        );


    if (
        !idElement ||
        !typeElement ||
        !categoryElement ||
        !amountElement ||
        !dateElement ||
        !noteElement
    ) {

        showToast(
            "Form edit tidak lengkap"
        );

        return;
    }


    const id =
        idElement.value;

    const type =
        typeElement.value;

    const category =
        categoryElement.value;

    const amount =
        Number(
            amountElement.value
        );

    const transactionDate =
        dateElement.value;

    const note =
        noteElement.value.trim();


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!type) {

        showToast(
            "Silakan pilih jenis transaksi"
        );

        return;
    }

    if (!category) {

        showToast(
            "Silakan pilih kategori"
        );

        return;
    }

    if (
        !amount ||
        amount <= 0
    ) {

        showToast(
            "Jumlah transaksi harus lebih dari 0"
        );

        return;
    }

    if (!transactionDate) {

        showToast(
            "Silakan pilih tanggal transaksi"
        );

        return;
    }


    try {

        await updateTransaction(
            id,
            {

                type: type,

                category: category,

                amount: amount,

                transaction_date:
                    transactionDate,

                note: note

            }
        );


        showToast(
            "Transaksi berhasil diperbarui"
        );


        closeEditModal();

        await loadTransactions();

    } catch (error) {

        console.error(
            error
        );

        showToast(
            error.message ||
            "Gagal memperbarui transaksi"
        );

    }

}


// ==========================================
// CATEGORY OPTIONS
// ==========================================

function updateCategoryOptions(
    selectId = "category"
) {

    const select =
        document.getElementById(
            selectId
        );

    if (!select) {
        return;
    }


    const typeElement =
        selectId === "category"
            ? document.getElementById("type")
            : document.getElementById("editType");


    if (!typeElement) {
        return;
    }


    const type =
        typeElement.value;


    let options = [];


    if (
        type === "pemasukan"
    ) {

        options = [

            "Infaq",
            "Sedekah",
            "Donasi",
            "Kotak Amal",
            "Sumbangan",
            "Lainnya"

        ];

    } else {

        options = [

            "Listrik",
            "Air",
            "Kebersihan",
            "Pemeliharaan",
            "Kegiatan",
            "Perlengkapan",
            "Lainnya"

        ];

    }


    select.innerHTML =
        options
            .map(
                category => `
                    <option value="${category}">
                        ${category}
                    </option>
                `
            )
            .join("");

}


// ==========================================
// SET TODAY
// ==========================================

function setToday() {

    const input =
        document.getElementById(
            "transactionDate"
        );

    if (!input) {
        return;
    }


    const today =
        new Date();


    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    input.value =
        `${year}-${month}-${day}`;

}


// ==========================================
// SET CURRENT DATE
// ==========================================

function setCurrentDate() {

    const element =
        document.getElementById(
            "currentDate"
        );

    if (!element) {
        return;
    }


    const today =
        new Date();


    element.textContent =
        today.toLocaleDateString(
            "id-ID",
            {

                weekday: "long",

                day: "numeric",

                month: "long",

                year: "numeric"

            }
        );

}


// ==========================================
// PRINT REPORT
// ==========================================

function printReport() {

    window.print();

}


// ==========================================
// PAGE NAVIGATION
// ==========================================

function showPage(pageName) {

    const pages = {

        dashboard:
            document.getElementById(
                "dashboardPage"
            ),

        transactions:
            document.getElementById(
                "transactionsPage"
            ),

        reports:
            document.getElementById(
                "reportsPage"
            )

    };


    Object.values(
        pages
    ).forEach(
        page => {

            if (page) {

                page.classList.remove(
                    "active"
                );

            }

        }
    );


    if (
        pages[pageName]
    ) {

        pages[pageName]
            .classList.add(
                "active"
            );

    }


    // ==========================================
    // SIDEBAR ACTIVE STATE
    // ==========================================

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );


                if (
                    button.dataset.page ===
                    pageName
                ) {

                    button.classList.add(
                        "active"
                    );

                }

            }
        );


    // ==========================================
    // SCROLL TOP
    // ==========================================

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// ==========================================
// CLOSE MONTH PICKER WHEN CLICK OUTSIDE
// ==========================================

function setupMonthPickerOutsideClick() {

    document.addEventListener(
        "click",
        function(event) {

            const picker =
                document.getElementById(
                    "monthPicker"
                );

            const periodFilter =
                document.querySelector(
                    ".period-filter"
                );


            if (
                picker &&
                periodFilter &&
                !periodFilter.contains(
                    event.target
                )
            ) {

                picker.classList.remove(
                    "show"
                );

            }

        }
    );

}


// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        // ==========================================
        // BASIC SETUP
        // ==========================================

        setToday();

        setCurrentDate();

        updateMonthDisplay();

        renderMonthGrid();


        // ==========================================
        // CATEGORY SETUP
        // ==========================================

        updateCategoryOptions(
            "category"
        );

        updateCategoryOptions(
            "editCategory"
        );


        // ==========================================
        // SEARCH
        // ==========================================

        const searchInput =
            document.getElementById(
                "searchInput"
            );

        if (searchInput) {

            searchInput.addEventListener(
                "input",
                filterTransactions
            );

        }


        // ==========================================
        // CREATE FORM
        // ==========================================

        const transactionForm =
            document.getElementById(
                "transactionForm"
            );

        if (transactionForm) {

            transactionForm.addEventListener(
                "submit",
                handleCreateTransaction
            );

        }


        // ==========================================
        // EDIT FORM
        // ==========================================

        const editForm =
            document.getElementById(
                "editForm"
            );

        if (editForm) {

            editForm.addEventListener(
                "submit",
                handleUpdateTransaction
            );

        }


        // ==========================================
        // TYPE CHANGE
        // ==========================================

        const typeElement =
            document.getElementById(
                "type"
            );

        if (typeElement) {

            typeElement.addEventListener(
                "change",
                () => {

                    updateCategoryOptions(
                        "category"
                    );

                }
            );

        }


        // ==========================================
        // EDIT TYPE CHANGE
        // ==========================================

        const editTypeElement =
            document.getElementById(
                "editType"
            );

        if (editTypeElement) {

            editTypeElement.addEventListener(
                "change",
                () => {

                    updateCategoryOptions(
                        "editCategory"
                    );

                }
            );

        }


        // ==========================================
        // NAVIGATION
        // ==========================================

        document
            .querySelectorAll(
                ".nav-item"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        function() {

                            showPage(
                                this.dataset.page
                            );

                        }
                    );

                }
            );


        // ==========================================
        // MONTH PICKER OUTSIDE CLICK
        // ==========================================

        setupMonthPickerOutsideClick();


        // ==========================================
        // LOAD DATA
        // ==========================================

        try {

            await loadTransactions();

        } catch (error) {

            console.error(
                "Gagal mengambil data dari FastAPI:",
                error
            );

            showToast(
                "Gagal terhubung ke server"
            );

        }

    }
);


// ==========================================
// PWA SERVICE WORKER
// ==========================================

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register(
                    "./service-worker.js"
                )
                .then(
                    registration => {

                        console.log(
                            "Service Worker aktif:",
                            registration.scope
                        );

                    }
                )
                .catch(
                    error => {

                        console.error(
                            "Service Worker gagal:",
                            error
                        );

                    }
                );

        }
    );

}
