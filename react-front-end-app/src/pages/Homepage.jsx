import { useState } from "react";
import styles from "./Homepage.module.css";
import { useNavigate } from "react-router";
import Footer from "../components/Footer";
import { useSession } from "../context/sessionContext";
import { hasRole, ROLES } from "../utils/roles";

const Homepage = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [signingIn, setSigningIn] = useState(false);

    const navigate = useNavigate();
    const { login } = useSession();

    async function handleLogin(e) {
        e.preventDefault();
        setError(null);
        setSigningIn(true);
        try {
            // Route off the returned user, not off the context's `user`.
            // That one is still null in this closure: setState scheduled it,
            // it did not rewrite the variable this render already captured.
            const signedIn = await login(email, password);
            navigate(hasRole(signedIn, ROLES.ADMIN) ? "/dashboard" : "/my-visits");
        } catch (err) {
            setError(err.message);
        } finally {
            setSigningIn(false);
        }
    }
    return (
        <div className={styles.page}>
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
                    {error && <p className={styles.errorNote}>{error}</p>}

                    <button type="submit" className={styles.signInButton} disabled={signingIn}>
                        {signingIn ? "Signing in..." : "Sign In"}
                    </button>
                    <p className={styles.demoNote}>
                        Demo app: sign-in is simulated and the password is not
                        checked. Use <strong>denise@agency.com</strong> for the
                        administrator view or <strong>marcus@agency.com</strong> for
                        the caregiver view, with any password.
                    </p>
                </form>
            </section>

            <Footer />
        </div>
    );
};

export default Homepage;
