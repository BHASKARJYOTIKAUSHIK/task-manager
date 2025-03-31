import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Box, Container, Typography, TextField, Button, IconButton, 
  List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
  Checkbox, Select, MenuItem, FormControl, InputLabel, Grid, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, AppBar,
  Toolbar, useMediaQuery, Drawer, Divider, Card, CardContent,
  CardActions, Stack, LinearProgress, Tooltip, Alert, Snackbar
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

function App() {
  // Theme configuration
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true' ? true : false;
  });
  
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#3f51b5',
      },
      secondary: {
        main: '#f50057',
      },
    },
  });

  // State for tasks
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  
  const [newTask, setNewTask] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Filtering and sorting
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  
  // Priority options
  const priorities = ['Low', 'Medium', 'High'];
  
  // Media query for responsive design
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);
  
  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // DnD functionality setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Task management functions
  const addTask = () => {
    if (newTask.trim() === '') return;
    
    const newTaskObj = {
      id: Date.now().toString(),
      text: newTask,
      completed: false,
      createdAt: new Date().toISOString(),
      priority: 'Medium',
    };
    
    setTasks([...tasks, newTaskObj]);
    setNewTask('');
    showSnackbar('Task added successfully', 'success');
  };
  
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
    showSnackbar('Task deleted', 'info');
  };
  
  const toggleTaskCompletion = (id) => {
    setTasks(
      tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };
  
  const openEditForm = (task) => {
    setEditingTask(task);
    setEditFormOpen(true);
  };
  
  const saveEditedTask = () => {
    setTasks(
      tasks.map(task => 
        task.id === editingTask.id ? editingTask : task
      )
    );
    setEditFormOpen(false);
    showSnackbar('Task updated successfully', 'success');
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setTasks(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);
        
        return newItems;
      });
      showSnackbar('Task order updated', 'info');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = () => {
    let result = [...tasks];
    
    // Apply filters
    if (filterStatus !== 'all') {
      const isCompleted = filterStatus === 'completed';
      result = result.filter(task => task.completed === isCompleted);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return sortDirection === 'asc' 
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'priority') {
        const priorityMap = { 'Low': 1, 'Medium': 2, 'High': 3 };
        return sortDirection === 'asc'
          ? priorityMap[a.priority] - priorityMap[b.priority]
          : priorityMap[b.priority] - priorityMap[a.priority];
      }
      return 0;
    });
    
    return result;
  };

  // SortableTask component for drag and drop
  function SortableTask({ task }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: task.id });
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    
    const getPriorityColor = (priority) => {
      switch(priority) {
        case 'High': return '#f44336';
        case 'Medium': return '#ff9800';
        case 'Low': return '#4caf50';
        default: return '#757575';
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    };
    
    return (
      <Paper 
        ref={setNodeRef} 
        style={style} 
        elevation={2} 
        sx={{ 
          my: 1, 
          p: 0, 
          borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
          opacity: task.completed ? 0.7 : 1,
          textDecoration: task.completed ? 'line-through' : 'none'
        }}
      >
        <ListItem>
          <ListItemIcon {...attributes} {...listeners} sx={{ cursor: 'grab' }}>
            <DragIndicatorIcon />
          </ListItemIcon>
          
          <ListItemIcon>
            <Checkbox
              edge="start"
              checked={task.completed}
              onChange={() => toggleTaskCompletion(task.id)}
              color="primary"
            />
          </ListItemIcon>
          
          <ListItemText
            primary={task.text}
            secondary={
              <React.Fragment>
                <Typography variant="body2" component="span" sx={{ display: 'block' }}>
                  {formatDate(task.createdAt)}
                </Typography>
                <Chip 
                  label={task.priority} 
                  size="small" 
                  sx={{ 
                    backgroundColor: getPriorityColor(task.priority),
                    color: 'white',
                    mt: 0.5
                  }} 
                />
              </React.Fragment>
            }
          />
          
          <ListItemSecondaryAction>
            <IconButton edge="end" onClick={() => openEditForm(task)} disabled={task.completed}>
              <EditIcon />
            </IconButton>
            <IconButton edge="end" onClick={() => deleteTask(task.id)}>
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      </Paper>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary'
      }}>
        <AppBar position="static">
          <Toolbar>
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setDrawerOpen(true)}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Task Master
            </Typography>
            
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  color="inherit" 
                  startIcon={<FilterListIcon />}
                  onClick={() => setFilterDialogOpen(true)}
                >
                  Filter & Sort
                </Button>
              </Box>
            )}
            
            <IconButton color="inherit" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Toolbar>
        </AppBar>
        
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <Box sx={{ width: 250, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Options</Typography>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<FilterListIcon />}
              onClick={() => {
                setFilterDialogOpen(true);
                setDrawerOpen(false);
              }}
              sx={{ mb: 1 }}
            >
              Filter & Sort
            </Button>
          </Box>
        </Drawer>
        
        <Container maxWidth="md" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Task Dashboard
                </Typography>
                
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Add a new task"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 2 }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={addTask}
                  >
                    Add
                  </Button>
                </Box>
                
                {tasks.length > 0 ? (
                  <Box sx={{ mt: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Your Tasks ({filteredAndSortedTasks().length})
                      </Typography>
                      
                      {!isMobile && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip 
                            label={`Status: ${filterStatus === 'all' ? 'All' : filterStatus === 'completed' ? 'Completed' : 'Active'}`} 
                            color="primary" 
                            variant="outlined"
                          />
                          <Chip 
                            label={`Sort: ${sortBy === 'date' ? 'Date' : 'Priority'} (${sortDirection === 'desc' ? 'Desc' : 'Asc'})`} 
                            color="secondary" 
                            variant="outlined"
                          />
                        </Box>
                      )}
                    </Box>
                    
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                      modifiers={[restrictToVerticalAxis]}
                    >
                      <SortableContext
                        items={filteredAndSortedTasks().map(task => task.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <List>
                          {filteredAndSortedTasks().map((task) => (
                            <SortableTask key={task.id} task={task} />
                          ))}
                        </List>
                      </SortableContext>
                    </DndContext>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                      No tasks yet. Add your first task above!
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
        
        {/* Task Edit Dialog */}
        <Dialog open={editFormOpen} onClose={() => setEditFormOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Edit Task</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Task Text"
              fullWidth
              value={editingTask?.text || ''}
              onChange={(e) => setEditingTask({ ...editingTask, text: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={editingTask?.priority || 'Medium'}
                label="Priority"
                onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
              >
                {priorities.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditFormOpen(false)}>Cancel</Button>
            <Button onClick={saveEditedTask} color="primary">Save</Button>
          </DialogActions>
        </Dialog>
        
        {/* Filter & Sort Dialog */}
        <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Filter & Sort Tasks</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="priority">Priority</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Sort Direction</InputLabel>
              <Select
                value={sortDirection}
                label="Sort Direction"
                onChange={(e) => setSortDirection(e.target.value)}
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFilterDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={closeSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

// Create HTML structure
const rootElement = document.createElement('div');
rootElement.id = 'root';
document.body.appendChild(rootElement);

// Add global styles
const styleElement = document.createElement('style');
styleElement.textContent = `
  body {
    margin: 0;
    padding: 0;
    font-family: 'Roboto', sans-serif;
  }
  
  #root {
    min-height: 100vh;
  }
`;
document.head.appendChild(styleElement);

// Add meta viewport for responsiveness
const metaViewport = document.createElement('meta');
metaViewport.name = 'viewport';
metaViewport.content = 'width=device-width, initial-scale=1.0';
document.head.appendChild(metaViewport);

// Add Roboto font
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap';
document.head.appendChild(fontLink);

// Add Material Icons
const iconsLink = document.createElement('link');
iconsLink.rel = 'stylesheet';
iconsLink.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
document.head.appendChild(iconsLink);

// Render the app
const root = createRoot(rootElement);
root.render(<App />);