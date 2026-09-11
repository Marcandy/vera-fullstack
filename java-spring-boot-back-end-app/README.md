# Vera API

Java 21, Spring Boot 4.1, Maven and MySQL. The REST API behind Vera's React
front end, which reads it through a Vite proxy in development.

Open this folder rather than the repository root, so that Maven imports the
project and the React app's `node_modules` stays out of the index.

## Running it

Create the schema first. Hibernate creates tables, not databases:

```sql
CREATE DATABASE vera;
```

Then, from this folder:

```
./mvnw spring-boot:run
```

Credentials come from `MYSQL_USER` and `MYSQL_PASSWORD`. Copy the template and
fill in your own:

```
cp .env.example .env
```

`.env` is gitignored, so a real password never reaches the repository. Spring
loads it through `spring.config.import` in `application.properties`, and a
`.env` file is already valid `.properties` syntax, so nothing extra is needed
to parse it. A variable exported in the real environment overrides the file,
which is how a deployed server supplies credentials with no file on disk.

Do not put a password directly in `application.properties`: that file is
committed, and this repository is public.

The generated `contextLoads` test starts the whole Spring context, datasource
included, so **it fails if MySQL is not running or the schema does not exist**.
That is the test doing its job rather than a broken setup. Narrower slice tests
that do not need a database come later.

## Confirming it is up

`http://localhost:8080/api/visits` returning JSON means the application started,
connected and is serving. A connection refused means it is not, and a Whitelabel
404 on a path that should exist means the application is up but that controller
is not mapped.

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
| `getVisitCounts()` | `GET /api/visits/counts` |
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

## The data model

Packages go by feature, not by layer:

```
com.vera.api.patient
com.vera.api.caregiver
com.vera.api.visit
```

Each one holds its own entity, repository, controller and response record.
Packaging by layer, a `models` package beside a `controllers` package, spreads a
single change across four folders and forces every class public so the layers
can reach one another. The unit of change here is the feature, so that is the
unit of packaging.

All three sit under `com.vera.api` because `@SpringBootApplication` roots both
component scanning and JPA entity scanning at the package that holds it. An
entity outside that root is invisible: no table is created, and the first
repository referencing it fails startup with `Not a managed type`.

### Fields

**Patient:** `id`, `name`, `phone`, `address`, `standingConcerns` (TEXT).

**Caregiver:** `id`, `name`, `phone`. Documents arrive with the compliance
feature and are deliberately absent here.

**Visit:**

| Field | Notes |
| --- | --- |
| `id` | |
| `patient`, `caregiver` | `@ManyToOne(fetch = FetchType.LAZY)` with `@JoinColumn` |
| `appointmentTime` | `Instant`, not null |
| `status`, `serviceType` | `@Enumerated(EnumType.STRING)` |
| `estimatedCost` | `BigDecimal`, precision 10 scale 2 |
| `checkInTime`, `checkOutTime` | nullable |
| `assessment`, `patientConcern` | TEXT, nullable |
| `signature` | nullable |

The four evidence fields are nullable because a visit that has not happened yet
has none of them. What a visit is missing is derived from those nulls when it
is read, never stored as a column of its own.

`EnumType.ORDINAL` would persist each constant's declaration order as an
integer, so reordering the constants silently rewrites the meaning of every row
already in the table. `STRING` costs a few bytes and survives a reorder.

Money is `BigDecimal` because `double` cannot represent 0.10 exactly, and a
billing record that rounds differently than the payer does is a record that
loses arguments.

No `Document` and no `Claim` yet. Both are their own tables in the ERD, and
`ddl-auto=update` adds them later without disturbing these three.

### Order of work

Patient, then Caregiver, then Visit. Hibernate cannot create the Visit foreign
keys until both referenced tables exist.

Every entity needs a protected no-arg constructor. JPA instantiates entities
reflectively and fails at startup without one.

Start the application after each entity and confirm the result in SQL rather
than trusting the Java:

```sql
SHOW COLUMNS FROM visits;
```

Two mistakes are invisible from Java and obvious here: an ordinal enum storing
`0` and `1` where a name belongs, and an `Instant` landing in a column type
that discards the offset.

Seed data comes last, from a `CommandLineRunner` guarded by
`if (repository.count() == 0)`, not from `data.sql`. The demo timestamps are
offsets from the day the application starts, and static SQL cannot compute
those.

### Reads only for now

- `GET /api/visits`, with optional `status`, `q`, `caregiverId` and `patientId`
- `GET /api/visits/{id}`
- `GET /api/visits/counts`
- `GET /api/patients`
- `GET /api/patients/{id}`
- `GET /api/caregivers`
- `GET /api/caregivers/{id}`

The writes listed in the table above wait for the domain service that holds the
evidence rule and the transition guards. Accepting a POST before that service
exists would leave the rules in the client.

### Never return an entity

A controller returns a response record carrying ids **and** names, so rendering
a list needs no second call per row. Handing Jackson an entity hands it a lazy
proxy, which either throws or quietly loads each relation one row at a time.

`VisitRepository` carries `search(status, q, caregiverId, patientId)` and
`findByIdWithPeople(id)`, both using `join fetch v.patient join fetch v.caregiver`. The other two
repositories are bare `JpaRepository<T, Long>`.

Write the plain `findAll()` first, set `spring.jpa.show-sql=true`, and run it.
With `open-in-view=false` there is no open session at render time, so it throws
`LazyInitializationException` instead of quietly firing one query per row. The
join fetch is the fix, and the failure is worth seeing once before applying it.

## Rules that have to move here

The four-field evidence check and every status transition guard currently run
in the browser, which means they are suggestions. They belong in the domain
service in this project, not in a controller and not in an entity. A rule the
client enforces is not a rule.

Service guards become status codes: a record that is not there is 404, an
illegal transition is 409, input the domain refuses is 400.
