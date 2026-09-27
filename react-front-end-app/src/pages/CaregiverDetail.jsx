import { useState } from "react";
import { useParams, Link } from "react-router";
import StatusPill from "../components/StatusPill";
import SignatureField from "../components/SignatureField";
import LoadError from "../components/LoadError";
import { acceptDocumentSubmission, getCaregiverById, signDocument, uploadDocument } from "../services/caregiverService";
import { getVisitsByCaregiver } from "../services/visitService";
import { documentStatus, isClearedToWork, daysUntil, hasPendingSubmission, RENEWAL_WINDOW_DAYS } from "../utils/documents";
import { DOCUMENT_STATUS } from "../utils/status";
import { formatDate, formatDateTime, formatFileSize } from "../utils/format";
import { useNow } from "../hooks/useNow";
import { useAsyncData } from "../hooks/useAsyncData";
import styles from "./CaregiverDetail.module.css";

const byMostRecent = (a, b) => b.appointmentTime.localeCompare(a.appointmentTime);

const STATUS_NOTE = {
    [DOCUMENT_STATUS.PENDING]: "Not received yet",
    [DOCUMENT_STATUS.EXPIRED]: "Lapsed. This is what is blocking clearance",
    [DOCUMENT_STATUS.EXPIRING]: `Still valid, renew within ${RENEWAL_WINDOW_DAYS} days`,
};

const dayPhrase = (days) => {
    const count = Math.abs(days);
    const unit = count === 1 ? "day" : "days";

    return days >= 0 ? `in ${count} ${unit}` : `${count} ${unit} ago`;
};

// End of day: a card that expires on the 5th is valid through the 5th.
const endOfDay = (dateValue) =>
    dateValue ? new Date(`${dateValue}T23:59:59`).toISOString() : null;

const startOfDay = (dateValue) =>
    dateValue ? new Date(`${dateValue}T00:00:00`).toISOString() : null;

const CaregiverDetail = () => {
    const { caregiverId } = useParams();

    const { data, error: loadError, loading, reload, setData } = useAsyncData(
        (signal) => Promise.all([
            getCaregiverById(caregiverId, { signal }),
            getVisitsByCaregiver(caregiverId, { signal }),
        ]),
        [caregiverId]);

    const setCaregiver = (updated) =>
        setData(([, theirVisits]) => [updated, theirVisits]);

    const now = useNow();

    // One open form at a time, so the wrong row cannot be signed.
    const [openForm, setOpenForm] = useState(null);
    const [signatureValue, setSignatureValue] = useState("");
    const [file, setFile] = useState(null);
    const [issuedOn, setIssuedOn] = useState("");
    const [expiresOn, setExpiresOn] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    const closeForm = () => {
        setOpenForm(null);
        setSignatureValue("");
        setFile(null);
        setIssuedOn("");
        setExpiresOn("");
        setFormError(null);
    };

    const openFormFor = (documentId, mode) => {
        closeForm();
        setOpenForm({ documentId, mode });
    };

    async function handleSign(documentId) {
        setFormError(null);
        setSubmitting(true);
        try {
            const updated = await signDocument(caregiverId, documentId, signatureValue);
            setCaregiver(updated);
            closeForm();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleAccept(documentId) {
        setFormError(null);
        setSubmitting(true);
        try {
            setCaregiver(await acceptDocumentSubmission(caregiverId, documentId));
            closeForm();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleUpload(documentId) {
        setFormError(null);
        setSubmitting(true);
        try {
            // Only metadata is sent; nothing stores the file.
            const updated = await uploadDocument(caregiverId, documentId, {
                fileName: file?.name,
                fileSize: file?.size,
                fileType: file?.type,
                issuedAt: startOfDay(issuedOn),
                expiresAt: endOfDay(expiresOn),
            });
            setCaregiver(updated);
            closeForm();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return (<p>Loading...</p>);

    const [caregiver, visitList] = data ?? [null, []];

    // Before not found: a failed request also leaves caregiver null.
    if (loadError) return (
        <LoadError
            message={`This caregiver record could not load. ${loadError.message}`}
            onRetry={reload}
        />
    );

    if (!caregiver) return (
        <p>Caregiver not found. <Link to="/caregivers">Back to caregivers</Link></p>
    );

    const cleared = isClearedToWork(caregiver, now);
    const history = [...visitList].sort(byMostRecent);

    return (
        <section className={styles.caregiverDetail}>
            <Link to="/caregivers" className={styles.backLink}>← Back to caregivers</Link>

            <div className={styles.titleRow}>
                <h3 className={styles.title}>{caregiver.name}</h3>
                <span className={cleared ? styles.clearedBadge : styles.notClearedBadge}>
                    {cleared ? "Cleared to work" : "Not cleared to work"}
                </span>
            </div>

            <div className={styles.card}>
                <dl>
                    <dt>Phone</dt>
                    <dd>{caregiver.phone}</dd>
                </dl>
            </div>

            <h4 className={styles.sectionTitle}>Onboarding documents</h4>

            <ul className={styles.docList}>
                {caregiver.documents.map((document) => {
                    const status = documentStatus(document, now);
                    const isOpen = openForm?.documentId === document.id;
                    const canSign = status === DOCUMENT_STATUS.PENDING;
                    const needsRenewal =
                        status === DOCUMENT_STATUS.EXPIRED || status === DOCUMENT_STATUS.EXPIRING;
                    const days = document.expiresAt ? daysUntil(document.expiresAt, now) : null;

                    return (
                        <li key={document.id} className={styles.docRow}>
                            <div className={styles.docHeader}>
                                <span className={styles.docName}>{document.name}</span>
                                <StatusPill status={status} />
                            </div>

                            <dl className={styles.docFacts}>
                                <div className={styles.fact}>
                                    <dt>Received</dt>
                                    <dd>{document.receivedAt ? formatDate(document.receivedAt) : "Not received"}</dd>
                                </div>
                                <div className={styles.fact}>
                                    <dt>Issued</dt>
                                    <dd>{formatDate(document.issuedAt)}</dd>
                                </div>
                                <div className={styles.fact}>
                                    <dt>Expires</dt>
                                    <dd>
                                        {document.expiresAt ? (
                                            <>
                                                {formatDate(document.expiresAt)}
                                                <span className={styles.dayCount}>
                                                    {` (${dayPhrase(days)})`}
                                                </span>
                                            </>
                                        ) : status === DOCUMENT_STATUS.PENDING ? (
                                            // Nothing received, so nothing to say about expiry.
                                            "Not recorded"
                                        ) : (
                                            "Does not expire"
                                        )}
                                    </dd>
                                </div>
                            </dl>

                            {STATUS_NOTE[status] && (
                                <p className={status === DOCUMENT_STATUS.EXPIRED ? styles.blockNote : styles.statusNote}>
                                    {STATUS_NOTE[status]}
                                </p>
                            )}

                            {document.signature && (
                                <p className={styles.signedLine}>
                                    Signed <span className={styles.signedName}>{document.signature}</span>
                                </p>
                            )}

                            {document.fileName && (
                                <p className={styles.fileLine}>
                                    {document.fileName}
                                    {Number.isFinite(document.fileSize) && (
                                        <span className={styles.fileMeta}> · {formatFileSize(document.fileSize)}</span>
                                    )}
                                </p>
                            )}

                            {hasPendingSubmission(document) && (
                                <div className={styles.submissionCard}>
                                    <p className={styles.submissionText}>
                                        <strong>{caregiver.name} sent in a renewal</strong> on{" "}
                                        {formatDate(document.submission.submittedAt)}:{" "}
                                        {document.submission.fileName}
                                        {document.submission.expiresAt &&
                                            `, expiring ${formatDate(document.submission.expiresAt)}`}.
                                    </p>
                                    <button
                                        type="button"
                                        className={styles.primaryButton}
                                        onClick={() => handleAccept(document.id)}
                                        disabled={submitting}
                                    >
                                        {submitting ? "Accepting..." : "Accept renewal"}
                                    </button>
                                </div>
                            )}

                            <div className={styles.rowActions}>
                                {canSign && (
                                    <button
                                        type="button"
                                        className={styles.secondaryButton}
                                        onClick={() => openFormFor(document.id, "sign")}
                                    >
                                        Sign
                                    </button>
                                )}
                                {(canSign || needsRenewal) && (
                                    <button
                                        type="button"
                                        className={styles.secondaryButton}
                                        onClick={() => openFormFor(document.id, "upload")}
                                    >
                                        {needsRenewal ? "Record renewal" : "Record document"}
                                    </button>
                                )}
                            </div>

                            {isOpen && openForm.mode === "sign" && (
                                <div className={styles.form}>
                                    <SignatureField
                                        id={`sign-${document.id}`}
                                        label={`Signature for ${document.name}`}
                                        value={signatureValue}
                                        onChange={setSignatureValue}
                                    />
                                    {formError && <p className={styles.errorNote}>{formError}</p>}
                                    <div className={styles.formActions}>
                                        <button
                                            type="button"
                                            className={styles.primaryButton}
                                            onClick={() => handleSign(document.id)}
                                            disabled={submitting}
                                        >
                                            {submitting ? "Capturing..." : "Capture signature"}
                                        </button>
                                        <button type="button" className={styles.cancelButton} onClick={closeForm}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isOpen && openForm.mode === "upload" && (
                                <div className={styles.form}>
                                    <div className={styles.field}>
                                        <label className={styles.fieldLabel} htmlFor={`file-${document.id}`}>
                                            Document file
                                        </label>
                                        <input
                                            id={`file-${document.id}`}
                                            type="file"
                                            className={styles.fileInput}
                                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                        />
                                    </div>

                                    <div className={styles.dateRow}>
                                        <div className={styles.field}>
                                            <label className={styles.fieldLabel} htmlFor={`issued-${document.id}`}>
                                                Issued
                                            </label>
                                            <input
                                                id={`issued-${document.id}`}
                                                type="date"
                                                className={styles.fieldInput}
                                                value={issuedOn}
                                                onChange={(e) => setIssuedOn(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.field}>
                                            <label className={styles.fieldLabel} htmlFor={`expires-${document.id}`}>
                                                Expires
                                            </label>
                                            <input
                                                id={`expires-${document.id}`}
                                                type="date"
                                                className={styles.fieldInput}
                                                value={expiresOn}
                                                onChange={(e) => setExpiresOn(e.target.value)}
                                            />
                                            <span className={styles.fieldHint}>
                                                Leave blank if it never expires
                                            </span>
                                        </div>
                                    </div>

                                    <p className={styles.honestyNote}>
                                        The file itself is not stored. This demo records its
                                        name, size and type only, which are the details the
                                        office needs to know it arrived.
                                    </p>

                                    {formError && <p className={styles.errorNote}>{formError}</p>}

                                    <div className={styles.formActions}>
                                        <button
                                            type="button"
                                            className={styles.primaryButton}
                                            onClick={() => handleUpload(document.id)}
                                            disabled={submitting}
                                        >
                                            {submitting ? "Saving..." : "Save record"}
                                        </button>
                                        <button type="button" className={styles.cancelButton} onClick={closeForm}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>

            <h4 className={styles.sectionTitle}>Visit history</h4>
            {history.length === 0 ? (
                <p className={styles.emptyState}>
                    No visits assigned to this caregiver yet.
                </p>
            ) : (
                <ul className={styles.historyList}>
                    {history.map((visit) => (
                        <li key={visit.id} className={styles.historyRow}>
                            <Link to={`/visits/${visit.id}`} className={styles.historyLink}>
                                {visit.patientName}
                            </Link>
                            <span className={styles.historyMeta}>
                                {formatDateTime(visit.appointmentTime)}
                            </span>
                            <StatusPill status={visit.status} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default CaregiverDetail;
