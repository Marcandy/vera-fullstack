import { Link } from "react-router";
import styles from "./NotFound.module.css";

const NotFound = () => {

    return (
        <section className={styles.notFound}>
            <h3 className={styles.title}>Page not found</h3>
            <p className={styles.message}>
                Nothing lives at this address. Check the URL, or head back
                to the dashboard.
            </p>
            <Link to="/dashboard" className={styles.homeLink}>
                Back to Dashboard
            </Link>
        </section>
    );
}

export default NotFound;