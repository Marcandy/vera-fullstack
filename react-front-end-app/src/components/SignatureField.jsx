import styles from "./SignatureField.module.css";


const SignatureField = ({ id, label, value, onChange, placeholder }) => {
    return (
        <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor={id}>
                {label}
            </label>
            <input
                id={id}
                type="text"
                autoComplete="off"
                className={styles.signatureInput}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    ); 
};

export default SignatureField;
