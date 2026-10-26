/* =========================================================
   SAGE JOURNAL
   SINGLE PAGE FRONTEND
   ========================================================= */

const API_BASE_URL =
    "https://sage-z7bo.onrender.com/api";


/* =========================================================
   AUTH STORAGE
   ========================================================= */

function getAuthToken() {
    return localStorage.getItem(
        "sageJournalToken"
    );
}


function saveAuthToken(token) {
    localStorage.setItem(
        "sageJournalToken",
        token
    );
}


function clearAuth() {

    localStorage.removeItem(
        "sageJournalToken"
    );

    localStorage.removeItem(
        "sageJournalUser"
    );
}


function getCurrentUser() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "sageJournalUser"
            )
        );

    } catch {

        return null;

    }

}


/* =========================================================
   API
   ========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const token =
        getAuthToken();


    const headers = {

        "Content-Type":
            "application/json",

        ...(options.headers || {})

    };


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    let response;


    try {

        response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );

    } catch (error) {

        throw new Error(
            "Unable to connect to the Sage server."
        );

    }


    let data = null;


    try {

        data =
            await response.json();

    } catch {

        data = null;

    }


    if (!response.ok) {

        if (
            response.status === 401 &&
            token
        ) {

            clearAuth();

        }


        throw new Error(
            data?.error ||
            data?.message ||
            `Request failed (${response.status})`
        );

    }


    return data;

}


/* =========================================================
   SCREEN CONTROL
   ========================================================= */

function showAuthScreen() {

    document.body.classList.remove(
        "dashboard-mode"
    );

    document.body.classList.add(
        "auth-mode"
    );

}


function showDashboard() {

    document.body.classList.remove(
        "auth-mode"
    );

    document.body.classList.add(
        "dashboard-mode"
    );

}


function showLoginForm() {

    const register =
        document.getElementById(
            "registerView"
        );

    const login =
        document.getElementById(
            "loginView"
        );


    register?.classList.remove(
        "active"
    );

    login?.classList.add(
        "active"
    );


    document.getElementById(
        "loginError"
    ).textContent = "";


    document.getElementById(
        "registerError"
    ).textContent = "";

}


function showRegisterForm() {

    const register =
        document.getElementById(
            "registerView"
        );

    const login =
        document.getElementById(
            "loginView"
        );


    login?.classList.remove(
        "active"
    );

    register?.classList.add(
        "active"
    );


    document.getElementById(
        "loginError"
    ).textContent = "";


    document.getElementById(
        "registerError"
    ).textContent = "";

}


/* =========================================================
   AUTH VERIFICATION
   ========================================================= */

async function verifyAuthentication() {

    const token =
        getAuthToken();


    if (!token) {

        return false;

    }


    try {

        const data =
            await apiRequest(
                "/auth/me"
            );


        if (!data?.user) {

            clearAuth();

            return false;

        }


        localStorage.setItem(
            "sageJournalUser",
            JSON.stringify(
                data.user
            )
        );


        return true;

    } catch {

        clearAuth();

        return false;

    }

}


/* =========================================================
   START
   ========================================================= */

async function initializeApp() {

    /*
     * Keep the page hidden while
     * authentication is checked.
     */
    document.body.classList.remove(
        "app-ready"
    );


    const token =
        getAuthToken();


    /*
     * No token = brand-new/logged-out user.
     */
    if (!token) {

        showAuthScreen();

        document.body.classList.add(
            "app-ready"
        );

        initializeAuthForms();

        return;

    }


    /*
     * Token exists.
     * Verify it against the
     * deployed backend/database.
     */
    const valid =
        await verifyAuthentication();


    if (!valid) {

        showAuthScreen();

        document.body.classList.add(
            "app-ready"
        );

        initializeAuthForms();

        return;

    }


    /*
     * Valid session.
     */
    showDashboard();

    initializeDashboardApp();

    document.body.classList.add(
        "app-ready"
    );

}


/* =========================================================
   AUTH FORMS
   ========================================================= */

function initializeAuthForms() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );


    const registerForm =
        document.getElementById(
            "registerForm"
        );


    document
        .getElementById(
            "showLogin"
        )
        ?.addEventListener(
            "click",
            showLoginForm
        );


    document
        .getElementById(
            "showRegister"
        )
        ?.addEventListener(
            "click",
            showRegisterForm
        );


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            handleRegister
        );

    }

}


/* =========================================================
   LOGIN
   ========================================================= */

async function handleLogin(event) {

    event.preventDefault();


    const email =
        document
            .getElementById(
                "loginEmail"
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                "loginPassword"
            )
            .value;


    const error =
        document.getElementById(
            "loginError"
        );


    const button =
        event.currentTarget.querySelector(
            'button[type="submit"]'
        );


    error.textContent = "";


    if (!email || !password) {

        error.textContent =
            "Enter your email and password.";

        return;

    }


    try {

        button.disabled = true;

        button.textContent =
            "Signing in...";


        const data =
            await apiRequest(
                "/auth/login",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            email,
                            password
                        })
                }
            );


        if (!data?.token) {

            throw new Error(
                "Login succeeded but no authentication token was returned."
            );

        }


        saveAuthToken(
            data.token
        );


        if (data.user) {

            localStorage.setItem(
                "sageJournalUser",
                JSON.stringify(
                    data.user
                )
            );

        }


        /*
         * No login.html.
         * No redirect.
         * Simply switch to dashboard.
         */
        showDashboard();

        initializeDashboardApp();


    } catch (err) {

        error.textContent =
            err.message;

        button.disabled = false;

        button.textContent =
            "Login";

    }

}


/* =========================================================
   REGISTER
   ========================================================= */

async function handleRegister(event) {

    event.preventDefault();


    const displayName =
        document
            .getElementById(
                "registerName"
            )
            .value
            .trim();


    const email =
        document
            .getElementById(
                "registerEmail"
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                "registerPassword"
            )
            .value;


    const error =
        document.getElementById(
            "registerError"
        );


    const button =
        event.currentTarget.querySelector(
            'button[type="submit"]'
        );


    error.textContent = "";


    if (
        !displayName ||
        !email ||
        !password
    ) {

        error.textContent =
            "Please complete all fields.";

        return;

    }


    if (password.length < 8) {

        error.textContent =
            "Password must be at least 8 characters.";

        return;

    }


    try {

        button.disabled = true;

        button.textContent =
            "Creating account...";


        const data =
            await apiRequest(
                "/auth/register",
                {
                    method: "POST",

                    body:
                        JSON.stringify({

                            displayName,

                            email,

                            password

                        })
                }
            );


        if (!data?.token) {

            throw new Error(
                "Account was created but no authentication token was returned."
            );

        }


        saveAuthToken(
            data.token
        );


        if (data.user) {

            localStorage.setItem(
                "sageJournalUser",
                JSON.stringify(
                    data.user
                )
            );

        }


        /*
         * Registration is complete.
         * Show dashboard immediately.
         */
        showDashboard();

        initializeDashboardApp();


    } catch (err) {

        error.textContent =
            err.message;

        button.disabled = false;

        button.textContent =
            "Create Account";

    }

}


/* =========================================================
   DASHBOARD INITIALIZATION
   ========================================================= */

let dashboardInitialized = false;


function initializeDashboardApp() {

    /*
     * Prevent duplicate event listeners
     * when switching login -> dashboard.
     */
    if (dashboardInitialized) {

        initializeUser();

        initializeDashboard();

        return;

    }


    dashboardInitialized = true;


    initializeNavigation();

    initializeUser();

    initializeLogout();

    initializeTradeForm();

    initializeDashboard();

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initializeNavigation() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    const mobileMenu =
        document.getElementById(
            "mobileMenu"
        );


    if (
        mobileMenu &&
        sidebar
    ) {

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
        .querySelectorAll(
            ".nav-item"
        )
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

}


/* =========================================================
   USER
   ========================================================= */

function initializeUser() {

    const user =
        getCurrentUser();


    if (!user) {
        return;
    }


    const name =
        user.displayName ||
        user.name ||
        user.email?.split("@")[0] ||
        "Trader";


    document
        .querySelectorAll(
            "[data-user-name]"
        )
        .forEach(element => {

            element.textContent =
                name;

        });


    document
        .querySelectorAll(
            "[data-user-email]"
        )
        .forEach(element => {

            element.textContent =
                user.email || "";

        });


    document
        .querySelectorAll(
            "[data-user-avatar]"
        )
        .forEach(element => {

            element.textContent =
                name
                    .charAt(0)
                    .toUpperCase();

        });

}


/* =========================================================
   LOGOUT
   ========================================================= */

function initializeLogout() {

    const button =
        document.getElementById(
            "logoutButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            clearAuth();

            dashboardInitialized =
                false;

            showAuthScreen();

            showLoginForm();

        }
    );

}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function initializeDashboard() {

    const dashboard =
        document.getElementById(
            "dashboard"
        );


    if (!dashboard) {
        return;
    }


    try {

        const data =
            await apiRequest(
                "/trades"
            );


        const trades =
            Array.isArray(data)
                ? data
                : data?.trades || [];


        updateDashboard(
            trades
        );


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}


/* =========================================================
   DASHBOARD DATA
   ========================================================= */

function updateDashboard(trades) {

    const total =
        trades.length;


    const wins =
        trades.filter(
            trade =>
                String(
                    trade.result || ""
                ).toLowerCase() ===
                "win"
        );


    const losses =
        trades.filter(
            trade =>
                String(
                    trade.result || ""
                ).toLowerCase() ===
                "loss"
        );


    const totalPnl =
        trades.reduce(
            (sum, trade) =>
                sum +
                Number(
                    trade.pnl || 0
                ),
            0
        );


    const grossProfit =
        trades.reduce(
            (sum, trade) => {

                const pnl =
                    Number(
                        trade.pnl || 0
                    );

                return sum +
                    Math.max(
                        pnl,
                        0
                    );

            },
            0
        );


    const grossLoss =
        trades.reduce(
            (sum, trade) => {

                const pnl =
                    Number(
                        trade.pnl || 0
                    );

                return sum +
                    Math.abs(
                        Math.min(
                            pnl,
                            0
                        )
                    );

            },
            0
        );


    const winRate =
        total
            ? wins.length /
              total *
              100
            : 0;


    const profitFactor =
        grossLoss
            ? grossProfit /
              grossLoss
            : 0;


    const rValues =
        trades
            .map(
                trade =>
                    Number(
                        trade.rResult ??
                        trade.r_result ??
                        0
                    )
            )
            .filter(
                Number.isFinite
            );


    const averageR =
        rValues.length
            ? rValues.reduce(
                (a, b) =>
                    a + b,
                0
            ) /
            rValues.length
            : 0;


    const best =
        rValues.length
            ? Math.max(
                ...rValues
            )
            : 0;


    const worst =
        rValues.length
            ? Math.min(
                ...rValues
            )
            : 0;


    setText(
        "totalPnl",
        formatMoney(
            totalPnl
        )
    );


    setText(
        "winRate",
        `${winRate.toFixed(1)}%`
    );


    setText(
        "profitFactor",
        profitFactor.toFixed(2)
    );


    setText(
        "totalTrades",
        total
    );


    setText(
        "winningTrades",
        wins.length
    );


    setText(
        "losingTrades",
        losses.length
    );


    setText(
        "averageR",
        `${averageR.toFixed(2)}R`
    );


    setText(
        "bestTrade",
        `${best.toFixed(2)}R`
    );


    setText(
        "worstTrade",
        `${worst.toFixed(2)}R`
    );


    updateRecentTrades(
        trades
    );


    updateChartState(
        trades
    );

}


/* =========================================================
   RECENT TRADES
   ========================================================= */

function updateRecentTrades(trades) {

    const tbody =
        document.getElementById(
            "recentTrades"
        );


    if (!tbody) {
        return;
    }


    if (!trades.length) {

        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    No trades recorded yet.
                </td>
            </tr>
        `;

        return;

    }


    const recent =
        [...trades]
            .sort(
                (a, b) =>
                    new Date(
                        b.tradeDate ||
                        b.trade_date ||
                        0
                    ) -
                    new Date(
                        a.tradeDate ||
                        a.trade_date ||
                        0
                    )
            )
            .slice(0, 8);


    tbody.innerHTML =
        recent
            .map(
                trade => {

                    const result =
                        String(
                            trade.result ||
                            ""
                        ).toLowerCase();


                    const resultClass =
                        result === "win"
                            ? "positive"
                            : result === "loss"
                                ? "negative"
                                : "";


                    return `
                        <tr>

                            <td>
                                ${formatDate(
                                    trade.tradeDate ||
                                    trade.trade_date
                                )}
                            </td>

                            <td>
                                <strong>
                                    ${escapeHtml(
                                        trade.pair ||
                                        "-"
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHtml(
                                    trade.direction ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    trade.setup ||
                                    trade.strategy ||
                                    "-"
                                )}
                            </td>

                            <td class="${resultClass}">
                                ${escapeHtml(
                                    trade.result ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${Number(
                                    trade.rResult ??
                                    trade.r_result ??
                                    0
                                ).toFixed(2)}R
                            </td>

                            <td class="${resultClass}">
                                ${formatMoney(
                                    trade.pnl ||
                                    0
                                )}
                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   CHART STATE
   ========================================================= */

function updateChartState(trades) {

    const empty =
        document.getElementById(
            "emptyChart"
        );


    const canvas =
        document.getElementById(
            "equityChart"
        );


    if (!empty) {
        return;
    }


    if (!trades.length) {

        empty.style.display =
            "flex";


        if (canvas) {

            canvas.style.display =
                "none";

        }

    } else {

        empty.style.display =
            "none";


        if (canvas) {

            canvas.style.display =
                "block";

        }

    }

}


/* =========================================================
   TRADE FORM
   ========================================================= */

function initializeTradeForm() {

    const form =
        document.getElementById(
            "tradeForm"
        );


    if (!form) {
        return;
    }


    const date =
        document.getElementById(
            "tradeDate"
        );


    if (
        date &&
        !date.value
    ) {

        const now =
            new Date();


        const localDate =
            new Date(
                now.getTime() -
                now.getTimezoneOffset() *
                60000
            )
                .toISOString()
                .split("T")[0];


        date.value =
            localDate;

    }


    [
        "entry",
        "stopLoss",
        "takeProfit",
        "direction"
    ].forEach(id => {

        const element =
            document.getElementById(
                id
            );


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


    form.addEventListener(
        "submit",
        saveTrade
    );

}


/* =========================================================
   SAVE TRADE
   ========================================================= */

async function saveTrade(event) {

    event.preventDefault();


    if (!getAuthToken()) {

        showAuthScreen();

        showLoginForm();

        return;

    }


    const getValue =
        id =>
            document
                .getElementById(id)
                ?.value || "";


    const getNumber =
        id => {

            const value =
                Number(
                    getValue(id)
                );


            return Number.isFinite(
                value
            )
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


    const trade = {

        tradeDate:
            getValue("tradeDate"),

        entryTime:
            getValue("entryTime") ||
            null,

        exitTime:
            getValue("exitTime") ||
            null,

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
            getNumber("exitPrice") ||
            null,

        riskAmount:
            getNumber("risk"),

        positionSize:
            getNumber("positionSize") ||
            null,

        result:
            getValue("result"),

        rResult:
            getNumber("rResult"),

        pnl:
            getNumber("pnl"),

        plannedRR:
            rewardDistance /
            riskDistance,

        riskDistance:
            Math.abs(
                riskDistance
            ),

        rewardDistance:
            Math.abs(
                rewardDistance
            ),

        psychologyBefore:
            getValue(
                "psychologyBefore"
            ),

        psychologyDuring:
            getValue(
                "psychologyDuring"
            ),

        psychologyAfter:
            getValue(
                "psychologyAfter"
            ),

        followedPlan:
            getValue(
                "followedPlan"
            ),

        tradeQuality:
            getValue(
                "tradeQuality"
            ),

        mistake:
            getValue(
                "mistake"
            ),

        entryReason:
            getValue(
                "entryReason"
            ).trim(),

        whatHappened:
            getValue(
                "whatHappened"
            ).trim(),

        whatDidWell:
            getValue(
                "whatDidWell"
            ).trim(),

        improvement:
            getValue(
                "improvement"
            ).trim(),

        notes:
            getValue(
                "notes"
            ).trim()

    };


    if (!trade.pair) {

        alert(
            "Please enter a pair or market."
        );

        return;

    }


    try {

        const button =
            event.target.querySelector(
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
            event.target.querySelector(
                'button[type="submit"]'
            );


        if (button) {

            button.disabled = false;

            button.textContent =
                "Save Trade";

        }

    }

}


/* =========================================================
   RR CALCULATOR
   ========================================================= */

function calculateRR() {

    const entry =
        Number(
            document.getElementById(
                "entry"
            )?.value
        );


    const stop =
        Number(
            document.getElementById(
                "stopLoss"
            )?.value
        );


    const target =
        Number(
            document.getElementById(
                "takeProfit"
            )?.value
        );


    const direction =
        document.getElementById(
            "direction"
        )?.value;


    const rrOutput =
        document.getElementById(
            "calculatedRR"
        );


    const riskOutput =
        document.getElementById(
            "riskDistance"
        );


    const rewardOutput =
        document.getElementById(
            "rewardDistance"
        );


    if (
        !entry ||
        !stop ||
        !target
    ) {

        if (rrOutput) {

            rrOutput.textContent =
                "1 : 0";

        }


        if (riskOutput) {

            riskOutput.textContent =
                "0";

        }


        if (rewardOutput) {

            rewardOutput.textContent =
                "0";

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
            Math.abs(
                riskDistance
            ).toFixed(5);

    }


    if (rewardOutput) {

        rewardOutput.textContent =
            Math.abs(
                rewardDistance
            ).toFixed(5);

    }


    if (
        riskDistance <= 0 ||
        rewardDistance <= 0
    ) {

        if (rrOutput) {

            rrOutput.textContent =
                "Invalid";

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
   HELPERS
   ========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


function formatMoney(value) {

    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }
    ).format(
        Number(
            value || 0
        )
    );

}


function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


function escapeHtml(value) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);


/* =========================================================
   GLOBAL API
   ========================================================= */

window.SageJournal = {

    apiRequest,

    getAuthToken,

    saveAuthToken,

    clearAuth,

    getCurrentUser,

    calculateRR

};
