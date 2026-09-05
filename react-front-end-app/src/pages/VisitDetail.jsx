import { useParams, Link } from 'react-router';
import StatusPill from '../components/StatusPill';
import { getVisitById } from '../services/visitService';
import { formatDateTime, formatTime, formatLocation } from '../utils/format';
import { VISIT_STATUS } from '../utils/status';
import LoadError from '../components/LoadError';
import { useAsyncData } from '../hooks/useAsyncData';
import styles from './VisitDetail.module.css';

// Evidence fields checked for the needs-review panel, in pipeline order.
// patientConcern is deliberately absent — null there is normal, not missing.
const EVIDENCE_LABELS = [
    { field: 'checkInTime', label: 'Check-in time' },
    { field: 'checkOutTime', label: 'Check-out time' },
    { field: 'assessment', label: 'Visit assessment' },
    { field: 'signature', label: 'Patient signature' },
];

const VisitDetail = () => {
    const { visitId } = useParams();

    const { data: visit, error: loadError, loading, reload } = useAsyncData(
        (signal) => getVisitById(Number(visitId), { signal }), [visitId]);

    if (loading) return (<p>Loading...</p>);

    // Checked before the not-found branch on purpose. A failed request also
    // leaves visit as null, and telling someone the visit does not exist when
    // the truth is that we could not ask is a different, wrong answer.
    if (loadError) return (
        <LoadError
            message={`This visit could not load. ${loadError.message}`}
            onRetry={reload}
        />
    );

    if (!visit) return (<p>Visit not found. <Link to="/visits">Back to visits</Link></p>);

    const missingEvidence = EVIDENCE_LABELS.filter(({ field }) => visit[field] === null);

    return (
        <section className={styles.visitDetail}>
            <Link to="/visits" className={styles.backLink}>← Back to visits</Link>

            <div className={styles.headerRow}>
                <h3>
                    <Link to={`/patients/${visit.patientId}`} className={styles.patientLink}>
                        {visit.patientName}
                    </Link>
                </h3>
                <StatusPill status={visit.status} />
                <Link to={`/caregiver/visits/${visit.id}`} className={styles.caregiverFlowLink}>
                    Caregiver flow →
                </Link>
            </div>

            {visit.status === VISIT_STATUS.NEEDS_REVIEW && (
                <div className={styles.missingPanel}>
                    <h4>Missing evidence</h4>
                    <ul>
                        {missingEvidence.map(({ field, label }) => (
                            <li key={field}>{label}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className={styles.card}>
                <dl>
                    <dt>Caregiver</dt>
                    <dd>{visit.caregiverName}</dd>

                    <dt>Service</dt>
                    <dd>{visit.serviceType}</dd>

                    <dt>Appointment</dt>
                    <dd>{formatDateTime(visit.appointmentTime)}</dd>

                    <dt>Check-in</dt>
                    <dd>{formatTime(visit.checkInTime)}</dd>

                    <dt>Check-out</dt>
                    <dd>{formatTime(visit.checkOutTime)}</dd>

                    <dt>Check-in location</dt>
                    <dd>{formatLocation(visit.checkInLocation)}</dd>
                </dl>
            </div>

            {visit.assessment && (
                <div className={styles.card}>
                    <h4>Assessment</h4>
                    <p>{visit.assessment}</p>
                </div>
            )}

            {visit.patientConcern && (
                <div className={styles.card}>
                    <h4>Patient concern</h4>
                    <p>{visit.patientConcern}</p>
                </div>
            )}

            {visit.signature && (
                <div className={styles.signatureBox}>
                    <h4>Patient signature</h4>
                    <p className={styles.signatureName}>{visit.signature}</p>
                </div>
            )}
        </section>
    );
};

export default VisitDetail;
