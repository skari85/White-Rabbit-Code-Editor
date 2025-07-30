export interface AppTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: {
    name: string;
    description: string;
    accentColor: string;
    icon: string;
  };
  files: {
    name: string;
    type: string;
    content: string;
  }[];
}

export const templates: AppTemplate[] = [
  {
    id: 'employee-directory',
    name: 'Employee Directory',
    description: 'A simple employee directory with search and filtering',
    icon: '👥',
    settings: {
      name: 'Employee Directory',
      description: 'Browse and search company employees',
      accentColor: '#3B82F6',
      icon: '👥'
    },
    files: [
      {
        name: 'index.html',
        type: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Directory</title>
    <meta name="description" content="Browse and search company employees">
    <meta name="theme-color" content="#3B82F6">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="app">
        <header class="header">
            <h1>👥 Employee Directory</h1>
            <input type="text" id="searchInput" placeholder="Search employees..." class="search-input">
        </header>
        
        <main class="main">
            <div id="employeeGrid" class="employee-grid">
                <!-- Employees will be rendered here -->
            </div>
        </main>
    </div>
    
    <script src="script.js"></script>
</body>
</html>`
      },
      {
        name: 'styles.css',
        type: 'css',
        content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.6;
    color: #333;
    background: #f5f5f5;
}

.header {
    background: #3B82F6;
    color: white;
    padding: 1rem;
    text-align: center;
}

.search-input {
    width: 100%;
    max-width: 400px;
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    margin-top: 1rem;
    font-size: 1rem;
}

.main {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.employee-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    margin-top: 2rem;
}

.employee-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.2s;
}

.employee-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.employee-name {
    font-size: 1.2rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
}

.employee-title {
    color: #6b7280;
    font-size: 0.9rem;
    margin-bottom: 1rem;
}

.employee-email {
    color: #3B82F6;
    text-decoration: none;
    font-size: 0.9rem;
}

.employee-email:hover {
    text-decoration: underline;
}`
      },
      {
        name: 'script.js',
        type: 'js',
        content: `// Sample employee data
const employees = [
    {
        name: "Alice Johnson",
        title: "Senior Software Engineer",
        email: "alice.johnson@company.com"
    },
    {
        name: "Bob Smith",
        title: "Product Manager",
        email: "bob.smith@company.com"
    },
    {
        name: "Carol Davis",
        title: "UX Designer",
        email: "carol.davis@company.com"
    },
    {
        name: "David Wilson",
        title: "Frontend Developer",
        email: "david.wilson@company.com"
    },
    {
        name: "Eva Brown",
        title: "Backend Developer",
        email: "eva.brown@company.com"
    },
    {
        name: "Frank Miller",
        title: "DevOps Engineer",
        email: "frank.miller@company.com"
    }
];

const employeeGrid = document.getElementById('employeeGrid');
const searchInput = document.getElementById('searchInput');

// Render employees
function renderEmployees(employeesToRender) {
    employeeGrid.innerHTML = '';
    
    employeesToRender.forEach(employee => {
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.innerHTML = \`
            <div class="employee-name">\${employee.name}</div>
            <div class="employee-title">\${employee.title}</div>
            <a href="mailto:\${employee.email}" class="employee-email">\${employee.email}</a>
        \`;
        employeeGrid.appendChild(card);
    });
}

// Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredEmployees = employees.filter(employee => 
        employee.name.toLowerCase().includes(searchTerm) ||
        employee.title.toLowerCase().includes(searchTerm)
    );
    renderEmployees(filteredEmployees);
});

// Initialize app
renderEmployees(employees);`
      }
    ]
  },
  {
    id: 'todo-app',
    name: 'Todo App',
    description: 'A simple task management application',
    icon: '✅',
    settings: {
      name: 'Todo App',
      description: 'Manage your daily tasks',
      accentColor: '#10B981',
      icon: '✅'
    },
    files: [
      {
        name: 'index.html',
        type: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App</title>
    <meta name="description" content="Manage your daily tasks">
    <meta name="theme-color" content="#10B981">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="app">
        <header class="header">
            <h1>✅ Todo App</h1>
        </header>
        
        <main class="main">
            <form id="todoForm" class="todo-form">
                <input type="text" id="todoInput" placeholder="Add a new task..." required>
                <button type="submit">Add Task</button>
            </form>
            
            <div class="todo-stats">
                <span id="totalTasks">0 tasks</span>
                <span id="completedTasks">0 completed</span>
            </div>
            
            <ul id="todoList" class="todo-list"></ul>
        </main>
    </div>
    
    <script src="script.js"></script>
</body>
</html>`
      },
      {
        name: 'styles.css',
        type: 'css',
        content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.6;
    color: #333;
    background: #f5f5f5;
}

.header {
    background: #10B981;
    color: white;
    padding: 1rem;
    text-align: center;
}

.main {
    padding: 2rem;
    max-width: 600px;
    margin: 0 auto;
}

.todo-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
}

.todo-form input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 1rem;
}

.todo-form button {
    padding: 0.75rem 1.5rem;
    background: #10B981;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
}

.todo-form button:hover {
    background: #059669;
}

.todo-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    color: #6b7280;
    font-size: 0.9rem;
}

.todo-list {
    list-style: none;
}

.todo-item {
    background: white;
    padding: 1rem;
    margin-bottom: 0.5rem;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
}

.todo-item.completed {
    opacity: 0.6;
}

.todo-item.completed .todo-text {
    text-decoration: line-through;
}

.todo-checkbox {
    width: 1.2rem;
    height: 1.2rem;
    cursor: pointer;
}

.todo-text {
    flex: 1;
}

.todo-delete {
    background: #ef4444;
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
}

.todo-delete:hover {
    background: #dc2626;
}`
      },
      {
        name: 'script.js',
        type: 'js',
        content: `// Todo app functionality
let todos = JSON.parse(localStorage.getItem('todos')) || [];

const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const totalTasks = document.getElementById('totalTasks');
const completedTasks = document.getElementById('completedTasks');

// Save todos to localStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Update statistics
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    
    totalTasks.textContent = \`\${total} tasks\`;
    completedTasks.textContent = \`\${completed} completed\`;
}

// Render todos
function renderTodos() {
    todoList.innerHTML = '';
    
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = \`todo-item \${todo.completed ? 'completed' : ''}\`;
        li.innerHTML = \`
            <input type="checkbox" class="todo-checkbox" \${todo.completed ? 'checked' : ''} onclick="toggleTodo(\${index})">
            <span class="todo-text">\${todo.text}</span>
            <button class="todo-delete" onclick="deleteTodo(\${index})">Delete</button>
        \`;
        todoList.appendChild(li);
    });
    
    updateStats();
}

// Add todo
function addTodo(text) {
    todos.push({
        text: text.trim(),
        completed: false,
        createdAt: Date.now()
    });
    saveTodos();
    renderTodos();
}

// Toggle todo completion
function toggleTodo(index) {
    todos[index].completed = !todos[index].completed;
    saveTodos();
    renderTodos();
}

// Delete todo
function deleteTodo(index) {
    todos.splice(index, 1);
    saveTodos();
    renderTodos();
}

// Form submission
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (text) {
        addTodo(text);
        todoInput.value = '';
    }
});

// Initialize app
renderTodos();

// Make functions global for onclick handlers
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;`
      }
    ]
  }
];

export function useTemplates() {
  const loadTemplate = (templateId: string) => {
    return templates.find(t => t.id === templateId);
  };

  return {
    templates,
    loadTemplate
  };
}
