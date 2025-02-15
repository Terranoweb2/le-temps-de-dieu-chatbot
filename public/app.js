// Initialisation de l'ID utilisateur
let userId = localStorage.getItem('userId');
if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
}

// État de l'application
const state = {
    messages: [],
    isProcessing: false,
    theme: localStorage.getItem('theme') || 'auto'
};

// Éléments du DOM
const elements = {
    chatContainer: document.getElementById('chat-container'),
    messageForm: document.getElementById('message-form'),
    messageInput: document.getElementById('message-input'),
    themeToggle: document.querySelector('.theme-toggle')
};

// Fonctions d'aide pour l'interface utilisateur
const ui = {
    addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = isUser ? 'U' : 'TD';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(timestamp);
        
        elements.chatContainer.appendChild(messageDiv);
        elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
        
        return messageDiv;
    },

    updateMessage(messageDiv, content) {
        const messageContent = messageDiv.querySelector('.message-content');
        messageContent.textContent = content;
    },

    setLoading(isLoading) {
        state.isProcessing = isLoading;
        elements.messageInput.disabled = isLoading;
        elements.messageForm.querySelector('button[type="submit"]').disabled = isLoading;
    },

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error-message';
        errorDiv.textContent = message;
        elements.chatContainer.appendChild(errorDiv);
        elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
    }
};

// Gestionnaire des messages
const messageHandler = {
    async send(message) {
        try {
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    userId,
                    context: {
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent,
                        language: navigator.language
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Erreur réseau');
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            return data.answer;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
};

// Mobile Menu Management
const menuToggle = document.querySelector('.menu-toggle');
const mobileActionsToggle = document.querySelector('.mobile-actions-toggle');
const sidebar = document.querySelector('.sidebar');
const mobileActionsMenu = document.querySelector('.mobile-actions-menu');

// Create overlay
const overlay = document.createElement('div');
overlay.className = 'mobile-overlay';
document.body.appendChild(overlay);

// Toggle Sidebar
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
    mobileActionsMenu.classList.remove('show');
});

// Toggle Mobile Actions Menu
mobileActionsToggle.addEventListener('click', () => {
    mobileActionsMenu.classList.toggle('show');
    overlay.classList.toggle('show');
    sidebar.classList.remove('show');
});

// Close menus when clicking overlay
overlay.addEventListener('click', () => {
    sidebar.classList.remove('show');
    mobileActionsMenu.classList.remove('show');
    overlay.classList.remove('show');
});

// Close menus on navigation
document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', () => {
        sidebar.classList.remove('show');
        mobileActionsMenu.classList.remove('show');
        overlay.classList.remove('show');
    });
});

// Handle swipe gestures
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const SWIPE_THRESHOLD = 50;
    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) < SWIPE_THRESHOLD) return;

    if (swipeDistance > 0) {
        // Swipe right - open sidebar
        if (touchStartX < 30) {
            sidebar.classList.add('show');
            overlay.classList.add('show');
        }
    } else {
        // Swipe left - close sidebar
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    }
}

// Gestionnaire des événements
async function handleSubmit(e) {
    e.preventDefault();
    
    const message = elements.messageInput.value.trim();
    if (!message || state.isProcessing) return;

    // Effacer l'input et désactiver le formulaire
    elements.messageInput.value = '';
    ui.setLoading(true);

    // Afficher le message de l'utilisateur
    ui.addMessage(message, true);

    try {
        // Créer un message temporaire pour le bot
        const loadingMessage = ui.addMessage('En train d\'écrire...');

        // Envoyer le message et obtenir la réponse
        const response = await messageHandler.send(message);
        
        // Mettre à jour le message du bot avec la réponse
        ui.updateMessage(loadingMessage, response);
    } catch (error) {
        ui.showError('Désolé, une erreur est survenue. Veuillez réessayer.');
    } finally {
        ui.setLoading(false);
        elements.messageInput.focus();
    }
}

// Initialisation
function init() {
    // Ajouter les écouteurs d'événements
    elements.messageForm.addEventListener('submit', handleSubmit);
    
    elements.messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    });

    // Afficher le message de bienvenue
    ui.addMessage('Comment puis-je vous aider à en apprendre davantage sur le christianisme et l\'islam ?');
}

// Démarrer l'application
document.addEventListener('DOMContentLoaded', init);
