import styles from './StatusPill.module.css'
import { VISIT_STATUS, DOCUMENT_STATUS, VISIT_STATUS_LABEL, DOCUMENT_STATUS_LABEL } from '../utils/status'

// One pill renders both vocabularies, so it reads from both label maps. They
// cannot collide: the two sets of identifiers share no value.
const STATUS_LABELS = { ...VISIT_STATUS_LABEL, ...DOCUMENT_STATUS_LABEL }

const STATUS_CLASSES = {
    [VISIT_STATUS.SCHEDULED]: styles.scheduled,
    [VISIT_STATUS.IN_PROGRESS]: styles.inProgress,
    [VISIT_STATUS.NEEDS_REVIEW]: styles.needsReview,
    [VISIT_STATUS.READY_TO_BILL]: styles.readyToBill,
    [VISIT_STATUS.BILLED]: styles.billed,
    [DOCUMENT_STATUS.SIGNED]: styles.signed,
    [DOCUMENT_STATUS.PENDING]: styles.pending,
    [DOCUMENT_STATUS.EXPIRING]: styles.expiring,
    [DOCUMENT_STATUS.EXPIRED]: styles.expired,
}

const StatusPill = ({ status }) => {
    return (
                                        //if undefined give empty give '' as class 
        <span className={`${styles.statusPill} ${STATUS_CLASSES[status] ?? ""}`}>
           {STATUS_LABELS[status] ?? status}
        </span>
    )
}

export default StatusPill;