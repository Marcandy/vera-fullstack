# Vera

Vera is a workspace for small home care agencies: one place to manage visits, caregivers, and the record of care each patient receives. Every visit is backed by evidence (who was there, when, and what care was delivered), so the moment a visit is verified, the claim is ready to submit. No chasing paperwork, no double data entry.

**Live demo:** [vera-homecare.vercel.app](https://vera-homecare.vercel.app)

## Why

Small home care agencies mostly run on software that is broad, expensive, and disconnected. From interviews with agency owners in Philadelphia, their top pain points were managing caregiver onboarding documents, knowing when caregivers are actually with patients, and collecting patient signatures. Vera focuses on one clean, connected flow from scheduled visit to billable record, built caregiver-first, because caregivers are the bulk of the workforce and the source of every record the office depends on.

The visit verification core is modeled on Electronic Visit Verification (EVV), which is federally required for Medicaid-funded home care under the 21st Century Cures Act.

**Demo disclaimer:** this is a portfolio project inspired by EVV. It is not certified EVV software, it makes no HIPAA claims, and all data is fictional.

## The two halves

```
vera-fullstack
  java-spring-boot-back-end-app    the API and the rules
  react-front-end-app              the browser application
  README.md
```

**`react-front-end-app`** is the Unit 1 project: React with Vite, React Router and CSS Modules. All data access already runs through a service layer, so components never touch data directly.

**`java-spring-boot-back-end-app`** is the Unit 2 project: Java, Spring Boot and MySQL. It replaces that service layer's mock internals, which is exactly what the layer was built to allow, and it is where the business rules move to. A rule the client enforces is not a rule.

Open each half in its own IDE rather than opening this repository as a whole: the Spring Boot project in IntelliJ, the React project in VS Code. Each folder has its own README with the detail.

## What it does

**For the administrator:**

- Dashboard: visits needing a nudge (a check-in that never happened, a visit still running long past its expected end) and credentials needing chasing (a lapsed document, one inside its renewal window), plus what needs attention right now, as counts of flagged and billable visits and the dollar value waiting on a claim; every tile drills into the filtered list
- Visit list: every visit with its pipeline status and the service delivered, searchable by patient or caregiver name and filtered by status, sorted by attention or by date. The search and the filter live in the URL, so a narrowed view is shareable and survives the back button, and the status counts on the chips keep describing the whole collection rather than the slice on screen
- Visit detail: check-in and check-out times, assessment, and signature; a flagged visit derives and lists exactly what evidence is missing
- Billing: ready-to-bill visits with hours worked and estimated cost, claim submission, and a submitted-claims register with claim references
- Patients: roster of everyone receiving care, and a patient record with their address, contact, what they need help with in general, and their full care history
- Caregivers: team roster with a derived cleared-to-work badge and a one-line paperwork summary, an add-caregiver form, and a record page per caregiver holding their onboarding documents and visit history. Each document carries its issue and expiry dates, and its status (signed, pending, expiring, expired) is derived from them against the clock

**For the caregiver (phone-width surface, one primary action per screen):**

- My visits: today's assigned visits in the order they happen, then anything held waiting on evidence only this caregiver can supply, then earlier work. The caregiver id comes from the session and never from the URL, so there is no address to type that reveals a colleague's patients
- My documents: their own onboarding checklist, whether they are cleared to work and what is holding it, and how long is left on anything expiring. A caregiver can sign a document themselves or send in a renewal, which is how the real products work, but sending it in does not make it count: it waits for the office to check it, because the agency is what has to produce a valid credential at a survey and one that cleared itself is one nobody checked
- Check in on arrival; the system stamps the time and records the device's location when the caregiver allows it. A refused or unreachable location is recorded as unavailable, with the reason, and never blocks the check-in
- Check out with a visit assessment and the patient's typed signature. Checking out without a signature warns first, then flags the visit for review instead of blocking the caregiver from leaving
- Missing evidence can be supplied later, which is the only way a flagged visit becomes billable
- A visit whose punch is overdue is flagged on the caregiver's own list while they can still fix it, because a time the office enters afterwards counts as a manual edit

**Around the app:**

- Home: product intro and a sign-in. Two demo accounts, `denise@agency.com` (administrator) and `marcus@agency.com` (caregiver)
- Roles: the administrator sees the visit list, caregivers, patients and billing; a caregiver sees only their own schedule and their own documents
- About: the home care industry in numbers, from cited primary sources
- Responsive layout: a tablet breakpoint, and a phone breakpoint where the sidebar collapses behind a menu button

## The visit pipeline

```
scheduled → in progress → ready to bill → billed
                        ↘ needs review ↗
```

Every transition has a cause: check-in, check-out with an evidence check, evidence supplied, claim submission. Three rules govern it:

1. A visit is billable only when all four pieces of evidence exist: check-in time, check-out time, assessment, signature. Anything missing routes it to needs review.
2. Only supplying the missing evidence clears a flag. There is no admin override, because clicking a button does not create a signature.
3. Timestamps are stamped by the system when the event happens, never typed by a user. A typed timestamp would be fabricated evidence.

These rules currently run in the browser, which means they are suggestions. Moving them into the Java service layer is the point of Unit 2.

## Architecture

Paths below are relative to `react-front-end-app/`.

- Vite + React (JavaScript), React Router, CSS Modules. No UI libraries.
- All data access goes through a service layer (`src/services`). Components never import mock data directly. The services expose async functions with realistic latency, so a real backend can replace the mock internals without changing a single component.
- Mutations are domain verbs (`checkInVisit`, `checkOutVisit`, `supplyEvidence`, `submitClaim`, `addCaregiver`, `signDocument`), and state transition rules live inside them, not in components.
- Every read surface handles a failed request: the failure is kept in state, rendered as its own thing, and retryable without reloading the page. A failed request is checked before a not-found result, because both leave the record empty and only one of them means the record does not exist.
- Derived state over stored flags: attention flags are computed from the clock and thresholds rather than stored on the visit, so nothing has to be written when a visit becomes late. `attentionFor` takes the current instant as a parameter instead of reading the clock, which keeps it pure and testable at fixed times. The dashboard counts, the missing-evidence panel, and the cleared-to-work badge are computed from the data at render time, so they can never disagree with the record.
- Demo timestamps are anchored to the day the app is opened rather than written as fixed dates (`src/data/demoDay.js`). A seed full of literal dates is honest only the week it is written: two months on, every scheduled visit read as a late check-in and every visit in progress as a forgotten check-out, so the attention flags flagged all of them and meant nothing. The offsets place exactly one late check-in and one overrunning visit on today, and one line freezes the whole seed to a fixed moment when a real backend takes the data over.
- Onboarding documents derive their status the same way. The seed used to assert `status: "expiring"`, which was the last stored judgment in the app and was true only on the day someone typed it. A document now carries its issue and expiry dates plus how it was received, and `documentStatus` computes the rest against an instant the caller passes in, exactly as `attentionFor` does. That is what made `expired` possible as a distinct state, and it separates two things the old shape conflated: expiring means renew soon and does not block work, expired means stop. Clearance blocks on outstanding and lapsed documents only.
- A lapsed document cannot be signed away, only replaced. This is the evidence rule again in a second place: signing an expired CPR card does not renew it, so the service refuses, and the only exit is recording a current one. The document upload keeps a file's name, size and type and says plainly that the bytes are not stored, because inventing storage would be the one dishonest thing in the app.
- The visit list asks the service a question rather than filtering an answer. `getVisits({ status, q, caregiverId, patientId })` is the query, and it is deliberately the controller signature: filtering an array the page already holds works for fourteen rows and is the wrong shape for anything else, because once a server returns the first page of two hundred, the rows that would match are the ones that were never sent. Two consequences fell out of the move. The chip counts became their own request, since counting the rows that came back would answer a different question from the one the chips ask. And search became debounced, since a keystroke is not a question worth asking the server; the effect's cleanup cancels the pending request while the stale flag still guards the one already in flight, because those are two different problems.
- The named read verbs delegate to that query but fail closed. An absent filter in `getVisits` means no restriction, which is right for an optional parameter and dangerous for a required one, so `getVisitsByCaregiver` rejects a missing id instead of quietly answering with everybody's visits.
- `serviceType` records what care was delivered, which the visit record previously did not carry at all. The gap was easy to miss because a visit has an assessment, but that is a caregiver's note about how the visit went, and nothing can bill, group or audit against a paragraph. It is a controlled vocabulary for the same reason the statuses are, and it becomes an enum on the entity.
- Credential attention is the same derivation as visit attention, pointed at a different record. `credentialsNeedingAttention` flattens the roster into the documents that are lapsed or inside their renewal window, and orders them by expiry date alone: expired sorts ahead of expiring for free, because those dates are already in the past, and within each group the one that has been wrong longest comes first. A rank table would have said the same thing while being able to disagree with the dates. Documents that were never received are deliberately excluded, for the same reason a scheduled visit is not an attention item: a new hire's outstanding paperwork is a known situation the roster already shows, while a credential quietly lapsing is the one nobody notices until an audit does.
- Every page reads through one hook, `useAsyncData`. Nine pages each owned the same twenty lines: state for the data, state for the error, a retry counter, an async function inside an effect, a `stale` flag closed over by its cleanup, and a try/catch that had to check that flag in both branches. Nine copies of something that subtle is nine chances to get one wrong, and they had already drifted, some tracking a loading boolean and some inferring it from a null. The hook holds one state object rather than three variables, because separate data, error and loading can describe situations that cannot happen. It also gives the `AbortController` somewhere to live, so leaving a page cancels the request rather than merely ignoring its answer.
- Debouncing belongs to the input, not to the request. `useDebounced` lags the search box's value, and everything downstream simply reacts to a value that changes less often. That is why a status chip, which is clicked rather than typed, updates immediately without anyone special-casing it.
- The caregiver's screen answers what to do next, not what has ever happened. It used to list every visit ever assigned, oldest first, which put three already-billed visits from last month above the one job happening today. It now separates today's work, visits held waiting on evidence only that caregiver can supply, and earlier history, and a visit belongs to exactly one of them. Today is decided in LOCAL time rather than by comparing the ISO date, because a caregiver's day is the day where they are standing and a 7pm Philadelphia visit is already tomorrow in UTC.
- A renewal a caregiver sends in is a SUBMISSION beside the live document, never a replacement for it. Two things follow. Renewing a card early cannot invalidate the card still in force, because the live fields are untouched until the office accepts. And a lapsed caregiver stays lapsed until someone at the agency looks, which is the honest answer: this is the same rule as the visit evidence hold, where supplying the missing thing clears it and dismissing it never does. Recording a document directly from the office supersedes any pending submission, so accepting a stale one cannot overwrite a newer credential.
- `locationService` sits alongside the data services but is a device adapter, not a repository: no backend will ever replace it, because the device is the only authority on where it is. It resolves a result object rather than rejecting, since a refused permission is an ordinary outcome of a real check-in and not an exception.
- The signed-in user is the only thing in React Context. Server data stays out of it: visits in Context would be a cache with no invalidation or staleness policy. The session stores a user id and rehydrates through the service on boot, the same shape a real client uses when it trades a token for `GET /api/auth/me`, which is why the session has three states rather than two: unknown, none, and a user.
- Visits reference patients and caregivers by id, with the names denormalized alongside for display. Names collide and change; ids do not, and both are the foreign keys a relational schema needs.
- Facts live at the level they are true at: what a patient needs help with in general belongs to the patient, what they raised during one visit belongs to that visit. Same words, different lifetimes.

## Running it

The front end runs on its own today: see `react-front-end-app/README.md`. Data comes from in-memory fixtures behind the service layer and resets on refresh.

Once the API exists, start it first and the front end second. MySQL replaces those fixtures, and nothing above the service layer changes.

## Manual testing

Automated testing was out of scope for this phase, so testing is a scripted manual pass run before each merge:

| Scenario | Steps | Expected |
|---|---|---|
| Check-in | Open a scheduled visit's caregiver flow, tap Check In | Status moves to in progress everywhere; time recorded |
| Check-in, location allowed | Allow the browser's location prompt | Coordinates and accuracy recorded; caregiver flow and visit detail both show them |
| Check-in, location refused | Block or dismiss the location prompt | Check-in still succeeds; both surfaces read Unavailable with the reason, never a placeholder position |
| Check-out, full evidence | Fill assessment and signature, check out | Visit becomes ready to bill; Billing total increases |
| Check-out, no signature | Leave signature blank, check out | Warning appears; Check Out Anyway flags the visit needs review |
| Supply evidence | Open a flagged visit's caregiver flow, add the missing signature | Visit becomes ready to bill; Billing updates |
| Unresolvable visit | Open a visit missing its check-out time | Panel explains office follow-up is needed; visit stays flagged |
| Add caregiver | Submit the form with name and phone | Caregiver appears in the roster with pending documents; form clears |
| Add caregiver, blank name | Submit with no name | Inline error from the service; nothing added |
| Unknown routes | Visit a bad URL or a bad visit id | 404 page inside the app shell; not-found message with a way back |
| Dashboard tiles | Click Need review on the dashboard | Lands on the visit list filtered to needs review, chip shown active |
| Filter deep link | Open /visits?status=BILLED directly, then reload | The five billed visits both times; the filter is in the URL, not in component state |
| Search | Type a patient or caregiver name into the visit search | List narrows as you type; the URL gains ?q= and the view is shareable |
| Search deep link | Open /visits?q=keisha directly | The box is pre-filled and the list is already narrowed |
| Search is debounced | Type a name quickly | One request after the pause, not one per keystroke; chip clicks stay immediate |
| Search and filter combine | Search a name, then click a status chip | Both narrow the list together, and both appear in the URL |
| Counts survive filtering | Filter to any status | The chip counts still total every visit, because they are their own query rather than a tally of the rows on screen |
| No search match | Search a name nobody has | Message naming the query, with a control to clear the filters |
| Bad filter in the URL | Open /visits?status=bogus | Falls back to the unfiltered list rather than a blank screen |
| Empty filter result | Filter to a status with no visits | Message naming that status, with a control to clear the filters |
| Demo sign-in, admin | Sign in as `denise@agency.com` | Lands on the dashboard; nav shows visit list, caregivers, billing |
| Demo sign-in, caregiver | Sign in as `marcus@agency.com` | Lands on My visits showing today's three visits first, nobody else's; nav shows only My visits |
| A caregiver's day | Note the sections on My visits | Today, then Waiting on you, then Earlier. A visit appears in exactly one of them |
| Held visit reaches its owner | Check out a visit with no signature, return to My visits | It leaves Today and appears under Waiting on you, which is the only place it can be cleared from |
| Where am I going | Open a visit from My visits | The patient's address and what they need help with in general, before the check-in button |
| Unknown account | Sign in with any other email | Inline error from the service; stays on the home page |
| Session persistence | Sign in, then reload the page | Still signed in, same role, with no flash of the signed-out view |
| Sign out | Use the banner control | Returns to the home page; reloading does not restore the session |
| Submit claim | On Billing, submit a ready-to-bill claim | Confirmation with a claim reference; row moves to Submitted claims; both totals update |
| Caregiver sees their own file | Sign in as a caregiver, open My documents | Their checklist, whether they are cleared, and how long is left on anything expiring |
| Caregiver sends a renewal | Send in a file for an expiring document | Status does not change; the row says the office still has to check it, and the action disappears while one is pending |
| Office is told to look | Sign in as the admin | The dashboard lists it as needing their check, naming who sent it |
| Accepting promotes it | Open that caregiver and accept the renewal | The new expiry becomes the record and the submission clears |
| Sign document | Open a caregiver, sign an outstanding document | Signature renders in cursive; pill flips to signed; badge flips to cleared when it was the last thing blocking |
| Expiring document | Open Marcus Reed | CPR reads expiring with days remaining, and he is still cleared to work: valid today is not the same as outstanding |
| Expired document | Open Angela Brooks | CPR reads expired and names itself as what blocks clearance; the row offers Record renewal and no Sign button |
| Expired is not signable | Try to sign a lapsed document | Refused by the service: a signature does not renew a credential |
| Record a renewal | Record a file with a future expiry on the lapsed document | Status leaves expired; clearance still blocked while anything else is outstanding |
| Record a lapsed date | Record a document with an expiry already in the past | Refused: that would file a document straight into the state it is meant to clear |
| Document dates are derived | Leave a caregiver record open across an expiry | The pill changes on the next minute tick, with no reload |
| Late check-in flag | View a scheduled visit whose appointment passed more than 15 minutes ago | Card and dashboard show a late check-in flag; the status pill still reads scheduled |
| Missing check-out flag | View a visit in progress more than 2 hours past check-in | Flagged missing check-out; needs-review and billed visits are never flagged |
| Flags update without a reload | Leave the dashboard open across a threshold | The flag appears on the next minute tick |
| Credentials to chase | Open the dashboard | Lapsed documents listed above expiring ones, each naming the caregiver, the document and how long until or since it lapsed |
| Credential row links out | Click a caregiver in that panel | Lands on their record with the document in question on screen |
| Chasing clears the panel | Record a renewal for the lapsed document | That row leaves the dashboard; the caregiver stays uncleared while anything else of theirs is outstanding |
| Nothing to chase | Clear every document on the roster | The panel disappears entirely, and the visit panels are untouched |
| Outstanding is not chased | Note a caregiver with unreceived documents | They count against cleared-to-work but do not appear as a credential to chase: never received is a known state, quietly lapsing is not |
| Patient record | Open a patient from the roster | Address, contact, standing concerns, and every visit on record newest first |
| Patient round trip | From a visit, click the patient name, then a visit in their history | Reaches the patient record and back into a visit |
| Unknown patient | Open /patients/999 | Not-found message with a way back, not a crash |
| Failed load | Simulate a failing read on any list or detail page | The page names the failure and offers Try again; it never sits on Loading |
| Retry | Recover the connection and press Try again | The page loads without a browser refresh and the error clears |
| Failure is not not-found | Fail the read on a visit or patient page | Reads as could-not-load, never as "not found" |
| Responsive | Narrow the window below 640px | Sidebar collapses behind the menu button; menu opens, navigates, and closes |

## Roadmap

- A distinct status between verified and billable once payer and authorization rules arrive with a real backend
- Location at check-out as well as check-in, and a review surface that surfaces visits whose location was never captured
- Real document storage: the upload records a file's name, size and type, and a backend is what would hold the bytes
- Per-document-type rules, so a CPR certification cannot be recorded without an expiry while a background check can
- Drawn signature capture
- Real authentication: hashed passwords, a token, and server-side authorization, replacing the demo sign-in
- Prescriptions and medication reconciliation on the patient record, under a future skilled-care path
- Real claim submission and remittance (837 and 835) to a payer or clearinghouse, replacing the mock
- Stripe test-mode collection for private-pay clients
- Automated tests: Vitest and React Testing Library for services and components, Playwright for the visit flow end to end

## History

This repository starts at Unit 2, so every commit here is work done for it.

The front end was built over Unit 1 in a separate repository, and that history stays where it happened: 158 commits and 43 pull requests at [github.com/Marcandy/vera](https://github.com/Marcandy/vera). That is the place to look for how any part of the front end came to be, and why.
