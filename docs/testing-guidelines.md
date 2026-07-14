# Testing Guidelines

This document defines the testing principles and standards for the TODO app.

## Core Principles

- All tests must be isolated and independent.
- Each test must set up its own data and must not rely on other tests.
- Setup and teardown hooks are required so tests pass reliably across repeated runs.
- All new features must include appropriate tests.
- Tests should be maintainable, readable, and follow best practices.

## Unit Testing

- Framework: Jest.
- Unit tests should validate individual functions and React components in isolation.
- Naming convention: `*.test.js` or `*.test.ts`.
- Backend unit tests location: `packages/backend/__tests__/`.
- Frontend unit tests location: `packages/frontend/src/__tests__/`.
- Unit test file names should match the unit under test.
- Example: `app.test.js` for `app.js`.

## Integration Testing

- Frameworks: Jest + Supertest.
- Integration tests should validate backend API endpoints using real HTTP requests.
- Integration tests location: `packages/backend/__tests__/integration/`.
- Naming convention: `*.test.js` or `*.test.ts`.
- Integration test file names should clearly describe the endpoint group or behavior under test.
- Example: `todos-api.test.js` for TODO API endpoint coverage.

## End-to-End (E2E) Testing

- Required framework: Playwright.
- E2E tests should validate complete UI workflows through browser automation.
- E2E tests location: `tests/e2e/`.
- Naming convention: `*.spec.js` or `*.spec.ts`.
- E2E file names should reflect the user journey being tested.
- Example: `todo-workflow.spec.js`.
- Playwright tests must use one browser only.
- Playwright tests must use the Page Object Model (POM) pattern for maintainability.
- Limit E2E coverage to 5-8 critical user journeys, focused on happy paths and key edge cases.

## Port Configuration

- Always use environment variables with sensible defaults for port configuration.
- Backend default port pattern:

```js
const PORT = process.env.PORT || 3030;
```

- Frontend default port is 3000 and may be overridden with the `PORT` environment variable.
- This configuration must support CI/CD workflows that dynamically assign or detect ports.

## Quality Expectations

- Test suites should be deterministic and stable in local and CI environments.
- Avoid flaky tests by controlling test data, timing assumptions, and external dependencies.
- Prefer clear assertions and focused test scope over broad, hard-to-maintain test cases.
