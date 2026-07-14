# UI Guidelines for the TODO App

This document defines the core UI guidelines for building a consistent, accessible, and user-friendly TODO application.

## Design System and Components

- The UI should use Material Design components (for example, Material UI for React) as the primary component library.
- Core controls should use standardized Material components:
  - Buttons: `Button`, `IconButton`
  - Inputs: `TextField`, `Select`, `Checkbox`
  - Layout/feedback: `Card`, `Snackbar`, `Dialog`, `Tooltip`
- Custom components should follow Material spacing, typography scale, and interaction patterns.

## Layout and Structure

- The app should be responsive and usable on mobile, tablet, and desktop.
- Primary layout sections should include:
  - App header/title area
  - Task input/form area
  - Filter/sort controls
  - Task list/content area
- Use an 8px spacing system for margins, paddings, and gaps.
- Keep key actions visible without excessive scrolling on common laptop screen sizes.

## Color and Visual Style

- Use a clear, high-contrast light theme by default.
- Recommended palette:
  - Primary: `#1565C0` (blue)
  - Secondary: `#2E7D32` (green)
  - Warning: `#ED6C02` (orange)
  - Error: `#D32F2F` (red)
  - Background: `#F7F9FC`
  - Surface: `#FFFFFF`
  - Text primary: `#1F2937`
- Status colors should be semantically mapped and used consistently:
  - Completed tasks: success/green cues
  - Overdue tasks: error/red cues
  - Due soon tasks: warning/orange cues
- Do not rely on color alone to convey status; pair color with text/icon indicators.

## Typography and Iconography

- Use a consistent sans-serif font stack aligned with Material defaults (for example, Roboto, system sans-serif fallback).
- Typography hierarchy should include clear styles for:
  - Page title
  - Section headings
  - Body/task text
  - Helper/error text
- Icon usage should be consistent and recognizable (add, edit, delete, complete, filter, sort).

## Buttons and Interactive Elements

- Primary actions (for example, "Add Task", "Save") should use contained primary buttons.
- Secondary actions should use outlined or text buttons.
- Destructive actions (for example, delete) should use error styling and require confirmation when high impact.
- All clickable controls must have visible hover, focus, and disabled states.
- Minimum touch target size should be 44x44 px for mobile usability.

## Forms and Validation UX

- Required fields should be clearly marked.
- Validation errors should appear inline near the relevant field.
- Error messages should be specific and actionable (for example, "Task title is required").
- Date and priority selection controls should be easy to scan and keyboard accessible.
- Preserve user input when validation fails.

## Task List Presentation

- Each task item should clearly show:
  - Title
  - Completion status
  - Due date (if present)
  - Priority (if present)
- Completed tasks should be visually distinct (for example, checkbox checked and subdued text).
- Overdue tasks should be clearly indicated.
- Long task titles/descriptions should wrap cleanly without breaking layout.

## Feedback and State Handling

- Show clear empty states when no tasks exist or no tasks match filters/search.
- Show loading indicators for async operations.
- Show success/error notifications for key actions (create, edit, delete).
- Confirmation dialogs should be used for destructive bulk actions (for example, "Clear completed").

## Accessibility Requirements

- Meet WCAG 2.1 AA contrast requirements for text and UI controls.
- All functionality must be available via keyboard:
  - Logical tab order
  - Visible focus indicators
  - Keyboard activation for interactive controls
- Provide accessible names/labels for form fields and icon-only buttons.
- Associate error messages with inputs for screen readers.
- Use semantic HTML landmarks and headings to support navigation.
- Respect reduced motion preferences for non-essential animations.

## Consistency and Maintainability

- Reuse shared theme tokens (colors, spacing, typography) rather than hardcoding values repeatedly.
- Keep component behavior consistent across the app (same control, same pattern).
- Any deviations from these guidelines should be documented with rationale.
