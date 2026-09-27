export const sumCost = (list) =>
    list.reduce((total, visit) => total + visit.estimatedCost, 0);

export const countByStatus = (list) =>
    list.reduce((counts, visit) => {
        counts[visit.status] = (counts[visit.status] ?? 0) + 1;
        return counts;
    }, {});

// Local, not UTC: a 7pm Philadelphia visit is already tomorrow in UTC.
export const isSameLocalDay = (isoString, now) => {
    const when = new Date(isoString);
    const today = new Date(now);

    return when.getFullYear() === today.getFullYear()
        && when.getMonth() === today.getMonth()
        && when.getDate() === today.getDate();
};
