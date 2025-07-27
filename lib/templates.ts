import { FileContent } from '@/hooks/use-pwa-builder';

export interface PWATemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  files: FileContent[];
  settings: {
    name: string;
    description: string;
    accentColor: string;
    icon: string;
  };
}

export const templates: PWATemplate[] = [
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
    <link rel="manifest" href="manifest.json">
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
        
        <button id="installBtn" class="install-btn" style="display: none;">
            Install App
        </button>
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
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background: #f8fafc;
    color: #334155;
    line-height: 1.6;
}

#app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.header {
    text-align: center;
    margin-bottom: 2rem;
}

.header h1 {
    color: #3B82F6;
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

.search-input {
    width: 100%;
    max-width: 400px;
    padding: 12px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 16px;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.search-input:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.employee-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.employee-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
}

.employee-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.employee-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #3B82F6;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin: 0 auto 1rem;
}

.employee-name {
    font-size: 1.25rem;
    font-weight: 600;
    text-align: center;
    margin-bottom: 0.5rem;
    color: #1e293b;
}

.employee-title {
    text-align: center;
    color: #64748b;
    font-size: 0.9rem;
}

.install-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #3B82F6;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    transition: background 0.2s;
}

.install-btn:hover {
    background: #2563eb;
}

@media (max-width: 768px) {
    .employee-grid {
        grid-template-columns: 1fr;
    }
    
    .header h1 {
        font-size: 2rem;
    }
}`
      },
      {
        name: 'script.js',
        type: 'js',
        content: `// Sample employee data
const employees = [
    { id: 1, name: 'Michael Scott', title: 'Regional Manager', avatar: '👨‍💼' },
    { id: 2, name: 'Dwight K. Schrute', title: 'Assistant Regional Manager', avatar: '🧑‍🌾' },
    { id: 3, name: 'Pam Beesly', title: 'Receptionist', avatar: '👩‍💼' },
    { id: 4, name: 'Jim Halpert', title: 'Sales Representative', avatar: '👨‍💼' },
    { id: 5, name: 'Stanley Hudson', title: 'Sales Representative', avatar: '👨‍💼' },
    { id: 6, name: 'Kevin Malone', title: 'Accountant', avatar: '👨‍💼' },
    { id: 7, name: 'Angela Martin', title: 'Senior Accountant', avatar: '👩‍💼' },
    { id: 8, name: 'Toby Flenderson', title: 'HR Representative', avatar: '👨‍💼' }
];

// DOM elements
const employeeGrid = document.getElementById('employeeGrid');
const searchInput = document.getElementById('searchInput');
const installBtn = document.getElementById('installBtn');

// Render employees
function renderEmployees(employeesToRender = employees) {
    employeeGrid.innerHTML = '';
    
    employeesToRender.forEach(employee => {
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.innerHTML = \`
            <div class="employee-avatar">\${employee.avatar}</div>
            <div class="employee-name">\${employee.name}</div>
            <div class="employee-title">\${employee.title}</div>
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

// PWA Installation
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
        installBtn.style.display = 'none';
    }
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Initialize app
renderEmployees();`
      },
      {
        name: 'manifest.json',
        type: 'json',
        content: `{
  "name": "Employee Directory",
  "short_name": "Employees",
  "description": "Browse and search company employees",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "orientation": "any",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192", 
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png", 
      "purpose": "any maskable"
    }
  ]
}`
      },
      {
        name: 'sw.js',
        type: 'js',
        content: `const CACHE_NAME = 'employee-directory-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});`
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
    <link rel="manifest" href="manifest.json">
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
        
        <button id="installBtn" class="install-btn" style="display: none;">
            Install App
        </button>
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
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
}

#app {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
}

.header {
    text-align: center;
    margin-bottom: 2rem;
}

.header h1 {
    color: white;
    font-size: 2.5rem;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.todo-form {
    display: flex;
    gap: 10px;
    margin-bottom: 1rem;
}

.todo-form input {
    flex: 1;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.todo-form button {
    background: #10B981;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.todo-form button:hover {
    background: #059669;
}

.todo-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding: 0 4px;
    color: white;
    font-size: 0.9rem;
    opacity: 0.9;
}

.todo-list {
    list-style: none;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    overflow: hidden;
}

.todo-item {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.2s;
}

.todo-item:hover {
    background: #f8fafc;
}

.todo-item:last-child {
    border-bottom: none;
}

.todo-item.completed {
    opacity: 0.6;
}

.todo-item.completed .todo-text {
    text-decoration: line-through;
}

.todo-checkbox {
    margin-right: 12px;
    width: 20px;
    height: 20px;
    accent-color: #10B981;
}

.todo-text {
    flex: 1;
    font-size: 1rem;
}

.todo-delete {
    background: #EF4444;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.2s;
}

.todo-delete:hover {
    background: #DC2626;
}

.empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #64748b;
}

.install-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #10B981;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    transition: background 0.2s;
}

.install-btn:hover {
    background: #059669;
}`
      },
      {
        name: 'script.js',
        type: 'js',
        content: `// Todo App Logic
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// DOM elements
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const totalTasks = document.getElementById('totalTasks');
const completedTasks = document.getElementById('completedTasks');
const installBtn = document.getElementById('installBtn');

// Save todos to localStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Update stats
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    
    totalTasks.textContent = \`\${total} task\${total !== 1 ? 's' : ''}\`;
    completedTasks.textContent = \`\${completed} completed\`;
}

// Render todos
function renderTodos() {
    todoList.innerHTML = '';
    
    if (todos.length === 0) {
        todoList.innerHTML = '<li class="empty-state">No tasks yet. Add one above!</li>';
        updateStats();
        return;
    }
    
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = \`todo-item \${todo.completed ? 'completed' : ''}\`;
        li.innerHTML = \`
            <input type="checkbox" class="todo-checkbox" \${todo.completed ? 'checked' : ''} 
                   onchange="toggleTodo(\${index})">
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

// PWA Installation
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
        installBtn.style.display = 'none';
    }
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Initialize app
renderTodos();

// Make functions global for onclick handlers
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;`
      },
      {
        name: 'manifest.json',
        type: 'json',
        content: `{
  "name": "Todo App",
  "short_name": "Todos",
  "description": "Manage your daily tasks",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#10B981",
  "orientation": "any",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icon-512.png", 
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}`
      },
      {
        name: 'sw.js',
        type: 'js',
        content: `const CACHE_NAME = 'todo-app-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css', 
    '/script.js',
    '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});`
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
