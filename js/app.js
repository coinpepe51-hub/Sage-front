/* =========================================================
   SAGE JOURNAL
   FRONTEND APP
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

        throw new Error(
            data?.error ||
            data?.message ||
            `Request failed (${response.status})`
        );

    }


    return data;

}


/* =========================================================
   AUTH STATE
   ========================================================= */

async function checkAuthentication() {

    const token =
        getAuthToken();


    /*
     * No token:
     * show login immediately.
     */
    if (!token) {

        showAuth();

        return false;

    }


    /*
     * Token exists.
     * Verify it against Render/backend.
     */
    try {

        const data =
            await apiRequest(
                "/auth/me"
            );


        if (
            !data?.user
        ) {

            throw new Error(
                "Invalid authentication response"
            );

        }


        localStorage.setItem(
            "sageJournalUser",
            JSON.stringify(
                data.user
            )
        );


        showApp();


        return true;

    } catch (error) {

        console.warn(
            "Authentication check failed:",
            error
        );


        clearAuth();

        showAuth();


        return false;

    }

}


/* =========================================================
   AUTH UI
   ========================================================= */

function showAuth() {

    document.body.classList.remove(
        "auth-loading"
    );

    document.body.classList.remove(
        "show-app"
    );

    document.body.classList.add(
        "show-auth"
    );

}


function showApp() {

    document.body.classList.remove(
        "auth-loading"
    );

    document.body.classList.remove(
        "show-auth"
    );

    document.body.classList.add(
        "show-app"
    );


    initializeNavigation();

    initializeUser();

    initializeLogout();

    initializeDashboard();

}


/* =========================================================
   SWITCH LOGIN / REGISTER
   ========================================================= */

function showLoginView() {

    const login =
        document.getElementById(
            "loginView"
        );

    const register =
        document.getElementById(
            "registerView"
        );


    if (login) {

        login.classList.add(
            "active"
        );

    }


    if (register) {

        register.classList.remove(
            "active"
        );

    }


    const loginError =
        document.getElementById(
            "loginError"
        );


    const registerError =
        document.getElementById(
            "registerError"
        );


    if (loginError) {
        loginError.textContent = "";
    }


    if (registerError) {
        registerError.textContent = "";
    }

}


function showRegisterView() {

    const login =
        document.getElementById(
            "loginView"
        );

    const register =
        document.getElementById(
            "registerView"
        );


    if (login) {

        login.classList.remove(
            "active"
        );

    }


    if (register) {

        register.classList.add(
            "active"
        );

    }


    const loginError =
        document.getElementById(
            "loginError"
        );


    const registerError =
        document.getElementById(
            "registerError"
        );


    if (loginError) {
        loginError.textContent = "";
    }


    if (registerError) {
        registerError.textContent = "";
    }

}


/* =========================================================
   AUTH INITIALIZATION
   ========================================================= */

function initializeAuthUI() {

    const showRegister =
        document.getElementById(
            "showRegister"
        );


    const showLogin =
        document.getElementById(
            "showLogin"
        );


    if (showRegister) {

        showRegister.addEventListener(
            "click",
            showRegisterView
        );

    }


    if (showLogin) {

        showLogin.addEventListener(
            "click",
            showLoginView
        );

    }


    initializeLogin();

    initializeRegister();

}


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


            if (
                !email ||
                !password
            ) {

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

                    button.disabled =
                        true;

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
                 * No page redirect.
                 * Just show the dashboard.
                 */
                showApp();


            } catch (err) {

                console.error(
                    "Login error:",
                    err
                );


                if (error) {

                    error.textContent =
                        err.message;

                }


            } finally {

                if (button) {

                    button.disabled =
                        false;

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


            if (
                password.length < 8
            ) {

                if (error) {

                    error.textContent =
                        "Password must be at least 8 characters.";

                }

                return;

            }


            const button =
                form.querySelector(
                    'button[type="submit"]'
                );


            try {

                if (button) {

                    button.disabled =
                        true;

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


                if (!data?.token) {

                    throw new Error(
                        "Account was created but no authentication token was returned."
                    );

                }


                /*
                 * Save the JWT returned by
                 * the deployed Render backend.
                 */
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
                 * No redirect.
                 * New account immediately enters
                 * the dashboard.
                 */
                showApp();


            } catch (err) {

                console.error(
                    "Registration error:",
                    err
                );


                if (error) {

                    error.textContent =
                        err.message;

                }


            } finally {

                if (button) {

                    button.disabled =
                        false;

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
        sidebar &&
        !mobileMenu.dataset.initialized
    ) {

        mobileMenu.dataset.initialized =
            "true";


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
                "index.html"
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
        user.email
            ?.split("@")[0] ||
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


    if (
        !button ||
        button.dataset.initialized
    ) {

        return;

    }


    button.dataset.initialized =
        "true";


    button.addEventListener(
        "click",
        () => {

            clearAuth();

            showAuth();

            showLoginView();

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

        /*
         * If the deployed backend says the
         * token is invalid, return to auth.
         */
        if (
            String(
                error.message || ""
            ).toLowerCase()
                .includes(
                    "token"
                )
        ) {

            clearAuth();

            showAuth();

        }

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
            ? (
                wins.length /
                total *
                100
            )
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
            .slice(
                0,
                8
            );


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
   CHART STATE
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
        Number(
            value || 0
        )
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
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initializeAuthUI();

        await checkAuthentication();

    }
);


/* =========================================================
   GLOBAL API
   ========================================================= */

window.SageJournal = {

    apiRequest,

    getAuthToken,

    saveAuthToken,

    clearAuth,

    getCurrentUser

};
