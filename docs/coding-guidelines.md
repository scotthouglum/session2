# Coding Guidelines

This document describes the coding style and quality principles for the TODO app project. It is intended to keep the codebase consistent, easy to read, and safe to evolve as features are added.

## Style and Formatting

Code should prioritize clarity over cleverness. Use descriptive names for variables, functions, and components so purpose is obvious without heavy commenting. Keep functions focused on one responsibility and prefer small, composable units over large, multi-purpose blocks.

Formatting should remain consistent across the repository. Follow established project conventions for indentation, spacing, and line breaks, and avoid introducing one-off style patterns in individual files. When formatting decisions are ambiguous, choose the most readable option and align with nearby code.

Comments should explain intent, constraints, or non-obvious tradeoffs, not restate what the code already says. Remove outdated comments when behavior changes.

## Import Organization

Organize imports in a predictable order so files are easy to scan:

1. Built-in or platform modules.
2. External dependencies from npm packages.
3. Internal modules from the project.
4. Relative imports from nearby files.

Within each group, keep imports alphabetized where practical. Avoid unused imports and remove dead dependencies during refactors. Prefer explicit named imports when they improve readability and maintainability.

## Linting and Static Checks

Use ESLint as the baseline quality gate for JavaScript and React code. Lint warnings and errors should be resolved rather than ignored, except in rare, justified cases. If a lint rule must be disabled, scope the disable as narrowly as possible and include a clear rationale.

Run linting regularly during development and before submitting changes. Treat linting as feedback that prevents consistency drift and common defects.

## DRY and Reuse

Apply the DRY principle thoughtfully. Avoid repeating business logic, validation rules, and transformation code across modules. When duplication appears, extract shared helpers or reusable components.

Do not over-abstract too early. Reuse should improve clarity and reduce maintenance burden; it should not create indirection that makes code harder to follow.

## Code Quality and Maintainability

Favor simple control flow and explicit behavior. Handle edge cases intentionally, especially around task creation, editing, filtering, and persistence.

Keep modules cohesive and boundaries clear between frontend UI concerns and backend API concerns. Shared assumptions, such as data shapes and validation behavior, should be documented and enforced consistently.

Prefer immutable updates where practical, especially in frontend state management, to reduce side effects and make behavior easier to reason about.

## Error Handling and Logging

Handle expected failures gracefully and provide actionable error messages. Do not swallow errors silently.

Log useful debugging context in development while avoiding noisy or redundant logs. Never log sensitive data.

## Testing Expectations

Code changes should be accompanied by appropriate tests following the repository testing guidelines. New behavior should include tests for success paths and key failure or edge conditions.

When fixing bugs, add or update tests that would have caught the issue to prevent regressions.

## Review Readiness

Before opening a pull request, ensure changes are understandable and scoped. Confirm code is lint-clean, tests pass, and obsolete code has been removed.

A good change should be easy for another developer to review quickly, reason about safely, and modify later without introducing risk.
