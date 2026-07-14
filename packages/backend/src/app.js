const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize in-memory SQLite database
const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'Medium',
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (priority IN ('Low', 'Medium', 'High'))
  )
`);

const insertTodoStmt = db.prepare(`
  INSERT INTO todos (title, description, due_date, priority)
  VALUES (@title, @description, @dueDate, @priority)
`);

const selectTodoByIdStmt = db.prepare('SELECT * FROM todos WHERE id = ?');

const seedTodos = [
  { title: 'Set up TODO app baseline', description: 'Wire frontend and backend', dueDate: null, priority: 'High' },
  { title: 'Create first task flow', description: 'Support create and list', dueDate: null, priority: 'Medium' },
  { title: 'Write API tests', description: 'Cover happy paths and failures', dueDate: null, priority: 'Low' },
];

const seedDatabase = () => {
  const clearStmt = db.prepare('DELETE FROM todos');
  clearStmt.run();

  seedTodos.forEach((todo) => {
    insertTodoStmt.run(todo);
  });
};

seedDatabase();

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeTodo = (todo) => ({
  ...todo,
  completed: Boolean(todo.completed),
});

const buildSortClause = (sortBy = 'createdAt', order = 'desc') => {
  const normalizedOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  if (sortBy === 'dueDate') {
    return `due_date IS NULL, due_date ${normalizedOrder}, created_at DESC`;
  }

  if (sortBy === 'priority') {
    const priorityRank = "CASE priority WHEN 'Low' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END";
    return `${priorityRank} ${normalizedOrder}, created_at DESC`;
  }

  return `created_at ${normalizedOrder}`;
};

// API Routes
app.get('/api/todos', (req, res) => {
  try {
    const { status = 'all', search = '', sortBy = 'createdAt', order = 'desc' } = req.query;
    const where = [];
    const params = [];

    if (status === 'active') {
      where.push('completed = 0');
    } else if (status === 'completed') {
      where.push('completed = 1');
    }

    if (search && typeof search === 'string' && search.trim()) {
      where.push('title LIKE ?');
      params.push(`%${search.trim()}%`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderByClause = buildSortClause(sortBy, order);
    const query = `SELECT * FROM todos ${whereClause} ORDER BY ${orderByClause}`;
    const todos = db.prepare(query).all(...params).map(normalizeTodo);

    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

app.get('/api/todos/stats', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) AS completed
      FROM todos
    `).get();

    res.json({
      total: stats.total || 0,
      active: stats.active || 0,
      completed: stats.completed || 0,
    });
  } catch (error) {
    console.error('Error fetching todo stats:', error);
    res.status(500).json({ error: 'Failed to fetch todo stats' });
  }
});

app.post('/api/todos', (req, res) => {
  try {
    const { title, description = '', dueDate = null, priority = 'Medium' } = req.body;
    const normalizedTitle = typeof title === 'string' ? title.trim() : '';
    const validPriorities = new Set(['Low', 'Medium', 'High']);

    if (!normalizedTitle) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    if (!validPriorities.has(priority)) {
      return res.status(400).json({ error: 'Priority must be Low, Medium, or High' });
    }

    const result = insertTodoStmt.run({
      title: normalizedTitle,
      description,
      dueDate,
      priority,
    });

    const id = result.lastInsertRowid;
    const newTodo = normalizeTodo(selectTodoByIdStmt.get(id));

    res.status(201).json(newTodo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

app.put('/api/todos/:id', (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Valid todo ID is required' });
    }

    const existingTodo = selectTodoByIdStmt.get(id);
    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const { title, description, dueDate, priority, completed } = req.body;
    const updates = [];
    const params = [];

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Task title is required' });
      }
      updates.push('title = ?');
      params.push(title.trim());
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (dueDate !== undefined) {
      updates.push('due_date = ?');
      params.push(dueDate);
    }

    if (priority !== undefined) {
      const validPriorities = new Set(['Low', 'Medium', 'High']);
      if (!validPriorities.has(priority)) {
        return res.status(400).json({ error: 'Priority must be Low, Medium, or High' });
      }
      updates.push('priority = ?');
      params.push(priority);
    }

    if (completed !== undefined) {
      updates.push('completed = ?');
      params.push(completed ? 1 : 0);
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'At least one updatable field is required' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    const updateQuery = `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id);
    db.prepare(updateQuery).run(...params);

    const updatedTodo = normalizeTodo(selectTodoByIdStmt.get(id));
    res.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

app.patch('/api/todos/:id/toggle', (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Valid todo ID is required' });
    }

    const existingTodo = selectTodoByIdStmt.get(id);
    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const nextCompleted = existingTodo.completed ? 0 : 1;
    db.prepare('UPDATE todos SET completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(nextCompleted, id);

    const updatedTodo = normalizeTodo(selectTodoByIdStmt.get(id));
    res.json(updatedTodo);
  } catch (error) {
    console.error('Error toggling todo:', error);
    res.status(500).json({ error: 'Failed to toggle todo' });
  }
});

app.delete('/api/todos/completed', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM todos WHERE completed = 1').run();
    res.json({ message: 'Completed todos cleared', count: result.changes });
  } catch (error) {
    console.error('Error clearing completed todos:', error);
    res.status(500).json({ error: 'Failed to clear completed todos' });
  }
});

app.delete('/api/todos/:id', (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Valid todo ID is required' });
    }

    const existingTodo = selectTodoByIdStmt.get(id);
    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    db.prepare('DELETE FROM todos WHERE id = ?').run(id);
    res.json({ message: 'Todo deleted successfully', id });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

module.exports = {
  app,
  db,
  seedDatabase,
};