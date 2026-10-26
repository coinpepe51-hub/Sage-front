/* =========================================================
   SAGE JOURNAL
   FRONTEND APP
   ========================================================= */

const API_BASE_URL = "http://localhost:4000/api";


/* =========================================================
   AUTH STORAGE
   ========================================================= */

function getAuthToken() {
    return localStorage.getItem("sageJournalToken");
}


function saveAuthToken(token) {
    localStorage.setItem("sageJournalToken", token);
}


function clearAuth() {
    localStorage.removeItem("sageJournalToken");
    localStorage.removeItem("sageJournalUser");
}


function getCurrentUser() {
    try {
        return JSON.parse(
            localStorage.getItem("sageJournalUser")
        );
    } catch {
        return null;
    }
}


/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest(endpoint, options = {}) {

    const token = getAuthToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {

        if (response.status === 401) {
            clearAuth();
        }

        throw new Error(
            data?.error ||
            `Request failed (${response.status})`
        );
    }

    return data;
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

const mobileMenu =
    document.getElementById("mobileMenu");

const sidebar =
    document.querySelector(".sidebar");


if (mobileMenu && sidebar) {

    mobileMenu.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "mobile-open"
            );

        }
    );

}


document
    .querySelectorAll(".nav-item")
    .forEach(item => {

        item.addEventListener(
            "click",
            () => {

                sidebar?.classList.remove(
                    "mobile-open"
                );

            }
        );

    });


/* =========================================================
   ACTIVE NAVIGATION
   ========================================================= */

const currentPage =
    window.location.pathname
        .split("/")
        .pop() || "index.html";


document
    .querySelectorAll(".nav-item")
    .forEach(item => {

        const href =
            item.getAttribute("href");

        if (href === currentPage) {
            item.classList.add("active");
        }

    });


/* =========================================================
   LOGIN
   ========================================================= */

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const email =
                document
                    .getElementById("loginEmail")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("loginPassword")
                    .value;

            const error =
                document.getElementById(
                    "loginError"
                );

            error.textContent = "";

            try {

                const data =
                    await apiRequest(
                        "/auth/login",
                        {
                            method: "POST",

                            body: JSON.stringify({
                                email,
                                password
                            })
                        }
                    );

                saveAuthToken(data.token);

                localStorage.setItem(
                    "sageJournalUser",
                    JSON.stringify(data.user)
                );

                window.location.href =
                    "index.html";

            } catch (err) {

                error.textContent =
                    err.message;

            }

        }
    );

}


/* =========================================================
   REGISTER
   ========================================================= */

const registerForm =
    document.getElementById(
        "registerForm"
    );


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const displayName =
                document
                    .getElementById("registerName")
                    .value
                    .trim();

            const email =
                document
                    .getElementById("registerEmail")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("registerPassword")
                    .value;

            const error =
                document.getElementById(
                    "registerError"
                );

            error.textContent = "";

            try {

                const data =
                    await apiRequest(
                        "/auth/register",
                        {
                            method: "POST",

                            body: JSON.stringify({

                                displayName,

                                email,

                                password

                            })
                        }
                    );

                saveAuthToken(data.token);

                localStorage.setItem(
                    "sageJournalUser",
                    JSON.stringify(data.user)
                );

                window.location.href =
                    "index.html";

            } catch (err) {

                error.textContent =
                    err.message;

            }

        }
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

const logoutButton =
    document.getElementById("logoutButton");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            clearAuth();

            window.location.href =
                "login.html";

        }
    );

}


/* =========================================================
   RR CALCULATOR
   ========================================================= */

function calculateRR() {

    const entry =
        Number(
            document.getElementById("entry")?.value
        );

    const stop =
        Number(
            document.getElementById("stopLoss")?.value
        );

    const target =
        Number(
            document.getElementById("takeProfit")?.value
        );

    const direction =
        document.getElementById("direction")?.value;


    const rrOutput =
        document.getElementById("calculatedRR");

    const riskOutput =
        document.getElementById("riskDistance");

    const rewardOutput =
        document.getElementById("rewardDistance");


    if (
        !entry ||
        !stop ||
        !target
    ) {

        if (rrOutput) {
            rrOutput.textContent = "1 : 0";
        }

        if (riskOutput) {
            riskOutput.textContent = "0";
        }

        if (rewardOutput) {
            rewardOutput.textContent = "0";
        }

        return;
    }


    let riskDistance;

    let rewardDistance;


    if (direction === "Buy") {

        riskDistance =
            entry - stop;

        rewardDistance =
            target - entry;

    } else {

        riskDistance =
            stop - entry;

        rewardDistance =
            entry - target;

    }


    if (riskOutput) {

        riskOutput.textContent =
            Math.abs(riskDistance)
                .toFixed(5);

    }


    if (rewardOutput) {

        rewardOutput.textContent =
            Math.abs(rewardDistance)
                .toFixed(5);

    }


    if (
        riskDistance <= 0 ||
        rewardDistance <= 0
    ) {

        if (rrOutput) {
            rrOutput.textContent = "Invalid";
        }

        return;
    }


    const rr =
        rewardDistance /
        riskDistance;


    if (rrOutput) {

        rrOutput.textContent =
            `1 : ${rr.toFixed(2)}`;

    }

}


/* =========================================================
   TRADE FORM
   ========================================================= */

const tradeForm =
    document.getElementById("tradeForm");


if (tradeForm) {

    const dateInput =
        document.getElementById("tradeDate");


    if (
        dateInput &&
        !dateInput.value
    ) {

        const now = new Date();

        const localDate =
            new Date(
                now.getTime() -
                now.getTimezoneOffset() * 60000
            )
            .toISOString()
            .split("T")[0];

        dateInput.value =
            localDate;

    }


    [
        "entry",
        "stopLoss",
        "takeProfit",
        "direction"
    ].forEach(id => {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.addEventListener(
            "input",
            calculateRR
        );

        element.addEventListener(
            "change",
            calculateRR
        );

    });


    calculateRR();


    tradeForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const token =
                getAuthToken();


            if (!token) {

                window.location.href =
                    "login.html";

                return;

            }


            const getValue =
                id => {

                    return (
                        document
                            .getElementById(id)
                            ?.value || ""
                    );

                };


            const getNumber =
                id => {

                    const value =
                        Number(
                            getValue(id)
                        );

                    return Number.isFinite(value)
                        ? value
                        : 0;

                };


            const entry =
                getNumber("entry");

            const stopLoss =
                getNumber("stopLoss");

            const takeProfit =
                getNumber("takeProfit");

            const direction =
                getValue("direction");


            let riskDistance;

            let rewardDistance;


            if (direction === "Buy") {

                riskDistance =
                    entry - stopLoss;

                rewardDistance =
                    takeProfit - entry;

            } else {

                riskDistance =
                    stopLoss - entry;

                rewardDistance =
                    entry - takeProfit;

            }


            if (
                riskDistance <= 0 ||
                rewardDistance <= 0
            ) {

                alert(
                    "Your Stop Loss and Take Profit do not match the trade direction."
                );

                return;

            }


            const plannedRR =
                rewardDistance /
                riskDistance;


            const trade = {

                tradeDate:
                    getValue("tradeDate"),

                entryTime:
                    getValue("entryTime") || null,

                exitTime:
                    getValue("exitTime") || null,


                pair:
                    getValue("pair")
                        .trim()
                        .toUpperCase(),

                direction,

                session:
                    getValue("session"),

                strategy:
                    getValue("strategy")
                        .trim(),

                setup:
                    getValue("setup")
                        .trim(),


                htfBias:
                    getValue("htfBias"),

                mtfStructure:
                    getValue("mtfStructure"),

                ltfConfirmation:
                    getValue("ltfConfirmation"),

                liquidity:
                    getValue("liquidity"),

                mss:
                    getValue("mss"),

                fvg:
                    getValue("fvg"),

                orderBlock:
                    getValue("orderBlock"),

                zone:
                    getValue("zone"),


                entryPrice:
                    entry,

                stopLoss,

                takeProfit,

                exitPrice:
                    getNumber("exitPrice") || null,

                riskAmount:
                    getNumber("risk"),

                positionSize:
                    getNumber("positionSize") || null,

                result:
                    getValue("result"),

                rResult:
                    getNumber("rResult"),

                pnl:
                    getNumber("pnl"),

                plannedRR,

                riskDistance:
                    Math.abs(riskDistance),

                rewardDistance:
                    Math.abs(rewardDistance),


                psychologyBefore:
                    getValue("psychologyBefore"),

                psychologyDuring:
                    getValue("psychologyDuring"),

                psychologyAfter:
                    getValue("psychologyAfter"),

                followedPlan:
                    getValue("followedPlan"),

                tradeQuality:
                    getValue("tradeQuality"),

                mistake:
                    getValue("mistake"),


                entryReason:
                    getValue("entryReason")
                        .trim(),

                whatHappened:
                    getValue("whatHappened")
                        .trim(),

                whatDidWell:
                    getValue("whatDidWell")
                        .trim(),

                improvement:
                    getValue("improvement")
                        .trim(),

                notes:
                    getValue("notes")
                        .trim()

            };


            if (!trade.pair) {

                alert(
                    "Please enter a pair or market."
                );

                return;

            }


            if (trade.riskAmount <= 0) {

                alert(
                    "Please enter a valid risk amount."
                );

                return;

            }


            try {

                const button =
                    tradeForm.querySelector(
                        'button[type="submit"]'
                    );


                if (button) {

                    button.disabled = true;

                    button.textContent =
                        "Saving...";

                }


                await apiRequest(
                    "/trades",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                trade
                            )
                    }
                );


                alert(
                    "Trade saved successfully."
                );


                window.location.href =
                    "trades.html";


            } catch (error) {

                console.error(
                    "Trade save error:",
                    error
                );


                alert(
                    `Could not save trade: ${error.message}`
                );


                const button =
                    tradeForm.querySelector(
                        'button[type="submit"]'
                    );


                if (button) {

                    button.disabled = false;

                    button.textContent =
                        "Save Trade";

                }

            }

        }
    );

}


/* =========================================================
   EXPORT API HELPERS
   ========================================================= */

window.SageJournal = {

    apiRequest,

    getAuthToken,

    saveAuthToken,

    clearAuth,

    getCurrentUser,

    calculateRR

};
