import { Link, useSearchParams } from "react-router";
import VisitCard from "../components/VisitCard";
import LoadError from "../components/LoadError";
import styles from "./Visits.module.css";
import { getVisits, getVisitCounts } from "../services/visitService";
import { VISIT_STATUS, VISIT_STATUS_LIST, parseVisitStatus } from "../utils/status";

import { useNow } from "../hooks/useNow";
import { useAsyncData } from "../hooks/useAsyncData";
import { useDebounced } from "../hooks/useDebounced";
import { attentionFor } from "../utils/attention";

// Denise's attention order, lowest rank first. This is a property of THIS
// screen, not of the collection, so it lives here and not in the service:
// the first two need her to act, the rest are just status.
const STATUS_RANK = {
    [VISIT_STATUS.NEEDS_REVIEW]: 0,
    [VISIT_STATUS.READY_TO_BILL]: 1,
    [VISIT_STATUS.IN_PROGRESS]: 2,
    [VISIT_STATUS.SCHEDULED]: 3,
    [VISIT_STATUS.BILLED]: 4,
};

// An unrecognized status means a broken pipeline, not a real position.
// It parks at the end; StatusPill is what fails visibly, by rendering bare.
const RANK_UNKNOWN = Number.MAX_SAFE_INTEGER;

// Oldest appointment first: the longest-waiting visit is the most urgent one
// in its group. ISO strings compare lexicographically, which is the reason
// the visit shape stores them as strings.
const byDate = (a, b) => a.appointmentTime.localeCompare(b.appointmentTime);

const byAttention = (a, b) => {
    const rankDiff =
        (STATUS_RANK[a.status] ?? RANK_UNKNOWN) - (STATUS_RANK[b.status] ?? RANK_UNKNOWN);

    if (rankDiff !== 0) return rankDiff;

    return byDate(a, b);
};

const SORTS = { attention: byAttention, date: byDate };

// Long enough that a typed word is one request rather than five, short enough
// that it still feels like the list is keeping up.
const SEARCH_DEBOUNCE_MS = 250;

const Visits = () => {
    // Ticks so a visit crossing its threshold flags itself without a reload.
    const now = useNow();

    // Filter, search and sort live in the URL, not in useState. This is VIEW
    // state: what am I looking at. That makes it shareable, bookmarkable, and
    // it restores on the back button for free. Note the opposite call on
    // MyVisits, where the caregiver id must NEVER come from the URL: that is
    // identity, and identity a user can type is an authorization hole. Same
    // app, opposite answers, for different reasons.
    const [searchParams, setSearchParams] = useSearchParams();

    // The URL is untrusted input. ?status=bogus falls back to unfiltered
    // rather than rendering a blank list with nothing to explain it.
    const activeStatus = parseVisitStatus(searchParams.get("status"));
    const activeSort = SORTS[searchParams.get("sort")] ? searchParams.get("sort") : "attention";
    const query = searchParams.get("q") ?? "";

    // Only the search box is typed into, so only the search box waits. A status
    // chip is a click, not a keystroke, so it stays immediate: that falls out of
    // debouncing the VALUE rather than the request.
    const debouncedQuery = useDebounced(query, SEARCH_DEBOUNCE_MS);

    // The counts describe the whole collection, so they do NOT re-run when the
    // filter changes. Deriving them from the filtered list stopped being
    // possible when filtering moved to the service: every chip would report the
    // filtered total or zero.
    const { data: counts, reload: reloadCounts } = useAsyncData(
        (signal) => getVisitCounts({ signal }), []);

    // The list is a separate request because it answers a separate question.
    const { data: visitList, error: loadError, loading, stale, reload: reloadList } = useAsyncData(
        (signal) => getVisits({ status: activeStatus, q: debouncedQuery }, { signal }),
        [activeStatus, debouncedQuery]);

    const reload = () => { reloadCounts(); reloadList(); };

    // Replace rather than push: filtering is not a place you navigated to,
    // so twelve chip clicks should not mean twelve presses of the back button
    // to leave the page.
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

    // Out of date for either reason: the typed query has not settled yet, or it
    // has and the answer is still on its way. Both mean the rows on screen
    // answer an older question, and both are derived rather than flagged.
    const isRefreshing = stale || query !== debouncedQuery;

    // Sort a COPY. The service hands back its own array, but sorting a result in
    // place is still the habit that reorders a shared cache the day one exists.
    const ordered = [...visitList].sort(SORTS[activeSort]);

    // Two different empty results needing two different explanations: an agency
    // with no visits at all, and a filter that happens to match none. Decided
    // from the filter itself rather than from the counts, which arrive in their
    // own request and may not have landed yet.
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
            </div>

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
                {/* The list keeps the previous results while a new query is in
                    flight rather than flashing Loading on every keystroke, so
                    this is what says the screen is not simply stale. */}
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
                        {status}{counts && ` (${counts.byStatus[status] ?? 0})`}
                    </button>
                ))}
            </div>

            {ordered.length === 0 ? (
                isFiltered ? (
                    <p className={styles.emptyState}>
                        {query && activeStatus
                            ? `No ${activeStatus} visits match "${query}".`
                            : query
                                ? `No visits match "${query}".`
                                : `No visits are ${activeStatus}.`}{" "}
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
