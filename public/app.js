document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const navButtons = document.querySelectorAll('.nav-button');
    const sections = document.querySelectorAll('.section');

    // Generate a random user ID if not exists
    const userId = localStorage.getItem('userId') || `user_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);

    // Navigation
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSection = button.dataset.section;
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            sections.forEach(section => {
                if (section.id === `${targetSection}-section`) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            });
        });
    });

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
    });

    // Send message on Enter (without Shift)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendButton.addEventListener('click', sendMessage);

    function createMessageElement(content, isUser = false) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${isUser ? 'user-message' : 'bot-message'}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = isUser ? 'U' : 'TD';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        messageHeader.innerHTML = `
            <span>${isUser ? 'Vous' : 'Le Temps de Dieu'}</span>
            <span class="message-time">À l'instant</span>
        `;
        
        const messageText = document.createElement('div');
        messageText.textContent = content;
        
        messageContent.appendChild(messageHeader);
        messageContent.appendChild(messageText);
        
        messageContainer.appendChild(avatar);
        messageContainer.appendChild(messageContent);
        
        if (!isUser) {
            const reactions = document.createElement('div');
            reactions.className = 'message-reactions';
            reactions.innerHTML = `
                <button type="button" class="reaction-button" onclick="copyToClipboard('${content.replace(/'/g, "\\'")}')">
                    <svg viewBox="0 0 24 24">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    Copier
                </button>
                <button type="button" class="reaction-button like-button">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    J'aime
                </button>
                <button type="button" class="reaction-button" onclick="regenerateResponse('${content.replace(/'/g, "\\'")}')">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                    Régénérer
                </button>
                <button type="button" class="reaction-button">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                </button>
            `;
            messageContainer.appendChild(reactions);
        }
        
        return messageContainer;
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Add user message
        chatContainer.appendChild(createMessageElement(message, true));
        
        // Clear input
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;

        try {
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    question: message,
                    userId: userId
                })
            });

            const data = await response.json();
            
            if (data.choices && data.choices[0]) {
                const botMessage = data.choices[0].message.content;
                chatContainer.appendChild(createMessageElement(botMessage));
            } else {
                throw new Error('Format de réponse invalide');
            }
        } catch (error) {
            chatContainer.appendChild(createMessageElement('Désolé, une erreur est survenue. Veuillez réessayer.'));
        }

        // Scroll to bottom again
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Copy to clipboard function
    window.copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('Texte copié !');
        } catch (err) {
            console.error('Erreur lors de la copie :', err);
        }
    };

    // Regenerate response function
    window.regenerateResponse = async (previousResponse) => {
        try {
            const lastUserMessage = Array.from(document.querySelectorAll('.user-message')).pop();
            if (lastUserMessage) {
                const question = lastUserMessage.querySelector('.message-content').textContent.trim();
                const response = await fetch('/.netlify/functions/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        question: question,
                        userId: userId,
                        regenerate: true
                    })
                });

                const data = await response.json();
                
                if (data.choices && data.choices[0]) {
                    const newResponse = data.choices[0].message.content;
                    const oldMessage = Array.from(document.querySelectorAll('.bot-message')).pop();
                    if (oldMessage) {
                        const newMessage = createMessageElement(newResponse);
                        oldMessage.parentNode.replaceChild(newMessage, oldMessage);
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors de la régénération :', error);
        }
    };

    // Fonctions pour les boutons d'action
    async function handleSummarize() {
        const chatInput = document.querySelector('.chat-input textarea');
        const currentText = chatInput.value;
        
        if (!currentText.trim()) {
            alert('Veuillez entrer un texte à résumer');
            return;
        }

        const prompt = `Résumez ce texte de manière concise : ${currentText}`;
        chatInput.value = prompt;
        await sendMessage();
    }

    async function handleCreateImage() {
        const chatInput = document.querySelector('.chat-input textarea');
        const currentText = chatInput.value;
        
        if (!currentText.trim()) {
            alert('Veuillez entrer une description de l\'image souhaitée');
            return;
        }

        const prompt = `Générez une image qui représente : ${currentText}`;
        chatInput.value = prompt;
        await sendMessage();
    }

    async function handleWritingAssist() {
        const chatInput = document.querySelector('.chat-input textarea');
        const currentText = chatInput.value;
        
        if (!currentText.trim()) {
            alert('Veuillez entrer votre texte ou sujet');
            return;
        }

        const prompt = `Aidez-moi à améliorer ou développer ce texte : ${currentText}`;
        chatInput.value = prompt;
        await sendMessage();
    }

    function handleMoreOptions() {
        const moreOptions = [
            'Analyser un texte biblique',
            'Comparer christianisme et islam',
            'Expliquer un concept religieux',
            'Trouver des versets pertinents',
            'Obtenir des conseils spirituels'
        ];

        const optionsHtml = moreOptions.map(option => 
            `<button class="more-option-btn" onclick="selectMoreOption('${option}')">${option}</button>`
        ).join('');

        const modal = document.createElement('div');
        modal.className = 'more-options-modal';
        modal.innerHTML = `
            <div class="more-options-content">
                <h3>Plus d'options</h3>
                <div class="options-grid">
                    ${optionsHtml}
                </div>
                <button class="close-modal" onclick="this.parentElement.parentElement.remove()">Fermer</button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    function selectMoreOption(option) {
        const chatInput = document.querySelector('.chat-input textarea');
        chatInput.value = `Je voudrais ${option.toLowerCase()}`;
        document.querySelector('.more-options-modal').remove();
    }

    // Initialize with welcome message
    chatContainer.appendChild(createMessageElement('Comment puis-je vous aider à en apprendre davantage sur le christianisme et l\'islam ?'));
});
