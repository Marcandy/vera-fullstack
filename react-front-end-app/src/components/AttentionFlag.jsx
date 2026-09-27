import styles from "./AttentionFlag.module.css";

// Not a StatusPill: a missing event is not a position in the pipeline.
const AttentionFlag = ({ attention }) => {
    if (!attention) return null;

    return (
        <span className={styles.attentionFlag}>
            <span aria-hidden="true" className={styles.mark}>!</span>
            {attention}
        </span>
    );
};

export default AttentionFlag;
