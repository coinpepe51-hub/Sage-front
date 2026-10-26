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
   PAGE DETECTION
   ========================================================= */

function getCurrentPage() {

    const pathname =
        window.location.pathname
            .replace(/\/+$/, "");

    const last =
        pathname.split("/").pop() || "";


    if (
        last === "" ||
        last === "index" ||
        last === "index.html"
    ) {

        return "index.html";

    }


    if (
        last === "login" ||
        last === "login.html"
    ) {

        return "login.html";

    }


    if (
        last === "register" ||
        last === "register.html"
    ) {

        return "register.html";

    }


    return last;

}


const currentPage =
    getCurrentPage();


const publicPages = [
    "login.html",
    "register.html"
];


function isPublicPage() {

    return publicPages.includes(
        getCurrentPage()
    );

}


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

            /*
             * Do not redirect from login/register.
             * This prevents the auth-page loop.
             */
            if (
                !isPublicPage()
            ) {

                window.location.replace(
                    "./login.html"
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
   VERIFY LOGIN
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


        if (data?.user) {

            localStorage.setItem(
                "sageJournalUser",
                JSON.stringify(
                    data.user
                )
            );

        }


        return true;

    } catch {

        clearAuth();

        return false;

    }

}


/* =========================================================
   AUTH INITIALIZATION
   ========================================================= */

async function initializeAuth() {

    const page =
        getCurrentPage();


    const publicPage =
        publicPages.includes(
            page
        );


    /*
     * Never allow dashboard content
     * to flash while checking auth.
     */
    if (!publicPage) {

        document.documentElement.classList.add(
            "auth-checking"
        );

        document.body.classList.add(
            "auth-loading"
        );

    }


    const token =
        getAuthToken();


    /*
     * LOGIN / REGISTER
     */
    if (publicPage) {

        /*
         * No token:
         * stay on auth page.
         */
        if (!token) {

            document.body.classList.remove(
                "auth-loading"
            );

            document.documentElement.classList.remove(
                "auth-checking"
            );

            initializePublicPage();

            return;

        }


        /*
         * Token exists.
         * Verify it before redirecting.
         */
        const valid =
            await verifyAuthentication();


        if (valid) {

            window.location.replace(
                "./index.html"
            );

            return;

        }


        /*
         * Invalid/expired token.
         * Clear it and remain on auth page.
         */
        clearAuth();

        document.body.classList.remove(
            "auth-loading"
        );

        document.documentElement.classList.remove(
            "auth-checking"
        );

        initializePublicPage();

        return;

    }


    /*
     * PROTECTED PAGE
     */
    if (!token) {

        window.location.replace(
            "./login.html"
        );

        return;

    }


    const valid =
        await verifyAuthentication();


    if (!valid) {

        window.location.replace(
            "./login.html"
        );

        return;

    }


    document.body.classList.remove(
        "auth-loading"
    );

    document.body.classList.add(
        "authenticated"
    );

    document.documentElement.classList.remove(
        "auth-checking"
    );


    initializeProtectedPage();

}


/* =========================================================
   PUBLIC PAGE
   ========================================================= */

function initializePublicPage() {

    const page =
        getCurrentPage();


    if (
        page === "login.html"
    ) {

        initializeLogin();

    }


    if (
        page === "register.html"
    ) {

        initializeRegister();

    }

}


/* =========================================================
   PROTECTED PAGE
   ========================================================= */

function initializeProtectedPage() {

    initializeNavigation();

    initializeUser();

    initializeLogout();

    initializeTradeForm();

    initializeDashboard();

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


    /*
     * Prevent duplicate event listeners.
     */
    if (
        form.dataset.initialized === "true"
    ) {

        return;

    }


    form.dataset.initialized =
        "true";


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
                    .trim()
                    .toLowerCase();


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

                error.textContent =
                    "";

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
                 * Full page navigation ensures
                 * index.html gets its auth check.
                 */
                window.location.replace(
                    "./index.html"
                );

            } catch (errorObject) {

                if (error) {

                    error.textContent =
                        errorObject.message;

                }


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


    if (
        form.dataset.initialized === "true"
    ) {

        return;

    }


    form.dataset.initialized =
        "true";


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
                    .trim()
                    .toLowerCase();


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

                error.textContent =
                    "";

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


                window.location.replace(
                    "./index.html"
                );

            } catch (errorObject) {

                if (error) {

                    error.textContent =
                        errorObject.message;

                }


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
   START
   ========================================================= */

initializeAuth();
