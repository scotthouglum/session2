const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/todo-page');

test.describe('TODO filtering', () => {
  test('filters completed tasks and clears them', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const taskTitle = `Completed Task ${Date.now()}`;

    await todoPage.goto();
    await todoPage.addTask(taskTitle);
    await todoPage.markTaskComplete(taskTitle);

    await todoPage.filterCompleted();
    await expect(page.getByText(taskTitle)).toBeVisible();

    await todoPage.clearCompleted();
    await expect(page.getByText(taskTitle)).not.toBeVisible();
  });
});
