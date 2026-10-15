# Server access control, issue #8

Vera has two roles within one agency. The server decides access from the
authenticated session, never a role or caregiver id supplied by the browser.

| Workflow | Administrator | Caregiver |
| --- | --- | --- |
| Agency visit list, counts, scheduling, cancellation, claims | Allowed | Forbidden |
| My visits | Forbidden | Session's caregiver only |
| Visit detail | Any visit | Assigned visits only |
| Check-in, check-out, missing visit evidence | Forbidden | Assigned visits only |
| Patient roster and patient records | Allowed | Forbidden |
| Caregiver roster and account management | Allowed | Forbidden |
| Caregiver record and document checklist | Any caregiver | Own record only |
| Sign a caregiver document or submit a renewal | Forbidden | Own documents only |
| Record a document or accept a submission | Allowed | Forbidden |

Caregiver visit responses include the patient address and standing care needs.
Caregivers do not need access to the patient roster or its history endpoints.
Document submissions remain metadata only; claims remain simulated.

## Enforcement

1. Revalidate saved sessions against the current account before serving requests.
   Deleted or disabled accounts, changed roles, and changed caregiver links
   invalidate the session. A database failure returns 503 and preserves it.
2. Use explicit HTTP route permissions and service method permissions. Unknown
   routes are denied. Administrative service methods require the admin role.
3. Derive `/api/visits/mine` from the principal. Scope individual visit and
   caregiver reads in services before mapping a response.
4. Lock visits before checking ownership and changing their state. Lock document
   rows before signatures, submissions, recording, or acceptance.
5. Return 401 for missing or invalid authentication, 403 for the wrong role,
   and the same generic 404 for missing or inaccessible records. Unsafe requests
   must also pass CSRF protection.

## Pairing handoff

The single remaining exercise is `CurrentUser.requireOwnership`. Its
placeholder must deny access until the ownership comparison is implemented.
Do not merge or deploy while this exercise remains unfinished.

## Acceptance

Check anonymous, administrator, and two distinct caregiver identities. Attempt
foreign record ids, forged caregiver filters, every write verb, concurrent visit
transitions, session invalidation, and database failure. Confirm allowed workflows
in the browser and that rejected writes leave records unchanged.
