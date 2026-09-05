import styles from "./AttentionFlag.module.css";

// Deliberately NOT a StatusPill, and the distinction is the point. A status
// pill states where a visit sits in the pipeline. This states that something
// expected has not happened yet. Reusing the pill would quietly enrol these
// into the status vocabulary, and then "late check-in" starts looking like a
// status you could transition to, which it is not.
//
// Different shape, different colour, and it always carries its words, so it
// never signals by colour alone.
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
