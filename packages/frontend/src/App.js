import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import './App.css';

const priorities = ['Low', 'Medium', 'High'];
const statusOptions = ['all', 'active', 'completed'];
const sortOptions = [
  { label: 'Created Date', value: 'createdAt' },
  { label: 'Due Date', value: 'dueDate' },
  { label: 'Priority', value: 'priority' },
];

const initialForm = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'Medium',
};

function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', message: '' });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState(initialForm);
  const [editTodoId, setEditTodoId] = useState(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      status: statusFilter,
      sortBy,
      order: sortOrder,
    });

    if (searchText.trim()) {
      params.set('search', searchText.trim());
    }

    return params.toString();
  }, [searchText, sortBy, sortOrder, statusFilter]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/todos?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to load tasks');
      }

      const payload = await response.json();
      setTodos(payload);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/todos/stats');
      if (!response.ok) {
        throw new Error('Failed to load task summary');
      }

      const payload = await response.json();
      setStats(payload);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [queryString]);

  useEffect(() => {
    fetchStats();
  }, []);

  const refreshAll = async () => {
    await Promise.all([fetchTodos(), fetchStats()]);
  };

  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleFormChange = (field, value, target = 'create') => {
    if (target === 'edit') {
      setEditForm((current) => ({ ...current, [field]: value }));
      return;
    }

    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateTodo = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setFormError('Task title is required');
      return;
    }

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description,
          dueDate: form.dueDate || null,
          priority: form.priority,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Failed to create task');
      }

      setForm(initialForm);
      setFormError('');
      await refreshAll();
      showMessage('Task created');
    } catch (requestError) {
      setFormError(requestError.message);
    }
  };

  const handleToggleTodo = async (id) => {
    try {
      const response = await fetch(`/api/todos/${id}/toggle`, { method: 'PATCH' });
      if (!response.ok) {
        throw new Error('Failed to toggle task status');
      }

      await refreshAll();
    } catch (requestError) {
      showMessage(requestError.message, 'error');
    }
  };

  const openEditDialog = (todo) => {
    setEditTodoId(todo.id);
    setEditForm({
      title: todo.title,
      description: todo.description || '',
      dueDate: todo.due_date || '',
      priority: todo.priority,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) {
      showMessage('Task title is required', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/todos/${editTodoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description,
          dueDate: editForm.dueDate || null,
          priority: editForm.priority,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Failed to update task');
      }

      setEditDialogOpen(false);
      setEditTodoId(null);
      await refreshAll();
      showMessage('Task updated');
    } catch (requestError) {
      showMessage(requestError.message, 'error');
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      await refreshAll();
      showMessage('Task deleted');
    } catch (requestError) {
      showMessage(requestError.message, 'error');
    }
  };

  const handleClearCompleted = async () => {
    try {
      const response = await fetch('/api/todos/completed', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to clear completed tasks');
      }

      setClearDialogOpen(false);
      await refreshAll();
      showMessage('Completed tasks cleared');
    } catch (requestError) {
      showMessage(requestError.message, 'error');
    }
  };

  const dueSoon = (dueDate) => {
    if (!dueDate) {
      return false;
    }

    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();
    return diff > 0 && diff <= 48 * 60 * 60 * 1000;
  };

  const isOverdue = (todo) => Boolean(todo.due_date) && !todo.completed && new Date(todo.due_date) < new Date();

  return (
    <Box className="app-shell">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box component="header" sx={{ textAlign: 'left' }}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              TODO Command Center
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track, prioritize, and complete your tasks with focus.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">Total</Typography>
                  <Typography variant="h4">{stats.total}</Typography>
                </CardContent>
              </Card>
            </Box>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">Active</Typography>
                  <Typography variant="h4">{stats.active}</Typography>
                </CardContent>
              </Card>
            </Box>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">Completed</Typography>
                  <Typography variant="h4">{stats.completed}</Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>Add Task</Typography>
              <Box component="form" onSubmit={handleCreateTodo}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(12, minmax(0, 1fr))',
                    },
                  }}
                >
                  <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                    <TextField
                      required
                      fullWidth
                      label="Task Title"
                      value={form.title}
                      onChange={(event) => handleFormChange('title', event.target.value)}
                      error={Boolean(formError)}
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={form.description}
                      onChange={(event) => handleFormChange('description', event.target.value)}
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
                    <TextField
                      fullWidth
                      label="Due Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={form.dueDate}
                      onChange={(event) => handleFormChange('dueDate', event.target.value)}
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
                    <FormControl fullWidth>
                      <InputLabel id="create-priority-label">Priority</InputLabel>
                      <Select
                        labelId="create-priority-label"
                        label="Priority"
                        value={form.priority}
                        onChange={(event) => handleFormChange('priority', event.target.value)}
                      >
                        {priorities.map((priority) => (
                          <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' }, display: 'flex', alignItems: 'center' }}>
                    <Button variant="contained" color="primary" fullWidth type="submit">Add Task</Button>
                  </Box>
                </Box>
              </Box>
              {formError && (
                <Typography color="error" sx={{ mt: 1 }}>{formError}</Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                <TextField
                  label="Search by title"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                  sx={{ flex: 1 }}
                />

                <FormControl sx={{ minWidth: 160 }}>
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    label="Status"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 180 }}>
                  <InputLabel id="sort-by-label">Sort By</InputLabel>
                  <Select
                    labelId="sort-by-label"
                    label="Sort By"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel id="sort-order-label">Order</InputLabel>
                  <Select
                    labelId="sort-order-label"
                    label="Order"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                  >
                    <MenuItem value="asc">Ascending</MenuItem>
                    <MenuItem value="desc">Descending</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setClearDialogOpen(true)}
                  disabled={stats.completed === 0}
                >
                  Clear Completed
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>Tasks</Typography>

              {loading && <Typography>Loading tasks...</Typography>}
              {!loading && error && <Alert severity="error">{error}</Alert>}

              {!loading && !error && todos.length === 0 && (
                <Alert severity="info">No tasks found for the current view.</Alert>
              )}

              {!loading && !error && todos.length > 0 && (
                <Stack spacing={1.5}>
                  {todos.map((todo) => (
                    <Card key={todo.id} variant="outlined" sx={{ borderLeft: isOverdue(todo) ? '4px solid #D32F2F' : '4px solid #1565C0' }}>
                      <CardContent>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
                          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1 }}>
                            <Checkbox
                              checked={todo.completed}
                              onChange={() => handleToggleTodo(todo.id)}
                              slotProps={{
                                input: {
                                  'aria-label': `Mark ${todo.title} as ${todo.completed ? 'active' : 'completed'}`,
                                },
                              }}
                            />
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ textDecoration: todo.completed ? 'line-through' : 'none', color: todo.completed ? 'text.secondary' : 'text.primary' }}
                              >
                                {todo.title}
                              </Typography>
                              {todo.description && (
                                <Typography color="text.secondary">{todo.description}</Typography>
                              )}
                              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                                <Chip size="small" label={`Priority: ${todo.priority}`} color={todo.priority === 'High' ? 'error' : 'default'} />
                                {todo.due_date && <Chip size="small" label={`Due: ${todo.due_date}`} color={isOverdue(todo) ? 'error' : dueSoon(todo.due_date) ? 'warning' : 'default'} />}
                                <Chip size="small" label={todo.completed ? 'Completed' : 'Active'} color={todo.completed ? 'success' : 'primary'} />
                              </Stack>
                            </Box>
                          </Stack>

                          <Stack direction="row" spacing={1}>
                            <IconButton onClick={() => openEditDialog(todo)} aria-label="Edit task">
                              <EditOutlinedIcon />
                            </IconButton>
                            <IconButton onClick={() => handleDeleteTodo(todo.id)} aria-label="Delete task" color="error">
                              <DeleteOutlinedIcon />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Container>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              required
              label="Task Title"
              value={editForm.title}
              onChange={(event) => handleFormChange('title', event.target.value, 'edit')}
            />
            <TextField
              label="Description"
              value={editForm.description}
              onChange={(event) => handleFormChange('description', event.target.value, 'edit')}
            />
            <TextField
              label="Due Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={editForm.dueDate}
              onChange={(event) => handleFormChange('dueDate', event.target.value, 'edit')}
            />
            <FormControl fullWidth>
              <InputLabel id="edit-priority-label">Priority</InputLabel>
              <Select
                labelId="edit-priority-label"
                label="Priority"
                value={editForm.priority}
                onChange={(event) => handleFormChange('priority', event.target.value, 'edit')}
              >
                {priorities.map((priority) => (
                  <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
        <DialogTitle>Clear completed tasks?</DialogTitle>
        <DialogContent>
          <Typography>This action removes all completed tasks and cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleClearCompleted}>Clear</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      >
        <Alert onClose={() => setSnackbar((current) => ({ ...current, open: false }))} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;