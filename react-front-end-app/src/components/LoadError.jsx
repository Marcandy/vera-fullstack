import styles from "./LoadError.module.css";

// One shape for "we could not load this", so nine screens cannot each invent
// their own wording for the same failure.
//
// Deliberately distinct from a not-found state. A visit that does not exist
// is an answer; a request that failed is the absence of an answer, and the
// difference matters to the person reading it: one means look somewhere
// else, the other means try again.
//
// Retry exists because the alternative is telling someone to reload the
// browser, which throws away everything else on the page to re-run one
// request.
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
