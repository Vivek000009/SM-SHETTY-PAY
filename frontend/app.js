const API_URL = "https://sm-shetty-pay.onrender.com";

let MY_UPI = null;
let MY_PIN = null;
let autoRefreshTimer = null;

let CURRENT_USER = {
    name: "",
    upi_id: "",
    phone: "",
    email: ""
};

let selectedUPI = null;
let qrScanner = null;


// ------------------------------------------
// LOGIN
// ------------------------------------------

async function loginUser() {

    const phone =
        document
            .getElementById("loginPhone")
            .value
            .trim();

    const loginPin =
        document
            .getElementById("loginPin")
            .value
            .trim();

    const message =
        document.getElementById(
            "loginMessage"
        );


    if (!phone) {

        message.textContent =
            "Please enter your mobile number.";

        return;
    }


    if (!/^\d{10}$/.test(phone)) {

        message.textContent =
            "Enter a valid 10-digit mobile number.";

        return;
    }


    if (!loginPin) {

        message.textContent =
            "Please enter your login PIN.";

        return;
    }


    if (!/^\d{4}$/.test(loginPin)) {

        message.textContent =
            "PIN must be 4 digits.";

        return;
    }


    message.textContent =
        "Logging in...";


    try {

        const response =
            await fetch(
                `${API_URL}/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        phone: phone,

                        login_pin: loginPin

                    })
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            message.textContent =
                data.message ||
                "Invalid mobile number or PIN.";

            return;
        }


        CURRENT_USER = {

            name: data.name,

            upi_id: data.upi_id,

            phone: data.phone,

            email: data.email || ""

        };


        MY_UPI =
            data.upi_id;


        // Save the PIN for this login session.
        // This is used by the admin panel
        // to authenticate Vivek Yadav.
        MY_PIN =
            loginPin;


        message.textContent = "";


        document
            .getElementById("loginScreen")
            .classList
            .add("hidden");


        document
            .getElementById("splashScreen")
            .classList
            .remove("hidden");


        setTimeout(async () => {

            document
                .getElementById("splashScreen")
                .classList
                .add("hidden");


            document
                .getElementById("app")
                .classList
                .remove("hidden");


            updateAccountDisplay();

// Load transaction history immediately
await loadHistory();


// Check whether the logged-in user
// is Vivek Yadav and show the
// Admin Panel if authorized.
await setupAdminPanel();


// Start automatic transaction/balance refresh
startAutoRefresh();


        }, 1500);

    }

    catch (error) {

        console.error(
            "Login error:",
            error
        );

        message.textContent =
            "Could not connect to the server.";

    }

}
// ------------------------------------------
// ACCOUNT DISPLAY
// ------------------------------------------

function updateAccountDisplay() {

    const accountName =
        document.querySelector(
            "#accountModal h2"
        );


    if (accountName) {

        accountName.textContent =
            CURRENT_USER.name;

    }


    const accountDetails =
        document.querySelector(
            "#accountModal .account-details"
        );


    if (!accountDetails) {
        return;
    }


    accountDetails.innerHTML = `

        <p>

            <strong>
                UPI ID
            </strong>

            <br>

            ${CURRENT_USER.upi_id}

        </p>


        <p>

            <strong>
                Phone
            </strong>

            <br>

            ${CURRENT_USER.phone}

        </p>


        ${
            CURRENT_USER.email
                ? `
                    <p>

                        <strong>
                            Email
                        </strong>

                        <br>

                        ${CURRENT_USER.email}

                    </p>
                `
                : ""
        }

    `;
    // Generate personal UPI QR code

const qrContainer =
    document.getElementById("accountQRCode");

if (qrContainer) {

    qrContainer.innerHTML = "";

    const paymentURL =
        `upi://pay?pa=${encodeURIComponent(CURRENT_USER.upi_id)}&pn=${encodeURIComponent(CURRENT_USER.name)}`;

    new QRCode(
        qrContainer,
        {
            text: paymentURL,
            width: 180,
            height: 180
        }
    );
}
}


// ------------------------------------------
// BALANCE
// ------------------------------------------

async function checkCurrentBalance() {

    // Do NOT ask for PIN automatically after login.
    // Balance stays hidden until the user clicks
    // "Check Balance".

}


// ------------------------------------------
// CHECK BALANCE
// ------------------------------------------

async function checkBalance() {

    const pin =
        prompt(
            "Enter your PIN to check balance:"
        );


    if (pin === null) {
        return;
    }


    if (!/^\d{4}$/.test(pin)) {

        alert(
            "PIN must be 4 digits."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/balance`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        upi_id: MY_UPI,

                        pin: pin

                    })
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message ||
                "Unable to fetch balance."
            );

            return;
        }


        document
            .getElementById("balanceDisplay")
            .textContent =
            `₹ ${Number(data.balance).toFixed(2)}`;


        document
            .getElementById("balanceButton")
            .textContent =
            "Hide Balance";


        document
            .getElementById("balanceButton")
            .onclick =
            hideBalance;

    }

    catch (error) {

        console.error(
            "Check balance error:",
            error
        );

        alert(
            "Could not connect to the server."
        );

    }

}


// ------------------------------------------
// HIDE BALANCE
// ------------------------------------------

function hideBalance() {

    document
        .getElementById("balanceDisplay")
        .textContent =
        "••••••";


    document
        .getElementById("balanceButton")
        .textContent =
        "Check Balance";


    document
        .getElementById("balanceButton")
        .onclick =
        checkBalance;

}

// ------------------------------------------
// REFRESH BALANCE AFTER PAYMENT
// ------------------------------------------

async function refreshBalanceAfterPayment() {

    if (!MY_UPI || !MY_PIN) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/balance`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        upi_id: MY_UPI,

                        pin: MY_PIN

                    })
                }
            );


        const data =
            await response.json();


        if (!data.success) {
            return;
        }


        // If the balance is currently visible,
        // update it immediately.
        const balanceDisplay =
            document.getElementById(
                "balanceDisplay"
            );

        const balanceButton =
            document.getElementById(
                "balanceButton"
            );


        if (
            balanceButton.textContent.trim()
            === "Hide Balance"
        ) {

            balanceDisplay.textContent =
                `₹ ${Number(data.balance).toFixed(2)}`;

        }

    }

    catch (error) {

        console.error(
            "Balance refresh after payment error:",
            error
        );

    }

}

// ------------------------------------------
// AUTO REFRESH ACCOUNT
// ------------------------------------------

function startAutoRefresh() {

    // Prevent multiple timers
    if (autoRefreshTimer) {

        clearInterval(
            autoRefreshTimer
        );

    }


    autoRefreshTimer =
        setInterval(
            async () => {

                // Refresh transaction history
                await loadHistory();


                // Refresh balance only if
                // the balance is currently visible

                const balanceButton =
                    document.getElementById(
                        "balanceButton"
                    );


                if (
                    balanceButton &&
                    balanceButton
                        .textContent
                        .trim() ===
                    "Hide Balance"
                ) {

                    await refreshBalanceAfterPayment();

                }


                // Refresh admin balances too
                // if Vivek is logged in

                const adminPanel =
                    document.getElementById(
                        "adminPanel"
                    );


                if (
                    adminPanel &&
                    !adminPanel.classList
                        .contains("hidden")
                ) {

                    await setupAdminPanel();

                }

            },

            5000
        );

}

// ------------------------------------------
// UPI PAYMENT
// ------------------------------------------

function openUPIPayment() {

    document
        .getElementById("upiModal")
        .classList
        .remove("hidden");

}


function closeUPI() {

    document
        .getElementById("upiModal")
        .classList
        .add("hidden");

}


async function resolveUPI() {

    const input =
        document
            .getElementById("upiInput")
            .value
            .trim()
            .toLowerCase();


    const result =
        document
            .getElementById("upiResult");


    if (!input) {

        result.textContent =
            "Please enter a UPI ID.";

        return;
    }


    if (input === MY_UPI) {

        result.innerHTML =
            `<span style="color:#ff5252">
                CAN'T PAY TO YOURSELF
            </span>`;

        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/upi/resolve`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    upi_id: input
                })
            }
        );


        const data =
            await response.json();


        if (!data.success) {

            result.innerHTML =
                `<span style="color:#ff5252">
                    This UPI ID does not exists
                </span>`;

            return;
        }


        selectedUPI = data.upi_id;


        result.innerHTML = `
            <div class="recipient-info">
                <strong>${data.name}</strong>
                <br>
                <small>${data.upi_id}</small>
            </div>

            <button
                class="success-button"
                onclick="openPayment()"
            >
                Continue to Payment
            </button>
        `;

    }

    catch (error) {

        result.textContent =
            "Could not connect to backend.";

        console.error(error);
    }
}


// ------------------------------------------
// PAYMENT WINDOW
// ------------------------------------------

function openPayment() {

    closeUPI();

    document
        .getElementById("recipientInfo")
        .innerHTML = `
            <strong>Recipient</strong>
            <br>
            ${selectedUPI}
        `;

    document
        .getElementById("paymentModal")
        .classList
        .remove("hidden");
}


function closePayment() {

    document
        .getElementById("paymentModal")
        .classList
        .add("hidden");
}


// ------------------------------------------
// MAKE PAYMENT
// ------------------------------------------

async function makePayment() {

    const amount =
        Number(
            document
                .getElementById("amountInput")
                .value
        );


    const pin =
        document
            .getElementById("paymentPin")
            .value;


    if (!amount || amount <= 0) {

        alert("Enter a valid amount.");

        return;
    }


    if (pin !== "0987") {

        alert(
            "Incorrect payment password."
        );

        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/payment`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    sender_upi: MY_UPI,

                    receiver_upi:
                        selectedUPI,

                    amount: amount,

                    payment_pin: pin
                })
            }
        );


        const data =
            await response.json();


        if (!data.success) {

            alert(data.message);

            return;
        }
closePayment();

showSuccess(data);

// Refresh transaction history immediately
await loadHistory();

// Refresh the logged-in user's balance
await refreshBalanceAfterPayment();
    }

    catch (error) {

        alert(
            "Payment server is not reachable."
        );

        console.error(error);
    }
}


// ------------------------------------------
// SUCCESS
// ------------------------------------------

function showSuccess(data) {

    document
        .getElementById("successDetails")
        .innerHTML = `

            <strong>
                Paid To
            </strong>

            <br>

            ${data.receiver_name}

            <br><br>


            <strong>
                UPI ID
            </strong>

            <br>

            ${data.receiver_upi}

            <br><br>


            <strong>
                Amount
            </strong>

            <br>

            ₹ ${data.amount.toFixed(2)}

            <br><br>


            <strong>
                Transaction ID
            </strong>

            <br>

            ${data.transaction_id}

            <br><br>


            <strong>
                Time
            </strong>

            <br>

            ${new Date(
                data.created_at
            ).toLocaleString()}

        `;


    document
        .getElementById("successModal")
        .classList
        .remove("hidden");


    playSuccessSound();
}


function closeSuccess() {

    document
        .getElementById("successModal")
        .classList
        .add("hidden");
}


// ------------------------------------------
// SUCCESS SOUND
// ------------------------------------------

function playSuccessSound() {

    try {

        const audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();


        const oscillator =
            audioContext.createOscillator();


        const gain =
            audioContext.createGain();


        oscillator.connect(gain);

        gain.connect(
            audioContext.destination
        );


        oscillator.frequency.value =
            900;

        oscillator.type =
            "sine";


        gain.gain.setValueAtTime(
            0.2,
            audioContext.currentTime
        );


        oscillator.start();


        oscillator.stop(
            audioContext.currentTime + 0.25
        );

    }

    catch (error) {

        console.log(
            "Sound unavailable"
        );
    }
}


// ------------------------------------------
// HISTORY
// ------------------------------------------

async function loadHistory() {

    try {

        const response =
            await fetch(
                `${API_URL}/history/${MY_UPI}`
            );

        const data =
            await response.json();

        const history =
            document.getElementById(
                "history"
            );

        if (
            !data.transactions ||
            data.transactions.length === 0
        ) {

            history.innerHTML =
                "<p>No recent transactions</p>";

            return;
        }

        history.innerHTML =
            data.transactions
                .map(tx => {

                    const isReceived =
                        tx.type === "RECEIVED";

                    const direction =
                        isReceived
                            ? "RECEIVED"
                            : "SENT";

                    const personName =
                        isReceived
                            ? tx.sender_name
                            : tx.receiver_name;

                    const personUPI =
                        isReceived
                            ? tx.sender_upi
                            : tx.receiver_upi;

                    const amountPrefix =
                        isReceived
                            ? "+ ₹"
                            : "- ₹";

                    const amountClass =
                        isReceived
                            ? "history-amount received"
                            : "history-amount sent";

                    return `

                        <div
                            class="history-item"
                            onclick='showTransactionDetails(${JSON.stringify(tx)})'
                        >

                            <div class="history-name">
                                ${direction}
                            </div>

                            <div class="history-name">
                                ${personName}
                            </div>

                            <div class="history-upi">
                                ${personUPI}
                            </div>

                            <div class="history-meta">
                                ${tx.status}
                                •
                                ${new Date(
                                    tx.created_at
                                ).toLocaleString()}
                            </div>

                            <div class="history-meta">
                                Tax ID:
                                ${tx.transaction_id}
                            </div>

                            <div class="${amountClass}">
                                ${amountPrefix}${tx.amount.toFixed(2)}
                            </div>

                        </div>

                    `;

                })
                .join("");

    }

    catch (error) {

        console.error(
            "History error:",
            error
        );

    }
}
function showTransactionDetails(tx) {

    const isReceived =
        tx.type === "RECEIVED";

    const personName =
        isReceived
            ? tx.sender_name
            : tx.receiver_name;

    const personUPI =
        isReceived
            ? tx.sender_upi
            : tx.receiver_upi;

    const amountPrefix =
        isReceived
            ? "+ ₹"
            : "- ₹";

    const amountClass =
        isReceived
            ? "history-amount received"
            : "history-amount sent";

    document
        .getElementById("transactionDetails")
        .innerHTML = `

            <strong>
                ${tx.type}
            </strong>

            <br><br>

            <strong>
                ${isReceived ? "Received From" : "Paid To"}
            </strong>

            <br>

            ${personName}

            <br><br>

            <strong>
                UPI ID
            </strong>

            <br>

            ${personUPI}

            <br><br>

            <strong>
                Amount
            </strong>

            <br>

            <span class="${amountClass}">
                ${amountPrefix}${tx.amount.toFixed(2)}
            </span>

            <br><br>

            <strong>
                Status
            </strong>

            <br>

            ${tx.status}

            <br><br>

            <strong>
                Transaction ID
            </strong>

            <br>

            ${tx.transaction_id}

            <br><br>

            <strong>
                Time
            </strong>

            <br>

            ${new Date(
                tx.created_at
            ).toLocaleString()}

        `;

    document
        .getElementById("transactionDetailsModal")
        .classList
        .remove("hidden");
}


function closeTransactionDetails() {

    document
        .getElementById("transactionDetailsModal")
        .classList
        .add("hidden");
}
// ------------------------------------------
// QR SCANNER
// ------------------------------------------

function openScanner() {

    document
        .getElementById("scannerModal")
        .classList
        .remove("hidden");


    startScanner();
}


function closeScanner() {

    document
        .getElementById("scannerModal")
        .classList
        .add("hidden");


    stopScanner();
}


function startScanner() {

    if (qrScanner) {
        return;
    }


    qrScanner =
        new Html5Qrcode(
            "reader"
        );


   qrScanner.start(

    {
        facingMode: "environment"
    },

    {
        fps: 10,
        qrbox: 250
    },

    decodedText => {

        console.log("QR scanned:", decodedText);

        const upi = extractUPI(decodedText);

        if (!upi) {
            alert("This QR code is not a valid UPI payment QR.");
            return;
        }

        stopScanner();

    document
    .getElementById("scannerModal")
    .classList
    .add("hidden");

        const upiInput = document.getElementById("upiInput");

        if (upiInput) {
            upiInput.value = upi;
        }

        openUPIPayment();

        resolveUPI();

    },

    errorMessage => {

        // Ignore continuous scanner errors.

    }

).catch(error => {

        console.error(
            "Camera error:",
            error
        );

        alert(
            "Unable to access the camera."
        );

    });

}


function stopScanner() {

    if (!qrScanner) {
        return;
    }


    qrScanner.stop()
        .then(() => {

            qrScanner.clear();

            qrScanner = null;

        })
        .catch(() => {

            qrScanner = null;

        });

}


function extractUPI(text) {

    try {

        text = text.trim();

        // Standard UPI payment QR
        if (
            text.toLowerCase().startsWith("upi://pay")
        ) {

            const url = new URL(text);

            const upi = url.searchParams.get("pa");

            if (
                upi &&
                upi.toLowerCase().endsWith("@smshettypay")
            ) {
                return upi;
            }

            return null;
        }

        // Plain UPI ID
        if (
            text.toLowerCase().endsWith("@smshettypay") &&
            text.includes("@")
        ) {
            return text;
        }

    }

    catch (error) {

        console.error(
            "UPI QR parsing error:",
            error
        );

    }

    return null;
}
// --------------------------------------------------
// ADMIN PANEL
// --------------------------------------------------

async function setupAdminPanel() {

    const adminPanel =
        document.getElementById("adminPanel");

    if (!adminPanel) {
        return;
    }

    // Only Vivek Yadav can see the admin panel
    if (
        typeof MY_UPI === "undefined" ||
        typeof MY_PIN === "undefined"
    ) {
        adminPanel.classList.add("hidden");
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/admin/accounts?admin_upi=${encodeURIComponent(MY_UPI)}&admin_pin=${encodeURIComponent(MY_PIN)}`
        );

        const data = await response.json();

        if (!data.success) {

            adminPanel.classList.add("hidden");

            return;
        }

        // Admin verified
        adminPanel.classList.remove("hidden");

        const select =
            document.getElementById(
                "adminAccountSelect"
            );

        select.innerHTML =
            `<option value="">Select an account</option>`;

        data.accounts.forEach(account => {

            const option =
                document.createElement("option");

            option.value =
                account.upi_id;

            option.textContent =
                `${account.name} — ${account.upi_id} — ₹${Number(account.balance).toFixed(2)}`;

            select.appendChild(option);

        });

    }

    catch (error) {

        console.error(
            "Admin panel error:",
            error
        );

        adminPanel.classList.add("hidden");

    }
}


// --------------------------------------------------
// ADMIN ADD MONEY
// --------------------------------------------------

async function adminAddMoney() {

    const select =
        document.getElementById(
            "adminAccountSelect"
        );

    const amountInput =
        document.getElementById(
            "adminAmount"
        );

    const message =
        document.getElementById(
            "adminMessage"
        );

    const receiverUpi =
        select.value;

    const amount =
        Number(amountInput.value);

    if (!receiverUpi) {

        alert(
            "Please select an account."
        );

        return;
    }

    if (!amount || amount <= 0) {

        alert(
            "Please enter a valid amount."
        );

        return;
    }

    try {

        message.textContent =
            "Adding money...";

        const response =
            await fetch(
                `${API_URL}/admin/add-money`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        admin_upi:
                            MY_UPI,

                        admin_pin:
                            MY_PIN,

                        receiver_upi:
                            receiverUpi,

                        amount:
                            amount

                    })
                }
            );

        const data =
            await response.json();

        if (!data.success) {

            message.textContent =
                data.message ||
                "Unable to add money.";

            return;
        }

        message.textContent =
            `₹${amount.toFixed(2)} added successfully to ${data.name}. New balance: ₹${Number(data.new_balance).toFixed(2)}`;

        amountInput.value = "";

        // Refresh account list
        await setupAdminPanel();

    }

    catch (error) {

        console.error(
            "Admin add money error:",
            error
        );

        message.textContent =
            "Could not connect to the backend.";

    }
}
// ------------------------------------------
// ACCOUNT MODAL
// ------------------------------------------

function openAccount() {

    updateAccountDisplay();

    const accountModal =
        document.getElementById("accountModal");

    if (!accountModal) {

        console.error(
            "Account modal not found."
        );

        return;
    }

    accountModal
        .classList
        .remove("hidden");
}


function closeAccount() {

    const accountModal =
        document.getElementById("accountModal");

    if (!accountModal) {
        return;
    }

    accountModal
        .classList
        .add("hidden");
}