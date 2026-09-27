import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import VisitCard from "../components/VisitCard";
import LoadError from "../components/LoadError";
import styles from "./Visits.module.css";
import { getVisits, getVisitCounts, scheduleVisit } from "../services/visitService";
import { getPatients } from "../services/patientService";
import { getCaregivers } from "../services/caregiverService";
import { VISIT_STATUS, VISIT_STATUS_LIST, VISIT_STATUS_LABEL, parseVisitStatus } from "../utils/status";
import { SERVICE_TYPE, SERVICE_TYPE_LABEL } from "../utils/serviceType";

import { useNow } from "../hooks/useNow";
import { useAsyncData } from "../hooks/useAsyncData";
import { useDebounced } from "../hooks/useDebounced";
import { attentionFor } from "../utils/attention";

// This screen's attention order; the first two need Denise to act.
const STATUS_RANK = {
    [VISIT_STATUS.NEEDS_REVIEW]: 0,
    [VISIT_STATUS.READY_TO_BILL]: 1,
    [VISIT_STATUS.IN_PROGRESS]: 2,
    [VISIT_STATUS.SCHEDULED]: 3,
    [VISIT_STATUS.BILLED]: 4,
};

const RANK_UNKNOWN = Number.MAX_SAFE_INTEGER;

// Lowercased because these labels are read mid sentence.
const statusText = (status) => (VISIT_STATUS_LABEL[status] ?? status).toLowerCase();

// Oldest first: the longest-waiting visit is the most urgent in its group.
const byDate = (a, b) => a.appointmentTime.localeCompare(b.appointmentTime);

const byAttention = (a, b) => {
    const rankDiff =
        (STATUS_RANK[a.status] ?? RANK_UNKNOWN) - (STATUS_RANK[b.status] ?? RANK_UNKNOWN);

    if (rankDiff !== 0) return rankDiff;

    return byDate(a, b);
};

const SORTS = { attention: byAttention, date: byDate };

const SEARCH_DEBOUNCE_MS = 250;

const Visits = () => {
    const now = useNow();

    // View state lives in the URL, so it is shareable and survives the back button.
    // MyVisits never reads its caregiver id from the URL: that is identity.
    const [searchParams, setSearchParams] = useSearchParams();

    const activeStatus = parseVisitStatus(searchParams.get("status"));
    const activeSort = SORTS[searchParams.get("sort")] ? searchParams.get("sort") : "attention";
    const query = searchParams.get("q") ?? "";

    const debouncedQuery = useDebounced(query, SEARCH_DEBOUNCE_MS);

    // Counts cover the whole collection, so they ignore the filter.
    const { data: counts, reload: reloadCounts } = useAsyncData(
        (signal) => getVisitCounts({ signal }), []);

    const { data: visitList, error: loadError, loading, stale, reload: reloadList } = useAsyncData(
        (signal) => getVisits({ status: activeStatus, q: debouncedQuery }, { signal }),
        [activeStatus, debouncedQuery]);

    const { data: patients } = useAsyncData(
        (signal) => getPatients({ signal }), []);
    const { data: caregivers } = useAsyncData(
        () => getCaregivers(), []);

    const [patientId, setPatientId] = useState("");
    const [caregiverId, setCaregiverId] = useState("");
    const [appointmentLocal, setAppointmentLocal] = useState("");
    const [serviceType, setServiceType] = useState("");
    const [estimatedCost, setEstimatedCost] = useState("");
    const [scheduling, setScheduling] = useState(false);

    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduleError, setScheduleError] = useState(null);

    const reload = () => { reloadCounts(); reloadList(); };

    const patientList = patients ?? [];
    const caregiverList = caregivers ?? [];

    async function handleSchedule(event) {
        event.preventDefault();
        setScheduleError(null);
        setScheduling(true);
        try {
            await scheduleVisit({
                patientId: Number(patientId),
                caregiverId: Number(caregiverId),
                appointmentTime: new Date(appointmentLocal).toISOString(),
                serviceType,
                estimatedCost: Number(estimatedCost),
            });
            reload();
            setPatientId("");
            setCaregiverId("");
            setAppointmentLocal("");
            setServiceType("");
            setEstimatedCost("");
            setShowSchedule(false);
        } catch (error) {
            setScheduleError(error.message);
        } finally {
            setScheduling(false);
        }
    }

    // Replace, not push: twelve chip clicks should not mean twelve back presses.
    const setParam = (key, value) => {
        const next = new URLSearchParams(searchParams);
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
        setSearchParams(next, { replace: true });
    };

    if (loadError) return (
        <LoadError
            message={`The visit list could not load. ${loadError.message}`}
            onRetry={reload}
        />
    );

    if (loading) return <p>Loading...</p>

    // Stale for either reason: the query has not settled, or its answer has not arrived.
    const isRefreshing = stale || query !== debouncedQuery;

    const ordered = [...visitList].sort(SORTS[activeSort]);

    // Decided from the filter, not the counts, which may not have landed yet.
    const isFiltered = activeStatus !== null || query !== "";

    const clearFilters = () => {
        const next = new URLSearchParams(searchParams);
        next.delete("status");
        next.delete("q");
        setSearchParams(next, { replace: true });
    };

    return (
        <section className={styles.visits}>
            <div className={styles.headerRow}>
                <h3>Visits</h3>
                <label className={styles.sortControl}>
                    Sort
                    <select
                        className={styles.sortSelect}
                        value={activeSort}
                        onChange={(e) => setParam("sort", e.target.value)}
                    >
                        <option value="attention">Needs attention first</option>
                        <option value="date">Soonest first</option>
                    </select>
                </label>
                <button
                    type="button"
                    className={styles.toggleButton}
                    onClick={() => setShowSchedule((open) => !open)}
                    aria-expanded={showSchedule}
                    aria-controls="schedule-form"
                >
                    {showSchedule ? "Cancel" : "Schedule a visit"}
                </button>
            </div>

            {showSchedule && (
            <form id="schedule-form" className={styles.scheduleForm} onSubmit={handleSchedule}>
                <fieldset className={styles.formFields} disabled={scheduling} aria-label="New visit details">
                    <div className={styles.fieldRow}>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor="schedule-patient">Patient</label>
                            <select
                                id="schedule-patient"
                                className={styles.fieldInput}
                                required
                                value={patientId}
                                onChange={(event) => setPatientId(event.target.value)}
                            >
                                <option value="">Select a patient</option>
                                {patientList.map((patient) => (
                                    <option key={patient.id} value={patient.id}>
                                        {patient.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor="schedule-caregiver">Caregiver</label>
                            <select
                                id="schedule-caregiver"
                                className={styles.fieldInput}
                                required
                                value={caregiverId}
                                onChange={(event) => setCaregiverId(event.target.value)}
                            >
                                <option value="">Select a caregiver</option>
                                {caregiverList.map((caregiver) => (
                                    <option key={caregiver.id} value={caregiver.id}>
                                        {caregiver.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className={styles.fieldRow}>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor="schedule-appointment">Appointment</label>
                            <input
                                id="schedule-appointment"
                                type="datetime-local"
                                className={styles.fieldInput}
                                required
                                value={appointmentLocal}
                                onChange={(event) => setAppointmentLocal(event.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor="schedule-service">Service type</label>
                            <select
                                id="schedule-service"
                                className={styles.fieldInput}
                                required
                                value={serviceType}
                                onChange={(event) => setServiceType(event.target.value)}
                            >
                                <option value="">Select a service</option>
                                {Object.values(SERVICE_TYPE).map((type) => (
                                    <option key={type} value={type}>
                                        {SERVICE_TYPE_LABEL[type]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor="schedule-cost">Estimated cost</label>
                        <input
                            id="schedule-cost"
                            type="number"
                            className={styles.fieldInput}
                            required
                            min="0"
                            step="0.01"
                            value={estimatedCost}
                            onChange={(event) => setEstimatedCost(event.target.value)}
                        />
                    </div>
                </fieldset>
                {scheduleError && <p className={styles.errorNote} role="alert">{scheduleError}</p>}
                <button type="submit" className={styles.addButton} disabled={scheduling}>
                    {scheduling ? "Scheduling..." : "Schedule visit"}
                </button>
            </form>
            )}

            <div className={styles.searchRow}>
                <label className={styles.searchLabel} htmlFor="visit-search">
                    Search by name
                </label>
                <input
                    id="visit-search"
                    type="search"
                    className={styles.searchInput}
                    placeholder="Patient or caregiver"
                    value={query}
                    onChange={(e) => setParam("q", e.target.value)}
                />
                <span className={styles.searchStatus} aria-live="polite">
                    {isRefreshing ? "Searching..." : ""}
                </span>
            </div>

            <div className={styles.filterBar} role="group" aria-label="Filter by status">
                <button
                    type="button"
                    className={activeStatus === null ? `${styles.chip} ${styles.chipActive}` : styles.chip}
                    aria-pressed={activeStatus === null}
                    onClick={() => setParam("status", null)}
                >
                    All{counts && ` (${counts.total})`}
                </button>
                {VISIT_STATUS_LIST.map((status) => (
                    <button
                        key={status}
                        type="button"
                        className={activeStatus === status ? `${styles.chip} ${styles.chipActive}` : styles.chip}
                        aria-pressed={activeStatus === status}
                        onClick={() => setParam("status", status)}
                    >
                        {VISIT_STATUS_LABEL[status] ?? status}{counts && ` (${counts.byStatus[status] ?? 0})`}
                    </button>
                ))}
            </div>

            {ordered.length === 0 ? (
                isFiltered ? (
                    <p className={styles.emptyState}>
                        {query && activeStatus
                            ? `No ${statusText(activeStatus)} visits match "${query}".`
                            : query
                                ? `No visits match "${query}".`
                                : `No visits are ${statusText(activeStatus)}.`}{" "}
                        <button type="button" className={styles.linkButton} onClick={clearFilters}>
                            Clear filters
                        </button>
                    </p>
                ) : (
                    <p className={styles.emptyState}>
                        No visits yet. Scheduled visits will appear here.
                    </p>
                )
            ) : (
                <ul className={styles.visitList}>
                    {ordered.map((visit) => (
                        <li key={visit.id}>
                            <Link to={`/visits/${visit.id}`} className={styles.cardLink}>
                                <VisitCard visit={visit} attention={attentionFor(visit, now)} />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export default Visits;
