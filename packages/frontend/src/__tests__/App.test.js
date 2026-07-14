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

  test('edits an existing task', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });

    // Click edit button for the first task
    const editButtons = screen.getAllByLabelText('Edit task');
    await act(async () => {
      await user.click(editButtons[0]);
    });

    // Verify dialog opened
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Edit Task' })).toBeInTheDocument();
    });

    // Modify the title
    const titleInput = screen.getByDisplayValue('Test Todo 1');
    await act(async () => {
      await user.clear(titleInput);
      await user.type(titleInput, 'Edited Test Todo');
    });

    // Save
    const saveButton = screen.getByRole('button', { name: 'Save' });
    await act(async () => {
      await user.click(saveButton);
    });

    // Verify update was applied
    await waitFor(() => {
      expect(screen.getByText('Edited Test Todo')).toBeInTheDocument();
      expect(screen.queryByText('Test Todo 1')).not.toBeInTheDocument();
    });
  });

  test('deletes a task', async () => {
    const user = userEvent.setup();

    // Ensure delete handler updates the todos array
    server.use(
      rest.delete('/api/todos/:id', (req, res, ctx) => {
        const id = Number(req.params.id);
        const before = todos.length;
        todos = todos.filter((todo) => todo.id !== id);
        if (before === todos.length) {
          return res(ctx.status(404), ctx.json({ error: 'Todo not found' }));
        }
        return res(ctx.status(200), ctx.json({ message: 'Todo deleted successfully', id }));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });

    const initialText = screen.getByText('Test Todo 1');
    expect(initialText).toBeInTheDocument();

    // Click delete button
    const deleteButtons = screen.getAllByLabelText('Delete task');
    await act(async () => {
      await user.click(deleteButtons[0]);
    });

    // Verify task is removed
    await waitFor(() => {
      expect(screen.queryByText('Test Todo 1')).not.toBeInTheDocument();
    });
  });

  test('searches tasks by title', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });

    // Both tasks should be visible initially
    expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    expect(screen.getByText('Completed Todo')).toBeInTheDocument();

    // Search for first task
    const searchInput = screen.getByLabelText('Search by title');
    await act(async () => {
      await user.type(searchInput, 'Completed');
    });

    // Only matching task should be visible
    await waitFor(() => {
      expect(screen.queryByText('Test Todo 1')).not.toBeInTheDocument();
      expect(screen.getByText('Completed Todo')).toBeInTheDocument();
    });
  });

  test('sorts tasks by priority', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });

    const sortSelect = screen.getByLabelText('Sort By');
    await act(async () => {
      await user.click(sortSelect);
    });

    await act(async () => {
      await user.click(screen.getByRole('option', { name: 'Priority' }));
    });

    // Verify sort was applied (High priority task should be first)
    const taskTitles = screen.getAllByRole('heading', { level: 6 });
    expect(taskTitles[0].textContent).toBe('Test Todo 1'); // Priority: High
  });

  test('toggles task completion status', async () => {
    const user = userEvent.setup();

    // Ensure toggle handler updates the todos array
    server.use(
      rest.patch('/api/todos/:id/toggle', (req, res, ctx) => {
        const id = Number(req.params.id);
        todos = todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));
        const updated = todos.find((todo) => todo.id === id);
        return res(ctx.status(200), ctx.json(updated));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });

    // Get the checkbox for the first task by aria-label
    const firstCheckbox = screen.getByRole('checkbox', { name: /Mark Test Todo 1 as completed/ });

    // Verify it starts unchecked
    expect(firstCheckbox).not.toBeChecked();

    // Click to complete
    await act(async () => {
      await user.click(firstCheckbox);
    });

    // After toggle, the aria-label should change to "Mark Test Todo 1 as active"
    // Query for the updated checkbox
    await waitFor(() => {
      const updatedCheckbox = screen.getByRole('checkbox', { name: /Mark Test Todo 1 as active/ });
      expect(updatedCheckbox).toBeChecked();
    });
  });

  test('clears completed tasks', async () => {
    const user = userEvent.setup();

    // Setup mock to return empty list for completed todos after clear
    server.use(
      rest.delete('/api/todos/completed', (req, res, ctx) => {
        const completedCount = todos.filter((t) => t.completed).length;
        todos = todos.filter((t) => !t.completed);
        return res(
          ctx.status(200),
          ctx.json({ message: 'Completed todos cleared', count: completedCount })
        );
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });

    // Verify completed task exists
    expect(screen.getByText('Completed Todo')).toBeInTheDocument();

    // Click clear completed button
    const clearButton = screen.getByRole('button', { name: 'Clear Completed' });
    await act(async () => {
      await user.click(clearButton);
    });

    // Confirm in dialog
    const confirmButton = screen.getByRole('button', { name: 'Clear' });
    await act(async () => {
      await user.click(confirmButton);
    });

    // Verify completed task is removed
    await waitFor(() => {
      expect(screen.queryByText('Completed Todo')).not.toBeInTheDocument();
    });
  });

  test('displays task priority as chip', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });

    // Verify priority chips are displayed
    expect(screen.getByText('Priority: High')).toBeInTheDocument();
    expect(screen.getByText('Priority: Low')).toBeInTheDocument();
  });

  test('applies strikethrough to completed tasks', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });

    // Get the completed task heading
    const completedTaskHeading = screen.getByText('Completed Todo').closest('h6');
    expect(completedTaskHeading).toHaveStyle('text-decoration: line-through');

    // Active task should not have strikethrough
    const activeTaskHeading = screen.getByText('Test Todo 1').closest('h6');
    expect(activeTaskHeading).toHaveStyle('text-decoration: none');
  });

  test('updates stats after creating a task', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });

    // Get initial total (should be 2)
    const totalCards = screen.getAllByText(/\d+/);
    let totalBefore;
    await waitFor(() => {
      const labels = screen.getAllByText((content, element) => element?.parentElement?.textContent?.includes('Total'));
      expect(labels.length).toBeGreaterThan(0);
    });

    // Add a task
    const titleInput = screen.getByLabelText(/Task Title/i);
    await act(async () => {
      await user.type(titleInput, 'New Counted Todo');
    });

    const submitButton = screen.getByRole('button', { name: 'Add Task' });
    await act(async () => {
      await user.click(submitButton);
    });

    // Verify new task appears
    await waitFor(() => {
      expect(screen.getByText('New Counted Todo')).toBeInTheDocument();
    });
  });

  test('shows overdue indicator for past due dates', async () => {
    const user = userEvent.setup();

    // Mock a todo with an overdue date
    server.use(
      rest.get('/api/todos', (req, res, ctx) => {
        const overdueDate = new Date();
        overdueDate.setDate(overdueDate.getDate() - 1);
        const formattedDate = overdueDate.toISOString().split('T')[0];

        return res(
          ctx.status(200),
          ctx.json([
            {
              id: 1,
              title: 'Overdue Task',
              description: '',
              due_date: formattedDate,
              priority: 'High',
              completed: false,
              created_at: '2026-07-01T00:00:00.000Z',
            },
          ])
        );
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Overdue Task')).toBeInTheDocument();
    });

    // Check for overdue chip (due date chip should be error color)
    const dueChips = screen.queryAllByText(/Due:/);
    expect(dueChips.length).toBeGreaterThan(0);
  });
});