const request = require('supertest');
const { app, db, seedDatabase } = require('../src/app');

beforeEach(() => {
  seedDatabase();
});

const createTodo = async (title = 'Temp Todo') => {
  const response = await request(app)
    .post('/api/todos')
    .send({ title, priority: 'Medium' })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

describe('API Endpoints', () => {
  describe('GET /api/todos', () => {
    it('should return all todos', async () => {
      const response = await request(app).get('/api/todos');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const todo = response.body[0];
      expect(todo).toHaveProperty('id');
      expect(todo).toHaveProperty('title');
      expect(todo).toHaveProperty('priority');
      expect(todo).toHaveProperty('completed');
    });
  });

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const payload = {
        title: 'Test Todo',
        description: 'Details',
        dueDate: '2026-07-20',
        priority: 'High',
      };

      const response = await request(app)
        .post('/api/todos')
        .send(payload)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(payload.title);
      expect(response.body.priority).toBe(payload.priority);
      expect(response.body.completed).toBe(false);
    });

    it('should return 400 if title is missing', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Task title is required');
    });

    it('should return 400 if title is empty', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ title: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Task title is required');
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('should update an existing todo', async () => {
      const todo = await createTodo('Editable Todo');
      const response = await request(app)
        .put(`/api/todos/${todo.id}`)
        .send({ title: 'Edited Todo', priority: 'Low' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Edited Todo');
      expect(response.body.priority).toBe('Low');
    });
  });

  describe('PATCH /api/todos/:id/toggle', () => {
    it('should toggle completion status', async () => {
      const todo = await createTodo('Toggle Todo');
      const response = await request(app).patch(`/api/todos/${todo.id}/toggle`);

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('should delete an existing todo', async () => {
      const todo = await createTodo('Delete Todo');

      const deleteResponse = await request(app).delete(`/api/todos/${todo.id}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ message: 'Todo deleted successfully', id: todo.id });

      const deleteAgain = await request(app).delete(`/api/todos/${todo.id}`);
      expect(deleteAgain.status).toBe(404);
      expect(deleteAgain.body).toHaveProperty('error', 'Todo not found');
    });

    it('should return 404 when todo does not exist', async () => {
      const response = await request(app).delete('/api/todos/999999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Todo not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).delete('/api/todos/abc');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid todo ID is required');
    });
  });

  describe('GET /api/todos/stats', () => {
    it('should return total, active and completed counts', async () => {
      const todo = await createTodo('Stats Todo');
      await request(app).patch(`/api/todos/${todo.id}/toggle`);

      const response = await request(app).get('/api/todos/stats');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('active');
      expect(response.body).toHaveProperty('completed');
      expect(response.body.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('DELETE /api/todos/completed', () => {
    it('should clear completed todos', async () => {
      const todo = await createTodo('Complete Me');
      await request(app).patch(`/api/todos/${todo.id}/toggle`);

      const response = await request(app).delete('/api/todos/completed');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count');
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });
  });
});