import StatusPill from './StatusPill';
import AttentionFlag from './AttentionFlag';
import { formatDateTime } from '../utils/format';
import styles from './VisitCard.module.css';

// attention is optional and defaults to nothing: a caller that does not know
// the time cannot claim a visit is late, and the card must not guess.
// showCaregiver defaults on, and is turned off in exactly one place: a
// caregiver's own list, where their name on every card is the one fact they
// already know and the scarcest thing on a phone is vertical space.
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
                <dd>{visit.serviceType}</dd>

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
