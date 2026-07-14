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

  describe('GET /api/todos - Filtering and Sorting', () => {
    beforeEach(async () => {
      await createTodo('Alpha Task');
      const high = await createTodo('High Priority Task');
      const withDate = await createTodo('Due Soon Task');
      
      // Set priorities
      await request(app)
        .put(`/api/todos/${high.id}`)
        .send({ title: high.title, priority: 'High' });
      
      // Set due date
      await request(app)
        .put(`/api/todos/${withDate.id}`)
        .send({ title: withDate.title, dueDate: '2026-12-31' });

      // Complete one
      await request(app).patch(`/api/todos/${high.id}/toggle`);
    });

    it('should filter by status=active', async () => {
      const response = await request(app).get('/api/todos?status=active');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((t) => !t.completed)).toBe(true);
    });

    it('should filter by status=completed', async () => {
      const response = await request(app).get('/api/todos?status=completed');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((t) => t.completed)).toBe(true);
    });

    it('should search by title', async () => {
      const response = await request(app).get('/api/todos?search=Alpha');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some((t) => t.title.includes('Alpha'))).toBe(true);
    });

    it('should search case-insensitively', async () => {
      const response = await request(app).get('/api/todos?search=alpha');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should sort by createdAt descending', async () => {
      const response = await request(app).get('/api/todos?sortBy=createdAt&order=desc');
      
      expect(response.status).toBe(200);
      if (response.body.length > 1) {
        const first = new Date(response.body[0].created_at);
        const second = new Date(response.body[1].created_at);
        expect(first.getTime()).toBeGreaterThanOrEqual(second.getTime());
      }
    });

    it('should sort by createdAt ascending', async () => {
      const response = await request(app).get('/api/todos?sortBy=createdAt&order=asc');
      
      expect(response.status).toBe(200);
      if (response.body.length > 1) {
        const first = new Date(response.body[0].created_at);
        const second = new Date(response.body[1].created_at);
        expect(first.getTime()).toBeLessThanOrEqual(second.getTime());
      }
    });

    it('should sort by priority', async () => {
      const response = await request(app).get('/api/todos?sortBy=priority&order=desc');
      
      expect(response.status).toBe(200);
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      if (response.body.length > 1) {
        const first = priorityOrder[response.body[0].priority];
        const second = priorityOrder[response.body[1].priority];
        expect(first).toBeGreaterThanOrEqual(second);
      }
    });

    it('should sort by dueDate with nulls last in ascending order', async () => {
      const response = await request(app).get('/api/todos?sortBy=dueDate&order=asc');
      
      expect(response.status).toBe(200);
      // In SQL ORDER BY `due_date IS NULL, due_date ASC`, items with NULL dates 
      // sort after items with actual dates (nulls last) because IS NULL=1 sorts after IS NULL=0
      const nullIndex = response.body.findIndex((t) => t.due_date === null);
      const dateIndex = response.body.findIndex((t) => t.due_date !== null);
      if (nullIndex !== -1 && dateIndex !== -1) {
        // Nulls should come after dates in ascending order
        expect(dateIndex).toBeLessThan(nullIndex);
      }
    });

    it('should combine status filter with search', async () => {
      const response = await request(app).get('/api/todos?status=active&search=Alpha');
      
      expect(response.status).toBe(200);
      expect(response.body.every((t) => !t.completed)).toBe(true);
      expect(response.body.every((t) => t.title.toLowerCase().includes('alpha'))).toBe(true);
    });

    it('should handle empty search results', async () => {
      const response = await request(app).get('/api/todos?search=NONEXISTENT12345');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
});