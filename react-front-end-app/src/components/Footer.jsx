import { Link } from "react-router";
import styles from "./Footer.module.css";


const Footer = () => {
    return (
        <footer className={styles.footer}>
            <span>© {new Date().getFullYear()} Vera. An EVV-inspired portfolio demo; all data is fictional.</span>

            <nav className={styles.footerLinks}>
                <Link to="/about" className={styles.footerLink}>About</Link>
                <a
                    className={styles.footerLink}
                    href="https://www.medicaid.gov/medicaid/home-community-based-services/guidance/electronic-visit-verification-evv/index.html"
                    target="_blank"
                    rel="noreferrer"
                >
                    What is EVV?
                </a>
            </nav>
        </footer>
    );
}

export default Footer;