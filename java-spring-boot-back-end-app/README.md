# Vera API

Java, Spring Boot and MySQL. Not generated yet.

Create the project here with Spring Initializr from IntelliJ, choosing Maven,
Java 21, and the Spring Web, Spring Data JPA and MySQL Driver dependencies, so
that `pom.xml` sits at the root of this folder.

Open **this folder** in IntelliJ, not the repository root. The repository root
holds the React application as well, and IntelliJ will try to index its
`node_modules` if pointed there.

## What replaces what

The React app's `src/services` directory is the specification for this API.
Each function there becomes an endpoint, and the domain verbs already map onto
sub-resources named for the event that causes them rather than onto CRUD:

| Service function | Endpoint |
| --- | --- |
| `getVisits(query)` | `GET /api/visits` |
| `getVisitById(id)` | `GET /api/visits/{id}` |
| `checkInVisit(id)` | `POST /api/visits/{id}/check-in` |
| `checkOutVisit(id)` | `POST /api/visits/{id}/check-out` |
| `supplyEvidence(id)` | `POST /api/visits/{id}/evidence` |
| `submitClaim(id)` | `POST /api/visits/{id}/claim` |
| `getCaregivers()` | `GET /api/caregivers` |
| `addCaregiver(...)` | `POST /api/caregivers` |
| `signDocument(...)` | `POST /api/caregivers/{id}/documents/{docId}/signature` |
| `getPatients()` | `GET /api/patients` |

`locationService` is the exception and never becomes an endpoint. It is a
device adapter rather than a repository: the device is the only authority on
where it is.

## Rules that have to move here

The four-field evidence check and every status transition guard currently run
in the browser, which means they are suggestions. They belong in the domain
service in this project, not in a controller and not in an entity. A rule the
client enforces is not a rule.

Service guards become status codes: a record that is not there is 404, an
illegal transition is 409, input the domain refuses is 400.
