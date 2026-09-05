// Demo timestamps are anchored to the day the app is opened, not to fixed
// calendar dates. A seed file full of literal dates is honest the week it is
// written and lies afterwards: this one reached two months old, and by then
// every scheduled visit read as a late check-in and every visit in progress
// as a forgotten check-out. All four flagged, which is the same as none
// flagged. The attention rules were right; the data underneath them had
// rotted, so a correct feature demoed as noise.
//
// Everything below is computed ONCE at module load, so one page load sees one
// consistent clock rather than a time that moves between two reads.
//
// To freeze the demo to a fixed moment, replace the single line below with a
// literal and every offset in the seed moves with it:
//   const DEMO_NOW = new Date("2026-09-01T09:00:00").getTime();
// That is also how this survives the backend. A static data.sql cannot
// compute an offset from today, but a CommandLineRunner can seed exactly
// these ones.
const DEMO_NOW = Date.now();

// Local midnight of the day the demo is opened. Whole-day offsets hang off
// this rather than off DEMO_NOW, so a visit two days ago at 14:00 really
// reads 2:00 PM instead of drifting with whatever hour the page loaded.
const DEMO_DAY = (() => {
    const day = new Date(DEMO_NOW);
    day.setHours(0, 0, 0, 0);
    return day;
})();

// Every timestamp leaves here as an ISO string in UTC, which is what the
// service already writes with new Date().toISOString() and what a Java
// Instant serialises to. One format everywhere is what lets the visit lists
// order themselves with localeCompare: mixing a naive "2026-09-02T14:00"
// against a real "2026-09-02T18:00:00.000Z" compares the characters "14" to
// "18" and puts the day in the wrong order without failing anywhere.

// A wall-clock time on a day relative to the demo day. The offset is negative
// for the past, so at(-1, "14:00") is yesterday at 2:00 PM local. A malformed
// time produces an Invalid Date and throws here, at module load, rather than
// travelling on to render as a blank cell somewhere downstream.
export const at = (dayOffset, clockTime) => {
    const [hours, minutes] = clockTime.split(":").map(Number);

    const moment = new Date(DEMO_DAY);
    moment.setDate(moment.getDate() + dayOffset);
    moment.setHours(hours, minutes, 0, 0);

    return moment.toISOString();
};

// Visits happening right now cannot use a wall-clock time. Seed a check-in at
// 08:00 and the visit has not started yet if the demo opens at 7am, then sits
// ten hours overdue if it opens at 6pm: the scenario a reviewer sees would
// depend on the hour they clicked the link. Both attention thresholds are
// measured in minutes from an event, so the seeds that have to land on a
// known side of one are measured the same way.
//
// Rounded to a five minute boundary so these still read like appointments and
// not like the instant the page loaded. Rounding moves away from now and
// never toward it, so a seed placed past a threshold cannot round back under
// it; the seeds placed short of one leave far more than five minutes of room.
const FIVE_MINUTES = 5 * 60000;

export const minutesAgo = (minutes) =>
    new Date(
        Math.floor((DEMO_NOW - minutes * 60000) / FIVE_MINUTES) * FIVE_MINUTES
    ).toISOString();

export const minutesAhead = (minutes) =>
    new Date(
        Math.ceil((DEMO_NOW + minutes * 60000) / FIVE_MINUTES) * FIVE_MINUTES
    ).toISOString();
