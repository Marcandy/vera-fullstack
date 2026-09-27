import StatusPill from './StatusPill';
import AttentionFlag from './AttentionFlag';
import { formatDateTime } from '../utils/format';
import { SERVICE_TYPE_LABEL } from '../utils/serviceType';
import styles from './VisitCard.module.css';

// No attention by default: a caller that does not know the time cannot call a visit late.
const VisitCard = ({ visit, attention = null, showCaregiver = true }) => {
    return (
        <article className={styles.visitCard}>
            <h4>{visit.patientName}</h4>
            <dl>
                {showCaregiver && (
                    <>
                        <dt>Caregiver</dt>
                        <dd>{visit.caregiverName}</dd>
                    </>
                )}

                <dt>Service</dt>
                <dd>{SERVICE_TYPE_LABEL[visit.serviceType] ?? visit.serviceType}</dd>

                <dt>Appointment</dt>
                <dd>{formatDateTime(visit.appointmentTime)}</dd>
            </dl>

            <div className={styles.badgeRow}>
                <StatusPill status={visit.status}/>
                <AttentionFlag attention={attention} />
            </div>
        </article>
    )
}

export default VisitCard;
