# Vera front end

The React half of Vera. What the product is, what it does, the architecture
decisions, the manual test plan and the roadmap all live in the
[repository README](../README.md), so that there is one copy of them rather
than two that drift apart.

This file covers only what is specific to running and reading this project.

## Running locally

```
npm install
npm run dev
```

Production build: `npm run build`. Lint: `npx eslint .`

Once the API exists, start it first. Vite proxies `/api` to it so the browser
sees a single origin in development and CORS stays a production concern.

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
