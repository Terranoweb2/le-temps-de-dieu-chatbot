document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            
            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            sections.forEach(section => {
                if (section.id === `${targetSection}-section`) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });

    // Initialize charts
    initializeCharts();
    
    // Load initial data
    loadDashboardData();
    loadConversations();
    loadUsers();
    loadFeedback();

    // Event listeners for forms
    document.getElementById('api-settings-form').addEventListener('submit', saveApiSettings);
    document.getElementById('chatbot-settings-form').addEventListener('submit', saveChatbotSettings);
    document.getElementById('save-user').addEventListener('click', saveNewUser);
});

async function loadDashboardData() {
    try {
        const response = await fetch('/.netlify/functions/admin-dashboard');
        const data = await response.json();

        // Update stats
        document.getElementById('total-conversations').textContent = data.totalConversations;
        document.getElementById('total-users').textContent = data.totalUsers;
        document.getElementById('positive-feedback').textContent = data.positiveFeedback + '%';
        document.getElementById('avg-response-time').textContent = data.avgResponseTime + 's';

        // Update charts
        updateConversationsChart(data.conversationsData);
        updateFeedbackChart(data.feedbackData);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadConversations() {
    try {
        const response = await fetch('/.netlify/functions/admin-conversations');
        const data = await response.json();
        
        const tbody = document.getElementById('conversations-table');
        tbody.innerHTML = '';
        
        data.conversations.forEach(conv => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${conv.id.slice(0, 8)}...</td>
                <td>${conv.user_id}</td>
                <td>${truncateText(conv.question, 50)}</td>
                <td>${truncateText(conv.answer, 50)}</td>
                <td>${formatDate(conv.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewConversation('${conv.id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteConversation('${conv.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

async function loadUsers() {
    try {
        const response = await fetch('/.netlify/functions/admin-users');
        const data = await response.json();
        
        const tbody = document.getElementById('users-table');
        tbody.innerHTML = '';
        
        data.users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id.slice(0, 8)}...</td>
                <td>${user.name || 'Anonyme'}</td>
                <td>${user.email || '-'}</td>
                <td>${user.role}</td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editUser('${user.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadFeedback() {
    try {
        const response = await fetch('/.netlify/functions/admin-feedback');
        const data = await response.json();
        
        const tbody = document.getElementById('feedback-table');
        tbody.innerHTML = '';
        
        data.feedback.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.user_id}</td>
                <td>
                    <span class="badge bg-${item.type === 'positive' ? 'success' : 'danger'}">
                        ${item.type}
                    </span>
                </td>
                <td>${item.comment || '-'}</td>
                <td>${formatDate(item.created_at)}</td>
            `;
            tbody.appendChild(tr);
        });

        // Update feedback trends chart
        updateFeedbackTrendsChart(data.trends);
    } catch (error) {
        console.error('Error loading feedback:', error);
    }
}

function initializeCharts() {
    // Conversations Chart
    const conversationsCtx = document.getElementById('conversations-chart').getContext('2d');
    window.conversationsChart = new Chart(conversationsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Conversations par jour',
                data: [],
                borderColor: '#0d6efd',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Feedback Chart
    const feedbackCtx = document.getElementById('feedback-chart').getContext('2d');
    window.feedbackChart = new Chart(feedbackCtx, {
        type: 'doughnut',
        data: {
            labels: ['Positif', 'Négatif'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#198754', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Feedback Trends Chart
    const feedbackTrendsCtx = document.getElementById('feedback-trends-chart').getContext('2d');
    window.feedbackTrendsChart = new Chart(feedbackTrendsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Retours positifs',
                data: [],
                borderColor: '#198754',
                tension: 0.1
            }, {
                label: 'Retours négatifs',
                data: [],
                borderColor: '#dc3545',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateConversationsChart(data) {
    window.conversationsChart.data.labels = data.labels;
    window.conversationsChart.data.datasets[0].data = data.values;
    window.conversationsChart.update();
}

function updateFeedbackChart(data) {
    window.feedbackChart.data.datasets[0].data = [data.positive, data.negative];
    window.feedbackChart.update();
}

function updateFeedbackTrendsChart(data) {
    window.feedbackTrendsChart.data.labels = data.labels;
    window.feedbackTrendsChart.data.datasets[0].data = data.positive;
    window.feedbackTrendsChart.data.datasets[1].data = data.negative;
    window.feedbackTrendsChart.update();
}

async function saveApiSettings(e) {
    e.preventDefault();
    const apiKey = document.getElementById('deepseek-api-key').value;
    const model = document.getElementById('api-model').value;

    try {
        const response = await fetch('/.netlify/functions/admin-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'api',
                apiKey,
                model
            })
        });

        if (response.ok) {
            alert('Paramètres API sauvegardés avec succès');
        } else {
            throw new Error('Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('Error saving API settings:', error);
        alert('Erreur lors de la sauvegarde des paramètres');
    }
}

async function saveChatbotSettings(e) {
    e.preventDefault();
    const temperature = document.getElementById('temperature').value;
    const maxTokens = document.getElementById('max-tokens').value;

    try {
        const response = await fetch('/.netlify/functions/admin-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'chatbot',
                temperature,
                maxTokens
            })
        });

        if (response.ok) {
            alert('Paramètres du chatbot sauvegardés avec succès');
        } else {
            throw new Error('Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('Error saving chatbot settings:', error);
        alert('Erreur lors de la sauvegarde des paramètres');
    }
}

async function saveNewUser() {
    const name = document.getElementById('user-name').value;
    const email = document.getElementById('user-email').value;
    const role = document.getElementById('user-role').value;

    try {
        const response = await fetch('/.netlify/functions/admin-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, role })
        });

        if (response.ok) {
            alert('Utilisateur ajouté avec succès');
            document.getElementById('addUserModal').querySelector('.btn-close').click();
            loadUsers();
        } else {
            throw new Error('Erreur lors de l\'ajout');
        }
    } catch (error) {
        console.error('Error saving new user:', error);
        alert('Erreur lors de l\'ajout de l\'utilisateur');
    }
}

// Utility functions
function truncateText(text, length) {
    return text.length > length ? text.substring(0, length) + '...' : text;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Action functions
async function viewConversation(id) {
    // Implement conversation view logic
}

async function deleteConversation(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
        try {
            const response = await fetch(`/.netlify/functions/admin-conversations?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadConversations();
            } else {
                throw new Error('Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
            alert('Erreur lors de la suppression de la conversation');
        }
    }
}

async function editUser(id) {
    // Implement user edit logic
}

async function deleteUser(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
        try {
            const response = await fetch(`/.netlify/functions/admin-users?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadUsers();
            } else {
                throw new Error('Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Erreur lors de la suppression de l\'utilisateur');
        }
    }
}
