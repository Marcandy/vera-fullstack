import { useState } from "react";
import styles from "./Homepage.module.css";
import veraMark from "../assets/vera-mark.png";
import { Navigate, useLocation, useNavigate } from "react-router";
import Footer from "../components/Footer";
import LoadError from "../components/LoadError";
import { useSession } from "../context/sessionContext";
import { hasRole, ROLES } from "../utils/roles";

const signInDestination = (user, from) => {
    const home = hasRole(user, ROLES.ADMIN) ? "/dashboard" : "/my-visits";
    return typeof from?.pathname === "string" && from.pathname !== "/"
        && from.pathname.startsWith("/") && !from.pathname.startsWith("//")
        ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}` : home;
};

const Homepage = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [signingIn, setSigningIn] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading, sessionError, retrySession, login } = useSession();

    async function handleLogin(e) {
        e.preventDefault();
        if (signingIn) return;
        setError(null);
        setSigningIn(true);
        try {
            // Route off the returned user; the context's `user` is still null in this closure.
            const signedIn = await login(email, password);
            // Back to the page that sent them here, if a protected link did.
            navigate(signInDestination(signedIn, location.state?.from), { replace: true, state: null });
        } catch (err) {
            setError(err.message);
        } finally {
            setSigningIn(false);
        }
    }

    if (loading) return <p>Checking your session...</p>;
    if (sessionError) return <LoadError message={sessionError} onRetry={retrySession} />;
    if (user) {
        return <Navigate to={signInDestination(user, location.state?.from)} replace state={null} />;
    }

    return (
        <div className={styles.page}>
            {/* Alt describes the graphic so a screen reader does not read "Vera" twice. */}
            <img
                className={styles.watermark}
                src={veraMark}
                alt="The Vera mark: a checkmark inside a rounded outline"
            />
            <h1 className={styles.brand}>Vera</h1>

            <section className={styles.home}>
                <div className={styles.intro}>
                    <h2 className={styles.title}>Verified Care</h2>
                    <p className={styles.lead}>
                        Vera is a workspace for small home care agencies. Caregivers
                        check in at the patient's home, complete a short assessment,
                        and capture the patient's signature. Every verified visit
                        becomes a billing-ready record, with no chasing paperwork.
                    </p>
                </div>

                <form className={styles.loginCard} onSubmit={handleLogin}>
                    <h3 className={styles.loginTitle}>Sign in</h3>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className={styles.fieldInput}
                            placeholder="denise@agency.com"
                            autoComplete="email"
                            value={email}
                            onChange={(e)=> setEmail(e.target.value)}
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className={styles.fieldInput}
                            placeholder="Password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e)=> setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className={styles.errorNote} role="alert">{error}</p>}

                    <button type="submit" className={styles.signInButton} disabled={signingIn}>
                        {signingIn ? "Signing in..." : "Sign In"}
                    </button>
                    <p className={styles.demoNote}>
                        Demo app with fake data. Use <strong>denise@agency.com</strong> for
                        the administrator view or <strong>marcus@agency.com</strong> for
                        the caregiver view, with the demo password you were given.
                    </p>
                </form>
            </section>

            <Footer />
        </div>
    );
};

export default Homepage;
