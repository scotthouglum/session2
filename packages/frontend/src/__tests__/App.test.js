import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

let todos = [
  {
    id: 1,
    title: 'Test Todo 1',
    description: 'A first todo',
    due_date: null,
    priority: 'High',
    completed: false,
    created_at: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 2,
    title: 'Completed Todo',
    description: '',
    due_date: null,
    priority: 'Low',
    completed: true,
    created_at: '2026-07-02T00:00:00.000Z',
  },
];

const computeStats = () => ({
  total: todos.length,
  active: todos.filter((todo) => !todo.completed).length,
  completed: todos.filter((todo) => todo.completed).length,
});

const server = setupServer(
  rest.get('/api/todos', (req, res, ctx) => {
    const status = req.url.searchParams.get('status') || 'all';
    const search = (req.url.searchParams.get('search') || '').toLowerCase();

    let filtered = [...todos];
    if (status === 'active') {
      filtered = filtered.filter((todo) => !todo.completed);
    } else if (status === 'completed') {
      filtered = filtered.filter((todo) => todo.completed);
    }

    if (search) {
      filtered = filtered.filter((todo) => todo.title.toLowerCase().includes(search));
    }

    return res(ctx.status(200), ctx.json(filtered));
  }),

  rest.get('/api/todos/stats', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(computeStats()));
  }),

  rest.post('/api/todos', async (req, res, ctx) => {
    const body = await req.json();
    const title = (body.title || '').trim();

    if (!title) {
      return res(ctx.status(400), ctx.json({ error: 'Task title is required' }));
    }

    const newTodo = {
      id: todos.length + 1,
      title,
      description: body.description || '',
      due_date: body.dueDate || null,
      priority: body.priority || 'Medium',
      completed: false,
      created_at: new Date().toISOString(),
    };

    todos = [newTodo, ...todos];
    return res(ctx.status(201), ctx.json(newTodo));
  }),

  rest.patch('/api/todos/:id/toggle', (req, res, ctx) => {
    const id = Number(req.params.id);
    todos = todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));
    const updated = todos.find((todo) => todo.id === id);
    return res(ctx.status(200), ctx.json(updated));
  }),

  rest.put('/api/todos/:id', async (req, res, ctx) => {
    const id = Number(req.params.id);
    const body = await req.json();
    todos = todos.map((todo) => (todo.id === id ? {
      ...todo,
      title: body.title,
      description: body.description,
      due_date: body.dueDate,
      priority: body.priority,
    } : todo));
    const updated = todos.find((todo) => todo.id === id);
    return res(ctx.status(200), ctx.json(updated));
  }),

  rest.delete('/api/todos/:id', (req, res, ctx) => {
    const id = Number(req.params.id);
    todos = todos.filter((todo) => todo.id !== id);
    return res(ctx.status(200), ctx.json({ message: 'Todo deleted successfully', id }));
  }),

  rest.delete('/api/todos/completed', (req, res, ctx) => {
    const before = todos.length;
    todos = todos.filter((todo) => !todo.completed);
    return res(ctx.status(200), ctx.json({ message: 'Completed todos cleared', count: before - todos.length }));
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  todos = [
    {
      id: 1,
      title: 'Test Todo 1',
      description: 'A first todo',
      due_date: null,
      priority: 'High',
      completed: false,
      created_at: '2026-07-01T00:00:00.000Z',
    },
    {
      id: 2,
      title: 'Completed Todo',
      description: '',
      due_date: null,
      priority: 'Low',
      completed: true,
      created_at: '2026-07-02T00:00:00.000Z',
    },
  ];
  server.resetHandlers();
});
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the app header and summary cards', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('TODO Command Center')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  test('loads and displays tasks', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
      expect(screen.getByText('Completed Todo')).toBeInTheDocument();
    });
  });

  test('adds a new task', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/Task Title/i);
    await act(async () => {
      await user.type(titleInput, 'New Test Todo');
    });

    const submitButton = screen.getByRole('button', { name: 'Add Task' });
    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('New Test Todo')).toBeInTheDocument();
    });
  });

  test('shows validation message for empty title on create', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    const submitButton = screen.getByRole('button', { name: 'Add Task' });
    await act(async () => {
      await user.click(submitButton);
    });

    expect(screen.getByText('Task title is required')).toBeInTheDocument();
  });

  test('handles API error on load', async () => {
    server.use(
      rest.get('/api/todos', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to load tasks')).toBeInTheDocument();
    });
  });

  test('shows empty state when no tasks match filter', async () => {
    const user = userEvent.setup();

    server.use(
      rest.get('/api/todos', (req, res, ctx) => {
        const status = req.url.searchParams.get('status');
        if (status === 'active') {
          return res(ctx.status(200), ctx.json([]));
        }

        return res(ctx.status(200), ctx.json(todos));
      })
    );

    await act(async () => {
      render(<App />);
    });

    const statusSelect = screen.getByLabelText('Status');
    await act(async () => {
      await user.click(statusSelect);
    });
    await act(async () => {
      await user.click(screen.getByRole('option', { name: 'active' }));
    });

    await waitFor(() => {
      expect(screen.getByText('No tasks found for the current view.')).toBeInTheDocument();
    });
  });
});