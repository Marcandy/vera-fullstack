import styles from "./LoadError.module.css";

// Distinct from not found: a failed request means try again, not look elsewhere.
const LoadError = ({ message, onRetry }) => (
    <div className={styles.loadError} role="alert">
        <p className={styles.message}>{message}</p>
        {onRetry && (
            <button type="button" className={styles.retryButton} onClick={onRetry}>
                Try again
            </button>
        )}
    </div>
);

export default LoadError;
