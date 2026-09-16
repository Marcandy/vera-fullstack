import { useState } from "react";
import { useParams, Link } from 'react-router';
import StatusPill from '../components/StatusPill';
import { cancelVisit, getVisitById, rescheduleVisit } from '../services/visitService';
import { getCaregivers } from '../services/caregiverService';
import { formatDateTime, formatTime, formatLocation } from '../utils/format';
import { VISIT_STATUS } from '../utils/status';
import { SERVICE_TYPE_LABEL } from '../utils/serviceType';
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

const pad = (value) => String(value).padStart(2, "0");

const toDatetimeLocal = (iso) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const ScheduledVisitActions = ({ visit, caregivers, onSaved }) => {
    const [appointmentLocal, setAppointmentLocal] = useState(
        toDatetimeLocal(visit.appointmentTime));
    const [caregiverId, setCaregiverId] = useState(String(visit.caregiverId));
    const [saving, setSaving] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [actionError, setActionError] = useState(null);
    const busy = saving || cancelling;

    async function handleReschedule(event) {
        event.preventDefault();
        setActionError(null);
        setSaving(true);
        try {
            const updated = await rescheduleVisit(visit.id, {
                appointmentTime: new Date(appointmentLocal).toISOString(),
                caregiverId: Number(caregiverId),
            });
            onSaved(updated);
        } catch (error) {
            setActionError(error.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleCancel() {
        setActionError(null);
        setCancelling(true);
        try {
            const updated = await cancelVisit(visit.id);
            onSaved(updated);
        } catch (error) {
            setActionError(error.message);
        } finally {
            setCancelling(false);
        }
    }

    return (
        <form className={styles.card} onSubmit={handleReschedule}>
            <h4>Reschedule or cancel</h4>
            <fieldset className={styles.officeFields} disabled={busy} aria-label="Scheduled visit actions">
                <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="visit-appointment">Appointment</label>
                    <input
                        id="visit-appointment"
                        type="datetime-local"
                        className={styles.fieldInput}
                        required
                        value={appointmentLocal}
                        onChange={(event) => setAppointmentLocal(event.target.value)}
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="visit-caregiver">Caregiver</label>
                    <select
                        id="visit-caregiver"
                        className={styles.fieldInput}
                        required
                        value={caregiverId}
                        onChange={(event) => setCaregiverId(event.target.value)}
                    >
                        {caregivers.map((caregiver) => (
                            <option key={caregiver.id} value={caregiver.id}>
                                {caregiver.name}
                            </option>
                        ))}
                    </select>
                </div>
            </fieldset>
            {actionError && <p className={styles.errorNote} role="alert">{actionError}</p>}
            <div className={styles.officeActions}>
                <button type="submit" className={styles.saveButton} disabled={busy}>
                    {saving ? "Saving..." : "Save changes"}
                </button>
                <button type="button" className={styles.cancelVisitButton} onClick={handleCancel} disabled={busy}>
                    {cancelling ? "Cancelling..." : "Cancel visit"}
                </button>
            </div>
        </form>
    );
};

const VisitDetail = () => {
    const { visitId } = useParams();

    const { data: visit, error: loadError, loading, reload, setData } = useAsyncData(
        (signal) => getVisitById(Number(visitId), { signal }), [visitId]);

    const { data: caregiverList } = useAsyncData(() => getCaregivers(), []);

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
                    <dd>{SERVICE_TYPE_LABEL[visit.serviceType] ?? visit.serviceType}</dd>

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

            {visit.status === VISIT_STATUS.SCHEDULED && (
                <ScheduledVisitActions
                    key={`${visit.id}-${visit.appointmentTime}-${visit.caregiverId}`}
                    visit={visit}
                    caregivers={caregiverList ?? []}
                    onSaved={setData}
                />
            )}

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
