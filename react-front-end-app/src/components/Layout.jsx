import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import styles from "./Layout.module.css";
import Footer from "./Footer";
import { useSession } from "../context/sessionContext";
import { hasRole, ROLES } from "../utils/roles";

const navLinkClass = ({ isActive }) =>
    isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;

const Layout = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const { user, loading, logout } = useSession();
    const navigate = useNavigate();

    const isAdmin = hasRole(user, ROLES.ADMIN);

    async function handleSignOut() {
        await logout();
        navigate("/");
    }

    return (
        <div className={styles.shell}>
            <header className={styles.banner}>
                <h1 className={styles.brand}>
                    {/* <svg className={styles.logo} viewBox="0 0 120 100" aria-hidden="true">
                        <path d="M 20 44 L 52 82" stroke="#2f9e44" strokeWidth="17" strokeLinecap="round" fill="none" />
                        <path d="M 52 82 L 100 14" stroke="#1971c2" strokeWidth="17" strokeLinecap="round" fill="none" />
                        <circle cx="52" cy="82" r="8" fill="#1971c2" />
                        <circle cx="52" cy="82" r="4.5" fill="#69db7c" />
                    </svg> */}
                    <svg className={styles.logo} viewBox="0 0 140 100" aria-hidden="true">
                        <rect x="8" y="18" width="124" height="64" rx="32" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="6" />
                        <path d="M 44 50 L 64 70" fill="none" stroke="#3dccc7" strokeWidth="11" strokeLinecap="round" />
                        <path d="M 64 70 L 102 32" fill="none" stroke="#820263" strokeWidth="11" strokeLinecap="round" />
                        <circle cx="64" cy="70" r="7" fill="#ffffff" />
                        <circle cx="64" cy="70" r="4" fill="#3dccc7" />
                    </svg>
                    Vera
                </h1>
                {!loading && user && (
                    <div className={styles.session}>
                        <span className={styles.sessionUser}>{user.name}</span>
                        <button
                            type="button"
                            className={styles.signOutButton}
                            onClick={handleSignOut}
                        >
                            Sign out
                        </button>
                    </div>
                )}

                <button
                    type="button"
                    className={styles.menuButton}
                    aria-label="Menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    ☰
                </button>
            </header>

            <aside className={menuOpen ? `${styles.sidebar} ${styles.open}` : styles.sidebar}>
                {/* clicking any link also closes the phone menu; no effect on desktop */}
                {/* Rendered only once the session is known. Guessing during the
                    unknown state would flash the admin nav at a caregiver. */}
                {!loading && (
                    <nav onClick={() => setMenuOpen(false)}>
                        {!user && (
                            <NavLink to="/" className={navLinkClass}>Sign in</NavLink>
                        )}
                        {user && isAdmin && (
                            <>
                                <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
                                <NavLink to="/visits" className={navLinkClass}>Visitlist</NavLink>
                                <NavLink to="/caregivers" className={navLinkClass}>Caregivers</NavLink>
                                <NavLink to="/patients" className={navLinkClass}>Patients</NavLink>
                                <NavLink to="/billing" className={navLinkClass}>Billing</NavLink>
                            </>
                        )}
                        {user && !isAdmin && (
                            <>
                                <NavLink to="/my-visits" className={navLinkClass}>My visits</NavLink>
                                <NavLink to="/my-documents" className={navLinkClass}>My documents</NavLink>
                            </>
                        )}
                    </nav>
                )}
            </aside>

            <main className={styles.content}>
                <Outlet />
            </main>

            <div className={styles.footerSlot}>
                <Footer />
            </div>
        </div>
    );
};

export default Layout;
