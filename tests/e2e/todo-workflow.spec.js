const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/todo-page');

test.describe('TODO workflow', () => {
  test('creates and completes a task', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const taskTitle = `E2E Task ${Date.now()}`;

    await todoPage.goto();
    await todoPage.addTask(taskTitle);

    await expect(page.getByText(taskTitle)).toBeVisible();

    await todoPage.markTaskComplete(taskTitle);
    await expect(page.getByRole('checkbox', { name: `Mark ${taskTitle} as active` })).toBeChecked();
  });
});
