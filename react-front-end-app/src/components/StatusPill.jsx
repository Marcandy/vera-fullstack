import styles from './StatusPill.module.css'
import { VISIT_STATUS, DOCUMENT_STATUS } from '../utils/status'

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
           {status}
        </span>
    )
}

export default StatusPill;