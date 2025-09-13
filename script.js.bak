document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos HTML
    const authContainer = document.getElementById('auth-container');
    const loginForm = document.getElementById('login-form');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const registerContainer = document.getElementById('register-container');
    const registerForm = document.getElementById('register-form');
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const todoContainer = document.getElementById('todo-container');
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const taskCategoryInput = document.getElementById('task-category');
    const filterCategorySelect = document.getElementById('filter-category');
    const taskDueDateInput = document.getElementById('task-due-date'); // Novo campo para o prazo

    // URLs da API
    const API_URL = 'https://todo-list-backend-5qku.onrender.com';
    let token = localStorage.getItem('token');
    let userId = localStorage.getItem('userId');

    // Funções para alternar as telas
    function showLogin() {
        registerContainer.style.display = 'none';
        loginForm.style.display = 'block';
    }

    function showRegister() {
        loginForm.style.display = 'none';
        registerContainer.style.display = 'block';
    }

    // Função para verificar o status de login
    function checkAuth() {
        if (token && userId) {
            authContainer.style.display = 'none';
            todoContainer.style.display = 'block';
            renderTasks();
        } else {
            authContainer.style.display = 'block';
            todoContainer.style.display = 'none';
            showLogin();
        }
    }

    // Função de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = loginUsernameInput.value;
        const password = loginPasswordInput.value;
        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                token = data.token;
                userId = data.userId;
                localStorage.setItem('token', token);
                localStorage.setItem('userId', userId);
                checkAuth();
            } else {
                console.error(data.message || 'Erro no login.');
                alert(data.message || 'Erro no login.');
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Erro de rede. Verifique a conexão com o servidor.');
        }
    });

    // Função de cadastro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = registerUsernameInput.value;
        const password = registerPasswordInput.value;
        try {
            const response = await fetch(`${API_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (response.ok) {
                alert('Usuário cadastrado com sucesso! Faça login para continuar.');
                showLogin();
            } else {
                const data = await response.text();
                console.error('Erro no cadastro:', data);
                alert(data || 'Erro no cadastro.');
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Erro de rede. Verifique a conexão com o servidor.');
        }
    });

    // --- Funções de Tarefas com autenticação ---

    // Rota GET: Buscar tarefas do usuário
    async function renderTasks(category = null) {
        taskList.innerHTML = '';
        let url = `${API_URL}/api/tarefas`;
        if (category && category !== 'all') {
            url += `?category=${encodeURIComponent(category)}`;
        }

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const tasks = await response.json();
            if (response.ok) {
                tasks.forEach(task => {
                    const li = document.createElement('li');
                    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A';
                    li.innerHTML = `
                        <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task._id}">
                        <div class="task-info">
                            <span>${task.text}</span>
                            <small class="task-details">
                                Categoria: ${task.category || 'Geral'} | Prazo: ${dueDate}
                            </small>
                        </div>
                        <button class="edit-btn" data-id="${task._id}">Editar</button>
                        <button class="delete-btn" data-id="${task._id}">Remover</button>
                    `;
                    if (task.completed) {
                        li.classList.add('completed');
                    }
                    taskList.appendChild(li);
                });

                // Adicionar listeners para os novos botões
                document.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const taskId = e.target.dataset.id;
                        const taskElement = e.target.parentElement;
                        const taskText = taskElement.querySelector('.task-info span').textContent;
                        const taskCategory = taskElement.querySelector('.task-details').textContent.split('|')[0].replace('Categoria: ', '').trim();
                        const taskDueDate = taskElement.querySelector('.task-details').textContent.split('|')[1].replace('Prazo: ', '').trim();
                        editTask(taskId, taskText, taskCategory, taskDueDate);
                    });
                });
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        deleteTask(e.target.dataset.id);
                    });
                });
                document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                    checkbox.addEventListener('change', (e) => {
                        toggleTaskCompleted(e.target.dataset.id, e.target.checked);
                    });
                });

            } else {
                console.error('Erro ao buscar as tarefas:', tasks.message || response.statusText);
                alert('Não foi possível carregar as tarefas. Verifique se o servidor está rodando.');
            }
        } catch (error) {
            console.error('Erro ao buscar as tarefas:', error);
            alert('Não foi possível carregar as tarefas. Verifique se o servidor está rodando.');
        }
    }

    // Rota POST: Adicionar nova tarefa para o usuário
    async function addTask(text, category, dueDate) {
        try {
            await fetch(`${API_URL}/api/tarefas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text, category, dueDate })
            });
            renderTasks();
            taskInput.value = '';
            taskCategoryInput.value = '';
            taskDueDateInput.value = '';
        } catch (error) {
            console.error('Erro ao adicionar a tarefa:', error);
            alert('Não foi possível adicionar a tarefa.');
        }
    }

    // Rota DELETE: Deletar tarefa do usuário
    async function deleteTask(id) {
        if (!confirm('Tem certeza de que deseja remover esta tarefa?')) {
            return;
        }
        try {
            await fetch(`${API_URL}/api/tarefas/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            renderTasks();
        } catch (error) {
            console.error('Erro ao remover a tarefa:', error);
            alert('Não foi possível remover a tarefa.');
        }
    }

    // Rota PUT: Atualizar o status de uma tarefa do usuário (agora com edição de texto)
    async function toggleTaskCompleted(id, completed) {
        try {
            await fetch(`${API_URL}/api/tarefas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ completed })
            });
            renderTasks();
        } catch (error) {
            console.error('Erro ao atualizar a tarefa:', error);
            alert('Não foi possível atualizar a tarefa.');
        }
    }

    // Nova função para editar o texto, categoria e prazo da tarefa
    async function editTask(id, currentText, currentCategory, currentDueDate) {
        const newText = prompt('Editar tarefa:', currentText);
        if (newText === null || newText.trim() === '') {
            return;
        }

        const newCategory = prompt('Editar categoria:', currentCategory);
        if (newCategory === null || newCategory.trim() === '') {
            return;
        }
        
        const newDueDate = prompt('Editar prazo (AAAA-MM-DD):', currentDueDate);

        try {
            await fetch(`${API_URL}/api/tarefas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: newText, category: newCategory, dueDate: newDueDate })
            });
            renderTasks();
        } catch (error) {
            console.error('Erro ao editar a tarefa:', error);
            alert('Não foi possível editar a tarefa.');
        }
    }

    // Adiciona o botão de sair (logout)
    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Sair';
    logoutButton.onclick = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        token = null;
        userId = null;
        checkAuth();
    };
    // Coloque o botão de logout antes do título da lista de tarefas
    todoContainer.prepend(logoutButton);


    // Eventos para alternar a exibição
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegister();
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });

    // Adiciona o listener do formulário de tarefas
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskText = taskInput.value.trim();
        const taskCategory = taskCategoryInput.value.trim() || 'Geral';
        const taskDueDate = taskDueDateInput.value.trim(); // Pega o valor do novo input
        if (taskText) {
            addTask(taskText, taskCategory, taskDueDate);
        }
    });

    // Adiciona o listener para o filtro de categorias
    filterCategorySelect.addEventListener('change', (e) => {
        renderTasks(e.target.value);
    });

    // Inicia a verificação de autenticação ao carregar a página
    checkAuth();
});
