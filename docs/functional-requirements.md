# Functional Requirements for the TODO App

This document defines the core functional requirements for the TODO application.

## Task Creation

- The user can create a new task with a required title.
- The user can optionally add a description when creating a task.
- The user can optionally assign a due date to a task.
- The user can optionally assign a priority level (Low, Medium, High) to a task.

## Task Viewing

- The user can view all tasks in a list.
- Each task displays at minimum: title, completion status, due date (if set), and priority (if set).
- The user can view task counts by status (for example: total, active, completed).

## Task Editing and Completion

- The user can edit an existing task’s title.
- The user can edit an existing task’s description.
- The user can edit an existing task’s due date.
- The user can edit an existing task’s priority.
- The user can mark a task as completed.
- The user can mark a completed task as active again.

## Task Deletion

- The user can delete an individual task.
- The user can clear all completed tasks in one action.

## Sorting and Filtering

- The user can filter tasks by status (All, Active, Completed).
- The user can sort tasks by due date.
- The user can sort tasks by priority.
- The user can sort tasks by creation date.
- If no explicit sort is selected, tasks are shown in creation order (newest first or oldest first, defined consistently).

## Search

- The user can search tasks by title keywords.
- The search results update to show only matching tasks.

## Validation and Error Handling

- The app prevents creating a task with an empty title.
- The app provides user-friendly validation messages for invalid input.

## Persistence

- Tasks persist across browser refreshes (for example, via local storage or backend API).
- A saved task keeps its properties (title, description, due date, priority, status, and timestamps).
