# Vera API

Java 21, Spring Boot 4.1, Maven and MySQL. Scaffold only: no entities,
endpoints or data yet.

Open **this folder** in IntelliJ, not the repository root. The root holds the
React application too, and IntelliJ will try to index its `node_modules` if
pointed there.

## Running it

Create the schema first. Hibernate creates tables, not databases:

```sql
CREATE DATABASE vera;
```

Then, from this folder:

```
./mvnw spring-boot:run
```

Credentials are read from `MYSQL_USER` and `MYSQL_PASSWORD`, defaulting to
`root` with an empty password, so no real password is committed. Set them in
your environment or in IntelliJ's run configuration rather than editing
`application.properties`.

The generated `contextLoads` test starts the whole Spring context, datasource
included, so **it fails if MySQL is not running or the schema does not exist**.
That is the test doing its job rather than a broken setup. Narrower slice tests
that do not need a database come later.

## Confirming it is up

There are no endpoints yet, so a running application answers every path with
Spring's Whitelabel error page. That is the check: `http://localhost:8080/`
returning a 404 error page means the application started and is serving. A
connection refused means it is not.

The front end reaches the API through a Vite proxy, so in development the
browser sees one origin: `/api/...` from `localhost:5173` is forwarded to
`localhost:8080`. There is no cross origin request and no preflight, which
keeps CORS a production concern to be configured deliberately for the deployed
front end rather than switched off locally and discovered on deploy day.

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
