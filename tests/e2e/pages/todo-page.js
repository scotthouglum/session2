class TodoPage {
  constructor(page) {
    this.page = page;
    this.titleInput = page.getByLabel('Task Title');
    this.addTaskButton = page.getByRole('button', { name: 'Add Task' });
    this.tasksHeading = page.getByRole('heading', { name: 'Tasks' });
    this.statusFilter = page.getByLabel('Status');
    this.clearCompletedButton = page.getByRole('button', { name: 'Clear Completed' });
  }

  async goto() {
    await this.page.goto('/');
    await this.tasksHeading.waitFor();
  }

  async addTask(title) {
    await this.titleInput.fill(title);
    await this.addTaskButton.click();
    await this.page.getByText(title).waitFor();
  }

  async markTaskComplete(title) {
    await this.page.getByRole('checkbox', { name: `Mark ${title} as completed` }).click();
    await this.page.getByRole('checkbox', { name: `Mark ${title} as active` }).waitFor();
  }

  async filterCompleted() {
    await this.statusFilter.click();
    await this.page.getByRole('option', { name: 'completed' }).click();
  }

  async clearCompleted() {
    await this.clearCompletedButton.click();
    await this.page.getByRole('button', { name: 'Clear' }).click();
  }
}

module.exports = { TodoPage };
