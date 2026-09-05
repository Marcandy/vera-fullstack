import { useEffect, useState } from "react";
import { Link } from "react-router";
import StatusPill from "../components/StatusPill";
import SignatureField from "../components/SignatureField";
import LoadError from "../components/LoadError";
import { getCaregiverById, signDocument, submitDocumentRenewal } from "../services/caregiverService";
import { documentStatus, isClearedToWork, daysUntil, hasPendingSubmission, RENEWAL_WINDOW_DAYS } from "../utils/documents";
import { DOCUMENT_STATUS } from "../utils/status";
import { formatDate, formatFileSize } from "../utils/format";
import { useSession } from "../context/sessionContext";
import { useNow } from "../hooks/useNow";
import styles from "./MyDocuments.module.css";

// What each status means to the person who has to do something about it. The
// office reads "expiring" as paperwork to chase; the caregiver reads it as an
// appointment to book. Same derived status, different sentence.
const STATUS_NOTE = {
    [DOCUMENT_STATUS.PENDING]: "The office has not received this yet.",
    [DOCUMENT_STATUS.EXPIRED]: "This has lapsed. It is what is stopping you being cleared.",
    [DOCUMENT_STATUS.EXPIRING]: `Still valid, but renew it within ${RENEWAL_WINDOW_DAYS} days.`,
};

const dayPhrase = (days) => {
    const count = Math.abs(days);
    const unit = count === 1 ? "day" : "days";

    return days >= 0 ? `in ${count} ${unit}` : `${count} ${unit} ago`;
};

const endOfDay = (dateValue) =>
    dateValue ? new Date(`${dateValue}T23:59:59`).toISOString() : null;

const startOfDay = (dateValue) =>
    dateValue ? new Date(`${dateValue}T00:00:00`).toISOString() : null;

const MyDocuments = () => {
    const { user, loading: sessionLoading } = useSession();

    // From the session, never from the URL. Identical reasoning to My visits:
    // /my-documents?caregiverId=3 would hand anyone a colleague's compliance
    // file, and the server-side version of that mistake is a controller
    // trusting a client-supplied actor instead of the principal.
    const caregiverId = user?.caregiverId ?? null;

    const [caregiver, setCaregiver] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    // Status is derived from the clock, so it ticks for the same reason the
    // visit flags do: a card does not stop expiring because a page is open.
    const now = useNow();

    const [openForm, setOpenForm] = useState(null);
    const [signatureValue, setSignatureValue] = useState("");
    const [file, setFile] = useState(null);
    const [issuedOn, setIssuedOn] = useState("");
    const [expiresOn, setExpiresOn] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (caregiverId === null) return;

        let stale = false;
        async function fetchCaregiver() {
            try {
                const found = await getCaregiverById(caregiverId);
                if (!stale) {
                    setCaregiver(found ?? null);
                    setLoadError(null);
                }
            } catch (err) {
                if (!stale) setLoadError(err.message);
            } finally {
                if (!stale) setLoading(false);
            }
        }
        fetchCaregiver();
        return () => { stale = true; };
    }, [caregiverId, reloadKey]);

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
            setCaregiver(await signDocument(caregiverId, documentId, signatureValue));
            closeForm();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleSend(documentId) {
        setFormError(null);
        setSubmitting(true);
        try {
            // Only the metadata leaves the browser, because only the metadata
            // has anywhere to go without a backend.
            setCaregiver(await submitDocumentRenewal(caregiverId, documentId, {
                fileName: file?.name,
                fileSize: file?.size,
                fileType: file?.type,
                issuedAt: startOfDay(issuedOn),
                expiresAt: endOfDay(expiresOn),
            }));
            closeForm();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (sessionLoading) return <p>Loading...</p>

    if (!user) {
        return (
            <section className={styles.myDocuments}>
                <h3>My documents</h3>
                <p className={styles.emptyState}>
                    Nobody is signed in. <Link to="/">Sign in</Link> to see your
                    documents.
                </p>
            </section>
        );
    }

    // An admin has no caregiver record, so there is no compliance file to show.
    if (caregiverId === null) {
        return (
            <section className={styles.myDocuments}>
                <h3>My documents</h3>
                <p className={styles.emptyState}>
                    This page belongs to a caregiver, and your account is not
                    linked to a caregiver record. The{" "}
                    <Link to="/caregivers">team roster</Link> has everyone's
                    documents.
                </p>
            </section>
        );
    }

    if (loadError) return (
        <LoadError
            message={`Your documents could not load. ${loadError}`}
            onRetry={() => { setLoading(true); setReloadKey((key) => key + 1); }}
        />
    );

    if (loading) return <p>Loading...</p>

    if (!caregiver) return (
        <p>No caregiver record found for your account.</p>
    );

    const cleared = isClearedToWork(caregiver, now);
    const blocking = caregiver.documents.filter((document) => {
        const status = documentStatus(document, now);
        return status === DOCUMENT_STATUS.PENDING || status === DOCUMENT_STATUS.EXPIRED;
    });

    return (
        <section className={styles.myDocuments}>
            <h3>My documents</h3>
            <p className={styles.subtitle}>Signed in as {user.name}</p>

            {/* The headline answer. Denise sees this on her roster; the person
                it is actually about could not see it anywhere until now. */}
            <div className={cleared ? styles.clearedBanner : styles.blockedBanner}>
                <strong>{cleared ? "You are cleared to work" : "You are not cleared to work"}</strong>
                {!cleared && (
                    <span>
                        {" "}
                        {blocking.length === 1 ? "One document is" : `${blocking.length} documents are`}{" "}
                        holding it: {blocking.map((document) => document.name).join(", ")}.
                    </span>
                )}
            </div>

            <ul className={styles.docList}>
                {caregiver.documents.map((document) => {
                    const status = documentStatus(document, now);
                    const isOpen = openForm?.documentId === document.id;
                    const canSign = status === DOCUMENT_STATUS.PENDING;
                    const needsRenewal =
                        status === DOCUMENT_STATUS.EXPIRED || status === DOCUMENT_STATUS.EXPIRING;
                    const pending = hasPendingSubmission(document);
                    const days = document.expiresAt ? daysUntil(document.expiresAt, now) : null;

                    return (
                        <li key={document.id} className={styles.docRow}>
                            <div className={styles.docHeader}>
                                <span className={styles.docName}>{document.name}</span>
                                <StatusPill status={status} />
                            </div>

                            {document.expiresAt ? (
                                <p className={styles.expiry}>
                                    Expires {formatDate(document.expiresAt)}
                                    <span className={styles.dayCount}> ({dayPhrase(days)})</span>
                                </p>
                            ) : status !== DOCUMENT_STATUS.PENDING && (
                                <p className={styles.expiry}>Does not expire</p>
                            )}

                            {/* Suppressed once something has been sent in: the
                                submission note below supersedes it, and
                                "the office has not received this" beside
                                "sent in on the 3rd" is a straight contradiction. */}
                            {!pending && STATUS_NOTE[status] && (
                                <p className={status === DOCUMENT_STATUS.EXPIRED ? styles.blockNote : styles.statusNote}>
                                    {STATUS_NOTE[status]}
                                </p>
                            )}

                            {/* Says plainly that sending it in is not the end of
                                it. The alternative is a caregiver believing they
                                are covered while the office has not looked. */}
                            {pending && (
                                <p className={styles.submittedNote}>
                                    Sent in {formatDate(document.submission.submittedAt)}:{" "}
                                    {document.submission.fileName}
                                    {Number.isFinite(document.submission.fileSize) &&
                                        ` · ${formatFileSize(document.submission.fileSize)}`}
                                    <br />
                                    Waiting on the office to check it. Your current
                                    status does not change until they do.
                                </p>
                            )}

                            {!pending && (canSign || needsRenewal) && (
                                <div className={styles.rowActions}>
                                    {canSign && (
                                        <button
                                            type="button"
                                            className={styles.secondaryButton}
                                            onClick={() => openFormFor(document.id, "sign")}
                                        >
                                            Sign it
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={styles.secondaryButton}
                                        onClick={() => openFormFor(document.id, "send")}
                                    >
                                        {needsRenewal ? "Send in a renewal" : "Send in a document"}
                                    </button>
                                </div>
                            )}

                            {isOpen && openForm.mode === "sign" && (
                                <div className={styles.form}>
                                    <SignatureField
                                        id={`my-sign-${document.id}`}
                                        label={`Your signature for ${document.name}`}
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
                                            {submitting ? "Signing..." : "Sign"}
                                        </button>
                                        <button type="button" className={styles.cancelButton} onClick={closeForm}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isOpen && openForm.mode === "send" && (
                                <div className={styles.form}>
                                    <div className={styles.field}>
                                        <label className={styles.fieldLabel} htmlFor={`my-file-${document.id}`}>
                                            Photo or file
                                        </label>
                                        <input
                                            id={`my-file-${document.id}`}
                                            type="file"
                                            className={styles.fileInput}
                                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label className={styles.fieldLabel} htmlFor={`my-issued-${document.id}`}>
                                            Issued
                                        </label>
                                        <input
                                            id={`my-issued-${document.id}`}
                                            type="date"
                                            className={styles.fieldInput}
                                            value={issuedOn}
                                            onChange={(e) => setIssuedOn(e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label className={styles.fieldLabel} htmlFor={`my-expires-${document.id}`}>
                                            Expires
                                        </label>
                                        <input
                                            id={`my-expires-${document.id}`}
                                            type="date"
                                            className={styles.fieldInput}
                                            value={expiresOn}
                                            onChange={(e) => setExpiresOn(e.target.value)}
                                        />
                                        <span className={styles.fieldHint}>Leave blank if it never expires</span>
                                    </div>

                                    <p className={styles.honestyNote}>
                                        The file itself is not stored. This demo records its
                                        name, size and type only. The office checks what you
                                        send before it counts.
                                    </p>

                                    {formError && <p className={styles.errorNote}>{formError}</p>}

                                    <div className={styles.formActions}>
                                        <button
                                            type="button"
                                            className={styles.primaryButton}
                                            onClick={() => handleSend(document.id)}
                                            disabled={submitting}
                                        >
                                            {submitting ? "Sending..." : "Send to the office"}
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
        </section>
    );
};

export default MyDocuments;
