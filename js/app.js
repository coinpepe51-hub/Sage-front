/* =========================================================
   SAGE JOURNAL
   FRONTEND APP
   ========================================================= */

const API_BASE_URL = "https://sage-z7bo.onrender.com/api";

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
   PAGE
   ========================================================= */

function getCurrentPage() {
    return (
        window.location.pathname
            .split("/")
            .pop() || "index.html"
    );
}

const currentPage = getCurrentPage();

const publicPages = [
    "login.html",
    "register.html"
];

/* =========================================================
   IMMEDIATE AUTH GUARD
   ========================================================= */

(function authGuard() {

    const token = getAuthToken();

    const isPublicPage =
        publicPages.includes(currentPage);

    /*
     * User is logged out and trying to access
     * a protected page.
     */
    if (!token && !isPublicPage) {

        document.documentElement.classList.add(
            "auth-redirecting"
        );

        window.location.replace(
            "login.html"
        );

        return;
    }

    /*
     * User is already logged in and opens
     * login/register.
     */
    if (
        token &&
        isPublicPage
    ) {

        window.location.replace(
            "index.html"
        );

        return;
    }

})();

/* =========================================================
   API REQUEST
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

    const response =
        await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

    let data = null;

    try {
        data =
            await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {

        if (
            response.status === 401
        ) {
            clearAuth();

            if (
                !publicPages.includes(
                    getCurrentPage()
                )
            ) {
                window.location.replace(
                    "login.html"
                );
            }
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
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Login/register pages
         */
        if (
            currentPage ===
            "login.html"
        ) {
            initializeLogin();
            return;
        }

        if (
            currentPage ===
            "register.html"
        ) {
            initializeRegister();
            return;
        }

        /*
         * Protected pages
         */
        if (!getAuthToken()) {
            return;
        }

        initializeNavigation();
        initializeUser();
        initializeLogout();
        initializeTradeForm();
        initializeDashboard();

        /*
         * Now that authentication has
         * been confirmed, show the app.
         */
        document.body.classList.add(
            "authenticated"
        );
    }
);

/* =========================================================
   LOGIN
   ========================================================= */

function initializeLogin() {

    const form =
        document.getElementById(
            "loginForm"
        );

    if (!form) {
        return;
    }

    /*
     * If already logged in,
     * don't show login page.
     */
    if (getAuthToken()) {
        window.location.replace(
            "index.html"
        );

        return;
    }

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const email =
                document
                    .getElementById(
                        "loginEmail"
                    )
                    ?.value
                    .trim();

            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    ?.value;

            const error =
                document.getElementById(
                    "loginError"
                );

            if (error) {
                error.textContent = "";
            }

            if (!email || !password) {

                if (error) {
                    error.textContent =
                        "Enter your email and password.";
                }

                return;
            }

            const button =
                form.querySelector(
                    'button[type="submit"]'
                );

            try {

                if (button) {
                    button.disabled = true;
                    button.textContent =
                        "Signing in...";
                }

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
                 * replace prevents going back
                 * to login with the back button.
                 */
                window.location.replace(
                    "index.html"
                );

            } catch (err) {

                if (error) {
                    error.textContent =
                        err.message;
                }

                if (button) {
                    button.disabled = false;
                    button.textContent =
                        "Login";
                }
            }
        }
    );
}

/* =========================================================
   REGISTER
   ========================================================= */

function initializeRegister() {

    const form =
        document.getElementById(
            "registerForm"
        );

    if (!form) {
        return;
    }

    /*
     * Already logged in?
     */
    if (getAuthToken()) {

        window.location.replace(
            "index.html"
        );

        return;
    }

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const displayName =
                document
                    .getElementById(
                        "registerName"
                    )
                    ?.value
                    .trim();

            const email =
                document
                    .getElementById(
                        "registerEmail"
                    )
                    ?.value
                    .trim();

            const password =
                document
                    .getElementById(
                        "registerPassword"
                    )
                    ?.value;

            const error =
                document.getElementById(
                    "registerError"
                );

            if (error) {
                error.textContent = "";
            }

            if (
                !displayName ||
                !email ||
                !password
            ) {

                if (error) {
                    error.textContent =
                        "Please complete all fields.";
                }

                return;
            }

            const button =
                form.querySelector(
                    'button[type="submit"]'
                );

            try {

                if (button) {
                    button.disabled = true;
                    button.textContent =
                        "Creating account...";
                }

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

                /*
                 * The backend should return
                 * a token after registration.
                 */
                if (!data.token) {

                    throw new Error(
                        "Account created, but no login token was returned."
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
                 * Go directly to dashboard.
                 */
                window.location.replace(
                    "index.html"
                );

            } catch (err) {

                if (error) {
                    error.textContent =
                        err.message;
                }

                if (button) {
                    button.disabled = false;
                    button.textContent =
                        "Create Account";
                }
            }
        }
    );
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

            const href =
                item.getAttribute(
                    "href"
                );

            if (
                href ===
                currentPage
            ) {
                item.classList.add(
                    "active"
                );
            }

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

            window.location.replace(
                "login.html"
            );
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

function updateDashboard(
    trades
) {

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
        wins.reduce(
            (sum, trade) =>
                sum +
                Math.max(
                    Number(
                        trade.pnl || 0
                    ),
                    0
                ),
            0
        );

    const grossLoss =
        losses.reduce(
            (sum, trade) =>
                sum +
                Math.abs(
                    Math.min(
                        Number(
                            trade.pnl || 0
                        ),
                        0
                    )
                ),
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
        formatMoney(totalPnl)
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

function updateRecentTrades(
    trades
) {

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

                            <td
                                class="${resultClass}"
                            >
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

                            <td
                                class="${resultClass}"
                            >
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
   CHART
   ========================================================= */

function updateChartState(
    trades
) {

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

async function saveTrade(
    event
) {

    event.preventDefault();

    if (!getAuthToken()) {

        window.location.replace(
            "login.html"
        );

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
        getValue(
            "direction"
        );

    let riskDistance;
    let rewardDistance;

    if (
        direction ===
        "Buy"
    ) {

        riskDistance =
            entry -
            stopLoss;

        rewardDistance =
            takeProfit -
            entry;

    } else {

        riskDistance =
            stopLoss -
            entry;

        rewardDistance =
            entry -
            takeProfit;
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
            getValue(
                "tradeDate"
            ),

        entryTime:
            getValue(
                "entryTime"
            ) || null,

        exitTime:
            getValue(
                "exitTime"
            ) || null,

        pair:
            getValue(
                "pair"
            )
                .trim()
                .toUpperCase(),

        direction,

        session:
            getValue(
                "session"
            ),

        strategy:
            getValue(
                "strategy"
            )
                .trim(),

        setup:
            getValue(
                "setup"
            )
                .trim(),

        htfBias:
            getValue(
                "htfBias"
            ),

        mtfStructure:
            getValue(
                "mtfStructure"
            ),

        ltfConfirmation:
            getValue(
                "ltfConfirmation"
            ),

        liquidity:
            getValue(
                "liquidity"
            ),

        mss:
            getValue(
                "mss"
            ),

        fvg:
            getValue(
                "fvg"
            ),

        orderBlock:
            getValue(
                "orderBlock"
            ),

        zone:
            getValue(
                "zone"
            ),

        entryPrice:
            entry,

        stopLoss,

        takeProfit,

        exitPrice:
            getNumber(
                "exitPrice"
            ) || null,

        riskAmount:
            getNumber(
                "risk"
            ),

        positionSize:
            getNumber(
                "positionSize"
            ) || null,

        result:
            getValue(
                "result"
            ),

        rResult:
            getNumber(
                "rResult"
            ),

        pnl:
            getNumber(
                "pnl"
            ),

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

        window.location.replace(
            "trades.html"
        );

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

    if (
        direction ===
        "Buy"
    ) {

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

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (element) {
        element.textContent =
            value;
    }
}

function formatMoney(
    value
) {

    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }
    ).format(
        Number(value || 0)
    );
}

function formatDate(
    value
) {

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

function escapeHtml(
    value
) {

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
