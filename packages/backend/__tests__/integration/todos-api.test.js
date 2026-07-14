const request = require('supertest');
const { app, seedDatabase } = require('../../src/app');

describe('TODO API Integration', () => {
  beforeEach(() => {
    seedDatabase();
  });

  it('creates, updates, and deletes a todo through HTTP endpoints', async () => {
    const createResponse = await request(app)
      .post('/api/todos')
      .send({ title: 'Integration Todo', priority: 'High' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.title).toBe('Integration Todo');

    const todoId = createResponse.body.id;

    const updateResponse = await request(app)
      .put(`/api/todos/${todoId}`)
      .send({ title: 'Integration Todo Updated', completed: true });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.title).toBe('Integration Todo Updated');
    expect(updateResponse.body.completed).toBe(true);

    const deleteResponse = await request(app).delete(`/api/todos/${todoId}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.id).toBe(todoId);
  });

  it('supports query filtering for completed todos', async () => {
    const createResponse = await request(app)
      .post('/api/todos')
      .send({ title: 'Filter Todo', priority: 'Medium' });

    await request(app).patch(`/api/todos/${createResponse.body.id}/toggle`);

    const response = await request(app).get('/api/todos?status=completed');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.every((todo) => todo.completed)).toBe(true);
  });
});
