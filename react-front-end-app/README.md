# Vera front end

The React half of Vera. What the product is, what it does, the manual test plan
and the roadmap live in the [repository README](../README.md), so that there is
one copy of them rather than two that drift apart.

This file covers running this project, and the decisions that are specific to
the browser.

## Running locally

```
npm install
npm run dev
```

Production build: `npm run build`. Lint: `npx eslint .`

Start the API first, from `java-spring-boot-back-end-app`. Vite proxies `/api`
to it on port 8080, so the browser sees a single origin in development and CORS
stays a production concern. Without it running, every page renders its
could-not-load state.

Open **this folder** in VS Code, not the repository root.

## Layout

```
src/
  pages/        one file per route, each owning its own reads
  components/   shared pieces, each with a co-located .module.css
  services/     the only place that knows where data comes from
  utils/        pure derivations: status, attention, documents, formatting
  hooks/        useAsyncData, useDebounced, useNow
  context/      the session, and nothing else
  data/         mock fixtures, until the API replaces them
```

Two rules worth knowing before changing anything here:

**Components never import from `data/`.** Every read goes through `services/`,
which is what lets the Spring Boot API replace the mock internals without a
single component changing.

**Nothing derived is stored.** Visit attention flags, document status,
cleared-to-work, dashboard counts and the missing-evidence list are all computed
at render from the record plus the clock, so a badge can never disagree with the
data behind it.

## Decisions specific to the browser

- Every read surface handles a failed request: the failure is kept in state, rendered as its own thing, and retryable without reloading the page. A failed request is checked before a not-found result, because both leave the record empty and only one of them means the record does not exist.
- Onboarding documents derive their status from their dates, the same way visit attention flags derive from the clock. The seed used to assert `status: "expiring"`, which was the last stored judgment in the app and was true only on the day someone typed it. A document now carries its issue and expiry dates plus how it was received, and `documentStatus` computes the rest against an instant the caller passes in, exactly as `attentionFor` does. That is what made `expired` possible as a distinct state, and it separates two things the old shape conflated: expiring means renew soon and does not block work, expired means stop. Clearance blocks on outstanding and lapsed documents only.
- The visit list asks the service a question rather than filtering an answer. `getVisits({ status, q, caregiverId, patientId })` is the query, and it is deliberately the controller signature: filtering an array the page already holds works for fourteen rows and is the wrong shape for anything else, because once a server returns the first page of two hundred, the rows that would match are the ones that were never sent. Two consequences fell out of the move. The chip counts became their own request, since counting the rows that came back would answer a different question from the one the chips ask. And search became debounced, since a keystroke is not a question worth asking the server; the effect's cleanup cancels the pending request while the stale flag still guards the one already in flight, because those are two different problems.
- The named read verbs delegate to that query but fail closed. An absent filter in `getVisits` means no restriction, which is right for an optional parameter and dangerous for a required one, so `getVisitsByCaregiver` rejects a missing id instead of quietly answering with everybody's visits.
- `serviceType` records what care was delivered, which the visit record previously did not carry at all. The gap was easy to miss because a visit has an assessment, but that is a caregiver's note about how the visit went, and nothing can bill, group or audit against a paragraph. It is a controlled vocabulary for the same reason the statuses are, and it becomes an enum on the entity.
- Credential attention is the same derivation as visit attention, pointed at a different record. `credentialsNeedingAttention` flattens the roster into the documents that are lapsed or inside their renewal window, and orders them by expiry date alone: expired sorts ahead of expiring for free, because those dates are already in the past, and within each group the one that has been wrong longest comes first. A rank table would have said the same thing while being able to disagree with the dates. Documents that were never received are deliberately excluded, for the same reason a scheduled visit is not an attention item: a new hire's outstanding paperwork is a known situation the roster already shows, while a credential quietly lapsing is the one nobody notices until an audit does.
- Every page reads through one hook, `useAsyncData`. Nine pages each owned the same twenty lines: state for the data, state for the error, a retry counter, an async function inside an effect, a `stale` flag closed over by its cleanup, and a try/catch that had to check that flag in both branches. Nine copies of something that subtle is nine chances to get one wrong, and they had already drifted, some tracking a loading boolean and some inferring it from a null. The hook holds one state object rather than three variables, because separate data, error and loading can describe situations that cannot happen. It also gives the `AbortController` somewhere to live, so leaving a page cancels the request rather than merely ignoring its answer.
- Debouncing belongs to the input, not to the request. `useDebounced` lags the search box's value, and everything downstream simply reacts to a value that changes less often. That is why a status chip, which is clicked rather than typed, updates immediately without anyone special-casing it.
- The caregiver's screen answers what to do next, not what has ever happened. It used to list every visit ever assigned, oldest first, which put three already-billed visits from last month above the one job happening today. It now separates today's work, visits held waiting on evidence only that caregiver can supply, and earlier history, and a visit belongs to exactly one of them. Today is decided in LOCAL time rather than by comparing the ISO date, because a caregiver's day is the day where they are standing and a 7pm Philadelphia visit is already tomorrow in UTC.
- `locationService` sits alongside the data services but is a device adapter, not a repository: no backend will ever replace it, because the device is the only authority on where it is. It resolves a result object rather than rejecting, since a refused permission is an ordinary outcome of a real check-in and not an exception.
- The signed-in user is the only thing in React Context. Server data stays out of it: visits in Context would be a cache with no invalidation or staleness policy. The session stores a user id and rehydrates through the service on boot, the same shape a real client uses when it trades a token for `GET /api/auth/me`, which is why the session has three states rather than two: unknown, none, and a user.
