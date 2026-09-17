// ==========================================
// LOCAL DATABASE - INDEXEDDB
// ==========================================

const DB_NAME = "KeuanganMasjidDB";
const DB_VERSION = 1;
const STORE_NAME = "transactions";

let db = null;


// ==========================================
// OPEN DATABASE
// ==========================================

function openDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            DB_NAME,
            DB_VERSION
        );


        request.onupgradeneeded = function(event) {

            const database = event.target.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {

                const store =
                    database.createObjectStore(
                        STORE_NAME,
                        {
                            keyPath: "id",
                            autoIncrement: true
                        }
                    );

                store.createIndex(
                    "transaction_date",
                    "transaction_date",
                    { unique: false }
                );

                store.createIndex(
                    "type",
                    "type",
                    { unique: false }
                );

            }

        };


        request.onsuccess = function(event) {

            db = event.target.result;

            resolve(db);

        };


        request.onerror = function() {

            reject(
                new Error(
                    "Database lokal gagal dibuka"
                )
            );

        };

    });

}
// ==========================================
// GET ALL TRANSACTIONS
// ==========================================

function getTransactions() {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readonly"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.getAll();


        request.onsuccess = function() {

            resolve(request.result);

        };


        request.onerror = function() {

            reject(
                new Error(
                    "Gagal mengambil transaksi"
                )
            );

        };

    });

}


// ==========================================
// ADD TRANSACTION
// ==========================================

function addTransaction(data) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.add(data);


        request.onsuccess = function() {

            resolve(request.result);

        };


        request.onerror = function() {

            reject(
                new Error(
                    "Gagal menambahkan transaksi"
                )
            );

        };

    });

}


// ==========================================
// UPDATE TRANSACTION
// ==========================================

function updateTransaction(id, data) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );


        const request =
            store.put({
                ...data,
                id: Number(id)
            });


        request.onsuccess = function() {

            resolve();

        };


        request.onerror = function() {

            reject(
                new Error(
                    "Gagal memperbarui transaksi"
                )
            );

        };

    });

}


// ==========================================
// DELETE TRANSACTION
// ==========================================

function removeTransaction(id) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );


        const request =
            store.delete(Number(id));


        request.onsuccess = function() {

            resolve();

        };


        request.onerror = function() {

            reject(
                new Error(
                    "Gagal menghapus transaksi"
                )
            );

        };

    });

}



// ==========================================
// GLOBAL
// ==========================================

let allTransactions = [];
let filteredTransactions = [];

let financeChart = null;

let selectedYear = new Date().getFullYear();
let selectedMonth = new Date().getMonth() + 1;

let pickerYear = selectedYear;


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

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(Number(amount) || 0);

}


// ==========================================
// FORMAT TANGGAL
// ==========================================

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString);

    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

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

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);

}


// ==========================================
// MONTH VALUE
// ==========================================

function getSelectedMonthValue() {

    return (
        selectedYear +
        "-" +
        String(selectedMonth).padStart(2, "0")
    );

}


// ==========================================
// UPDATE MONTH DISPLAY
// ==========================================

function updateMonthDisplay() {

    const element =
        document.getElementById("selectedMonth");

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


    pickerYear = selectedYear;


    updateMonthDisplay();

    renderMonthGrid();

    applyFilters();

}


// ==========================================
// OPEN / CLOSE MONTH PICKER
// ==========================================

function toggleMonthPicker() {

    const picker =
        document.getElementById("monthPicker");

    if (!picker) {
        return;
    }

    picker.classList.toggle("show");

    if (picker.classList.contains("show")) {

        pickerYear = selectedYear;

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
        document.getElementById("monthGrid");

    const yearElement =
        document.getElementById("pickerYear");


    if (!grid || !yearElement) {
        return;
    }


    yearElement.textContent =
        pickerYear;


    grid.innerHTML = "";


    monthNames.forEach((month, index) => {

        const monthNumber = index + 1;

        const button =
            document.createElement("button");


        button.type = "button";

        button.className = "month-option";

        button.textContent = month;


        if (
            pickerYear === selectedYear &&
            monthNumber === selectedMonth
        ) {

            button.classList.add("active");

        }


        button.addEventListener(
            "click",
            function() {

                selectedYear =
                    pickerYear;

                selectedMonth =
                    monthNumber;


                updateMonthDisplay();

                applyFilters();


                document
                    .getElementById(
                        "monthPicker"
                    )
                    .classList.remove("show");

            }
        );


        grid.appendChild(button);

    });

}


// ==========================================
// RESET FILTER
// ==========================================

function resetFilter() {

    // Gunakan bulan saat ini
    // tetapi tampilkan semua transaksi

    selectedYear =
        new Date().getFullYear();

    selectedMonth =
        new Date().getMonth() + 1;


    updateMonthDisplay();

    renderMonthGrid();


    filteredTransactions =
        [...allTransactions];


    renderTransactions();

    updateSummary();

    // updateChart();


    const reportPeriod =
        document.getElementById(
            "reportPeriod"
        );


    if (reportPeriod) {

        reportPeriod.textContent =
            "Semua transaksi";

    }


    const searchInput =
        document.getElementById(
            "searchInput"
        );


    if (searchInput) {

        searchInput.value = "";

    }

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

        filteredTransactions =
            [...allTransactions];

        renderTransactions();

        updateSummary();

       // updateChart();

        updateReportPeriod();

        updateReportPage();

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
                        transaction.transaction_date || ""
                    ).substring(0, 10);


                const transactionMonth =
                    transactionDate.substring(0, 7);


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
                    searchText.includes(search);


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

    // updateChart();

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
                document.createElement("tr");


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
                        class="edit-btn"
                        onclick="openEditModal(${transaction.id})"
                        title="Edit"
                    >
                        ✏️
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteTransaction(${transaction.id})"
                        title="Hapus"
                    >
                        🗑
                    </button>

                </td>

            `;


            table.appendChild(row);

        }
    );

}


// ==========================================
// UPDATE SUMMARY
// ==========================================

function updateSummary() {

    let totalIncome = 0;
    let totalExpense = 0;

    // Pemasukan & pengeluaran bulan yang dipilih
    filteredTransactions.forEach(transaction => {

        const amount = Number(transaction.amount) || 0;

        if (transaction.type === "pemasukan") {
            totalIncome += amount;
        }

        if (transaction.type === "pengeluaran") {
            totalExpense += amount;
        }

    });

    // ==========================================
    // SALDO AKUMULATIF DARI SEMUA BULAN SEBELUMNYA
    // + BULAN YANG SEDANG DIPILIH
    // ==========================================

    let accumulatedIncome = 0;
    let accumulatedExpense = 0;

    const selectedPeriod =
        `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

    allTransactions.forEach(transaction => {

        const transactionDate =
            String(transaction.transaction_date || "").substring(0, 7);

        if (transactionDate <= selectedPeriod) {

            const amount =
                Number(transaction.amount) || 0;

            if (transaction.type === "pemasukan") {
                accumulatedIncome += amount;
            }

            if (transaction.type === "pengeluaran") {
                accumulatedExpense += amount;
            }

        }

    });

    const balance =
        accumulatedIncome - accumulatedExpense;


    // ==========================================
    // DASHBOARD
    // ==========================================

    document.getElementById("saldo").textContent =
        formatRupiah(balance);

    document.getElementById("totalPemasukan").textContent =
        formatRupiah(totalIncome);

    document.getElementById("totalPengeluaran").textContent =
        formatRupiah(totalExpense);

    document.getElementById("jumlahTransaksi").textContent =
        filteredTransactions.length;


    // ==========================================
    // RINGKASAN
    // ==========================================

    document.getElementById("reportIncome").textContent =
        formatRupiah(totalIncome);

    document.getElementById("reportExpense").textContent =
        formatRupiah(totalExpense);

    document.getElementById("reportBalance").textContent =
        formatRupiah(balance);

    document.getElementById("reportCount").textContent =
        filteredTransactions.length;

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


    // Periode

    const periodElement =
        document.getElementById(
            "reportSelectedPeriod"
        );

    if (periodElement) {
        periodElement.textContent = period;
    }


    const reportPagePeriod =
        document.getElementById(
            "reportPagePeriod"
        );

    if (reportPagePeriod) {
        reportPagePeriod.textContent = period;
    }
const printReportPeriod =
    document.getElementById(
        "printReportPeriod"
    );

if (printReportPeriod) {
    printReportPeriod.textContent = period;
}


    // Hitung

    let totalIncome = 0;
    let totalExpense = 0;


    filteredTransactions.forEach(
        transaction => {

            const amount =
                Number(transaction.amount) || 0;


            if (
                transaction.type ===
                "pemasukan"
            ) {

                totalIncome += amount;

            }


            if (
                transaction.type ===
                "pengeluaran"
            ) {

                totalExpense += amount;

            }

        }
    );


    const balance =
        totalIncome - totalExpense;


    // Summary

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


    // Detail

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

            const isIncome =
                transaction.type ===
                "pemasukan";


            const row =
                document.createElement("tr");


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


            table.appendChild(row);

        }
    );

}

// ==========================================
// CHART
// ==========================================
/*
function updateChart() {

    const canvas =
        document.getElementById(
            "financeChart"
        );


    if (!canvas) {
        return;
    }


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

                totalIncome += amount;

            }


            if (
                transaction.type ===
                "pengeluaran"
            ) {

                totalExpense += amount;

            }

        }
    );


    if (financeChart) {

        financeChart.destroy();

    }


    financeChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: [
                        "Pemasukan",
                        "Pengeluaran"
                    ],

                    datasets: [

                        {

                            label:
                                "Keuangan",

                            data: [
                                totalIncome,
                                totalExpense
                            ],

                            backgroundColor: [
                                "#22c55e",
                                "#ef4444"
                            ],

                            borderRadius: 8

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,


                    plugins: {

                        legend: {
                            display: false
                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function(context) {

                                        return formatRupiah(
                                            context.raw
                                        );

                                    }

                            }

                        }

                    },


                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {

                                callback:
                                    function(value) {

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
*/

// ==========================================
// CREATE TRANSACTION
// ==========================================

document
    .getElementById(
        "transactionForm"
    )
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const type =
                document.getElementById(
                    "type"
                ).value;


            const category =
                document.getElementById(
                    "category"
                ).value;


            const amount =
                Number(
                    document.getElementById(
                        "amount"
                    ).value
                );


            const transactionDate =
                document.getElementById(
                    "transactionDate"
                ).value;


            const note =
                document.getElementById(
                    "note"
                ).value;


            try {

    await addTransaction({

        type: type,

        category: category,

        amount: amount,

        transaction_date: transactionDate,

        note: note

    });


    showToast(
        "Transaksi berhasil ditambahkan"
    );


    document
        .getElementById(
            "transactionForm"
        )
        .reset();


    setToday();

    updateCategoryOptions();


    await loadTransactions();


} catch (error) {

    console.error(error);

    showToast(
        error.message
    );

}
}            
    );

// ==========================================
// DELETE
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

    await removeTransaction(id);


    showToast(
        "Transaksi berhasil dihapus"
    );


    await loadTransactions();


} catch (error) {

    console.error(error);

    showToast(
        error.message
    );

}
}

// ==========================================
// EDIT
// ==========================================

function openEditModal(id) {

    const transaction =
        allTransactions.find(
            item => item.id === id
        );


    if (!transaction) {

        showToast(
            "Transaksi tidak ditemukan"
        );

        return;

    }


    document.getElementById(
        "editId"
    ).value =
        transaction.id;


    document.getElementById(
        "editType"
    ).value =
        transaction.type;


    updateCategoryOptions(
        "editCategory"
    );


    document.getElementById(
        "editCategory"
    ).value =
        transaction.category;


    document.getElementById(
        "editAmount"
    ).value =
        transaction.amount;


    document.getElementById(
        "editDate"
    ).value =
        String(
            transaction.transaction_date
        ).substring(0, 10);


    document.getElementById(
        "editNote"
    ).value =
        transaction.note || "";


    document
        .getElementById(
            "editModal"
        )
        .classList.add("show");

}


// ==========================================
// CLOSE EDIT
// ==========================================

function closeEditModal() {

    document
        .getElementById(
            "editModal"
        )
        .classList.remove("show");

}


// ==========================================
// UPDATE
// ==========================================

document
    .getElementById("editForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const id =
            document.getElementById("editId").value;

        const type =
            document.getElementById("editType").value;

        const category =
            document.getElementById("editCategory").value;

        const amount =
            Number(
                document.getElementById("editAmount").value
            );

        const transactionDate =
            document.getElementById("editDate").value;

        const note =
            document.getElementById("editNote").value;

        try {

            await updateTransaction(id, {
                type: type,
                category: category,
                amount: amount,
                transaction_date: transactionDate,
                note: note
            });

            showToast(
                "Transaksi berhasil diperbarui"
            );

            closeEditModal();

            await loadTransactions();

        } catch (error) {

            console.error(error);

            showToast(error.message);

        }

    });



// ==========================================
// CATEGORY
// ==========================================

function updateCategoryOptions(
    selectId = "category"
) {

    const select =
        document.getElementById(selectId);

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

    let options;

    if (type === "pemasukan") {

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
// TYPE CHANGE
// ==========================================

document
    .getElementById(
        "type"
    )
    .addEventListener(
        "change",
        () => {

            updateCategoryOptions();

        }
    );


document
    .getElementById(
        "editType"
    )
    .addEventListener(
        "change",
        () => {

            updateCategoryOptions(
                "editCategory"
            );

        }
    );


// ==========================================
// TODAY
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
        new Date()
            .toISOString()
            .split("T")[0];


    input.value = today;

}


// ==========================================
// CURRENT DATE
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
// CLOSE PICKER WHEN CLICK OUTSIDE
// ==========================================

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


// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setToday();

        setCurrentDate();

        updateMonthDisplay();

        renderMonthGrid();

        updateCategoryOptions("category");

        updateCategoryOptions("editCategory");


        const searchInput =
            document.getElementById("searchInput");

        if (searchInput) {

            searchInput.addEventListener(
                "input",
                filterTransactions
            );

        }


        document
            .querySelectorAll(".nav-item")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function() {

                        showPage(
                            this.dataset.page
                        );

                    }
                );

            });


        // Buka database terlebih dahulu
        openDatabase()
            .then(() => {

                console.log(
                    "Database lokal berhasil dibuka"
                );

                return loadTransactions();

            })
            .catch(error => {

                console.error(error);

                showToast(
                    "Database lokal gagal dibuka"
                );

            });

    }
);

// ==========================================
// PAGE NAVIGATION
// ==========================================

function showPage(pageName) {

    const pages = {

        dashboard:
            document.getElementById("dashboardPage"),

        transactions:
            document.getElementById("transactionsPage"),

        reports:
            document.getElementById("reportsPage")

    };


    Object.values(pages).forEach(page => {

        if (page) {
            page.classList.remove("active");
        }

    });


    if (pages[pageName]) {

        pages[pageName]
            .classList.add("active");

    }


    // Update sidebar active state

    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.classList.remove("active");


            if (
                button.dataset.page ===
                pageName
            ) {

                button.classList.add("active");

            }

        });


    // Scroll ke atas

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ==========================================
// SIDEBAR NAVIGATION
// ==========================================

document
    .querySelectorAll(".nav-item")
    .forEach(button => {

        button.addEventListener(
            "click",
            function() {

                showPage(
                    this.dataset.page
                );

            }
        );

    });
// ==========================================
// PWA SERVICE WORKER
// ==========================================

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("./service-worker.js")
            .then(registration => {

                console.log(
                    "Service Worker aktif:",
                    registration.scope
                );

            })
            .catch(error => {

                console.error(
                    "Service Worker gagal:",
                    error
                );

            });

    });
}