from flask import Flask, render_template_string, request, redirect, url_for
import os
from dotenv import load_dotenv
import requests

# Charger les variables d'environnement
load_dotenv()

app = Flask(__name__)

# Template HTML avec design style ChatGPT
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Le Temps de Dieu - Assistant Religieux</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <style>
        :root {
            --sidebar-width: 260px;
            --mobile-header-height: 60px;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #343541;
            color: #FFFFFF;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .mobile-header {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: var(--mobile-header-height);
            background-color: #202123;
            z-index: 1000;
            padding: 10px;
            align-items: center;
            justify-content: space-between;
        }

        .mobile-logo {
            height: 40px;
            width: auto;
        }

        .menu-toggle {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 10px;
        }

        .sidebar {
            width: var(--sidebar-width);
            background-color: #202123;
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            padding: 10px;
            z-index: 100;
            transition: transform 0.3s ease;
        }

        .logo {
            width: 120px;
            height: auto;
            display: block;
            margin: 0 auto;
        }

        .main-content {
            margin-left: var(--sidebar-width);
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            height: 100vh;
            transition: margin-left 0.3s ease;
        }

        .chat-container {
            flex-grow: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding-bottom: 90px;
        }

        .input-container {
            position: fixed;
            bottom: 0;
            left: var(--sidebar-width);
            right: 0;
            padding: 20px;
            background-color: #343541;
            border-top: 1px solid rgba(255,255,255,0.1);
            transition: left 0.3s ease;
            backdrop-filter: blur(8px);
        }

        .input-form {
            max-width: 800px;
            margin: 0 auto;
            position: relative;
            width: 100%;
            background: rgba(64,65,79,0.9);
            border-radius: 12px;
            box-shadow: 0 0 15px rgba(0,0,0,0.1);
        }

        .input-field {
            width: 100%;
            padding: 16px 45px 16px 20px;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            background-color: transparent;
            color: white;
            font-size: 1rem;
            resize: none;
            min-height: 56px;
            line-height: 1.5;
            outline: none;
        }

        .input-field:focus {
            border-color: rgba(255,255,255,0.2);
            box-shadow: 0 0 0 2px rgba(255,255,255,0.05);
        }

        .send-button {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #565869;
            cursor: pointer;
            padding: 8px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .send-button:hover {
            color: white;
            transform: translateY(-50%) scale(1.1);
        }

        .send-icon {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }

        .message-container {
            display: flex;
            padding: 20px;
            gap: 20px;
            max-width: 800px;
            margin: 0 auto;
            width: 100%;
            position: relative;
        }

        .message-reactions {
            display: none;
            position: absolute;
            bottom: -15px;
            left: 70px;
            background: #343541;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 5px;
            gap: 5px;
            z-index: 10;
        }

        .message-container:hover .message-reactions {
            display: flex;
        }

        .reaction-button {
            background: none;
            border: none;
            color: #565869;
            cursor: pointer;
            padding: 5px 10px;
            border-radius: 15px;
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
            transition: all 0.2s ease;
        }

        .reaction-button:hover {
            background-color: rgba(255,255,255,0.1);
            color: #fff;
        }

        .reaction-button svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }

        .message-content {
            flex-grow: 1;
            word-wrap: break-word;
            line-height: 1.6;
        }

        .user-message {
            background-color: #343541;
        }

        .bot-message {
            background-color: #444654;
        }

        .avatar {
            width: 30px;
            height: 30px;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #5436DA;
            flex-shrink: 0;
        }

        .user-avatar {
            background-color: #19C37D;
        }

        .sidebar-button {
            width: 100%;
            padding: 10px;
            margin-bottom: 5px;
            background-color: transparent;
            border: 1px solid #565869;
            color: white;
            border-radius: 5px;
            cursor: pointer;
            text-align: left;
            transition: background-color 0.2s ease;
        }

        .sidebar-button:hover {
            background-color: #2A2B32;
        }

        .bot-name {
            text-align: center;
            padding: 20px 10px;
            border-bottom: 1px solid #565869;
            margin-bottom: 20px;
        }

        .about-content, .settings-content {
            padding: 20px;
            color: white;
            max-width: 800px;
            margin: 0 auto;
        }

        .hidden {
            display: none;
        }

        /* Styles pour les appareils mobiles */
        @media (max-width: 768px) {
            .mobile-header {
                display: flex;
            }

            .sidebar {
                transform: translateX(-100%);
            }

            .sidebar.active {
                transform: translateX(0);
            }

            .main-content {
                margin-left: 0;
                margin-top: var(--mobile-header-height);
            }

            .input-container {
                left: 0;
                padding: 10px;
            }

            .message-container {
                padding: 10px;
            }

            .chat-container {
                padding: 10px;
            }

            .input-field {
                font-size: 16px; /* Évite le zoom sur iOS */
            }
        }

        /* Pour les très petits écrans */
        @media (max-width: 320px) {
            .message-container {
                padding: 5px;
                gap: 10px;
            }

            .avatar {
                width: 25px;
                height: 25px;
                font-size: 12px;
            }

            .input-field {
                padding: 8px 35px 8px 10px;
                height: 40px;
            }
        }

        .input-wrapper {
            position: relative;
            margin-bottom: 20px;
        }

        .input-actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
            padding: 0 10px;
        }

        .action-button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 8px;
            background-color: rgba(52, 53, 65, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #fff;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
        }

        .action-button:hover {
            background-color: rgba(52, 53, 65, 0.9);
        }

        .action-button svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }

        .input-options {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            gap: 8px;
        }

        .option-button {
            background: none;
            border: none;
            color: #565869;
            cursor: pointer;
            padding: 5px;
            display: flex;
            align-items: center;
            transition: color 0.2s ease;
        }

        .option-button:hover {
            color: #fff;
        }

        .input-field {
            padding-left: 85px;
        }

        .voice-button {
            position: absolute;
            right: 50px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #565869;
            cursor: pointer;
            padding: 5px;
            display: flex;
            align-items: center;
        }

        .voice-button:hover {
            color: #fff;
        }

        .chat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            background-color: #343541;
        }

        .share-button {
            background-color: rgba(255,255,255,0.1);
            color: #fff;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 14px;
            transition: all 0.2s ease;
        }

        .share-button:hover {
            background-color: rgba(255,255,255,0.2);
        }

        .share-button svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }

        .message-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            color: #ececf1;
        }

        .message-time {
            font-size: 12px;
            color: #565869;
        }

        .message-content {
            flex-grow: 1;
            word-wrap: break-word;
            line-height: 1.6;
            color: #ececf1;
            font-size: 15px;
        }

        .message-container.user-message {
            background-color: rgba(52,53,65,0.7);
        }

        .message-container.bot-message {
            background-color: rgba(68,70,84,0.7);
        }

        .message-tag {
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 12px;
            background-color: rgba(255,255,255,0.1);
            color: #ececf1;
        }
    </style>
    <script>
        function toggleSidebar() {
            document.querySelector('.sidebar').classList.toggle('active');
        }

        function showSection(sectionId) {
            document.querySelectorAll('.section').forEach(section => {
                section.classList.add('hidden');
            });
            document.getElementById(sectionId).classList.remove('hidden');
            
            if (window.innerWidth <= 768) {
                document.querySelector('.sidebar').classList.remove('active');
            }
            
            if (sectionId === 'chat-section') {
                window.location.href = '/';
            }
        }

        // Fermer la sidebar en cliquant en dehors
        document.addEventListener('click', function(event) {
            const sidebar = document.querySelector('.sidebar');
            const menuToggle = document.querySelector('.menu-toggle');
            
            if (window.innerWidth <= 768 && 
                !sidebar.contains(event.target) && 
                !menuToggle.contains(event.target) &&
                sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    </script>
</head>
<body>
    <div class="mobile-header">
        <button class="menu-toggle" onclick="toggleSidebar()">☰</button>
        <img src="https://res.cloudinary.com/dxy0fiahv/image/upload/v1732541188/logo_ydiaeh.png" alt="Le Temps de Dieu" class="mobile-logo">
    </div>

    <div class="sidebar">
        <div class="bot-name">
            <img src="https://res.cloudinary.com/dxy0fiahv/image/upload/v1732541188/logo_ydiaeh.png" alt="Le Temps de Dieu" class="logo">
        </div>
        <button class="sidebar-button" onclick="showSection('chat-section')">🏠 Nouvelle conversation</button>
        <button class="sidebar-button" onclick="showSection('about-section')">📚 À propos</button>
        <button class="sidebar-button" onclick="showSection('settings-section')">⚙️ Paramètres</button>
    </div>
    
    <div class="main-content">
        <!-- Section Chat -->
        <div id="chat-section" class="section {% if current_section != 'about' and current_section != 'settings' %}{% else %}hidden{% endif %}">
            <div class="chat-header">
                <div class="message-tag">salut</div>
                <button class="share-button">
                    <svg viewBox="0 0 24 24">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                    </svg>
                    Partager
                </button>
            </div>
            <div class="chat-container">
                <div class="message-container bot-message">
                    <div class="avatar">TD</div>
                    <div class="message-content">
                        <div class="message-header">
                            <span>Le Temps de Dieu</span>
                            <span class="message-time">À l'instant</span>
                        </div>
                        Comment puis-je vous aider à en apprendre davantage sur le christianisme et l'islam ?
                    </div>
                </div>
                {% if response %}
                    <div class="message-container user-message">
                        <div class="avatar user-avatar">U</div>
                        <div class="message-content">
                            <div class="message-header">
                                <span>Vous</span>
                                <span class="message-time">À l'instant</span>
                            </div>
                            {{ question }}
                        </div>
                    </div>
                    <div class="message-container bot-message">
                        <div class="avatar">TD</div>
                        <div class="message-content">
                            <div class="message-header">
                                <span>Le Temps de Dieu</span>
                                <span class="message-time">À l'instant</span>
                            </div>
                            {{ response }}
                        </div>
                        <div class="message-reactions">
                            <button type="button" class="reaction-button">
                                <svg viewBox="0 0 24 24">
                                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                </svg>
                                Copier
                            </button>
                            <button type="button" class="reaction-button">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                                J'aime
                            </button>
                            <button type="button" class="reaction-button">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                                </svg>
                                Régénérer
                            </button>
                            <button type="button" class="reaction-button">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                {% endif %}
            </div>
            <div class="input-container">
                <form class="input-form" method="POST">
                    <div class="input-wrapper">
                        <div class="input-options">
                            <button type="button" class="option-button">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                                </svg>
                            </button>
                            <button type="button" class="option-button">
                                <svg viewBox="0 0 24 24">
                                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                </svg>
                            </button>
                        </div>
                        <input type="text" name="question" class="input-field" placeholder="Posez votre question sur le christianisme ou l'islam..." required>
                        <button type="button" class="voice-button">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                            </svg>
                        </button>
                        <button type="submit" class="send-button">
                            <svg class="send-icon" viewBox="0 0 24 24">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="input-actions">
                        <button type="button" class="action-button">
                            <svg viewBox="0 0 24 24">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                                <path d="M14 17h-2v-2h2v2zm2-4H8v-2h8v2zm0-4H8V7h8v2z"/>
                            </svg>
                            Résumer un texte
                        </button>
                        <button type="button" class="action-button">
                            <svg viewBox="0 0 24 24">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm0-8H5V5h14v6z"/>
                            </svg>
                            Créer une image
                        </button>
                        <button type="button" class="action-button">
                            <svg viewBox="0 0 24 24">
                                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
                            </svg>
                            M'aider à écrire
                        </button>
                        <button type="button" class="action-button">
                            <svg viewBox="0 0 24 24">
                                <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                            </svg>
                            Plus
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Section À propos -->
        <div id="about-section" class="section {% if current_section == 'about' %}{% else %}hidden{% endif %}">
            <div class="about-content">
                <h2>À propos de Le Temps de Dieu</h2>
                <p>Le Temps de Dieu est un assistant spirituel conçu pour vous aider à explorer et comprendre les religions chrétienne et islamique.</p>
                <p>Caractéristiques principales :</p>
                <ul>
                    <li>Réponses basées sur des sources religieuses authentiques</li>
                    <li>Exploration comparative des traditions chrétiennes et islamiques</li>
                    <li>Respect des différentes interprétations et points de vue</li>
                    <li>Approche éducative et informative</li>
                </ul>
                <p>Version : 1.0.0</p>
            </div>
        </div>

        <!-- Section Paramètres -->
        <div id="settings-section" class="section {% if current_section == 'settings' %}{% else %}hidden{% endif %}">
            <div class="settings-content">
                <h2>Paramètres</h2>
                <p>Configuration de votre expérience avec Le Temps de Dieu :</p>
                <ul>
                    <li>Sources religieuses utilisées :
                        <ul>
                            <li>Bible (Ancien et Nouveau Testament)</li>
                            <li>Coran</li>
                            <li>Hadiths authentiques</li>
                        </ul>
                    </li>
                    <li>Langues disponibles : Français</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>
'''

@app.route('/', methods=['GET', 'POST'])
def home():
    response = None
    question = None
    current_section = request.args.get('section', 'chat')
    
    if request.method == 'POST':
        question = request.form.get('question')
        try:
            api_response = requests.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {os.getenv('DEEPSEEK_API_KEY')}"},
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": question}],
                    "temperature": 0.3
                },
                timeout=30
            )
            if api_response.status_code == 200:
                response = api_response.json()["choices"][0]["message"]["content"]
            else:
                response = f"Erreur API: {api_response.status_code}"
        except Exception as e:
            response = f"Erreur: {str(e)}"
    
    return render_template_string(HTML_TEMPLATE, response=response, question=question, current_section=current_section)

@app.route('/about')
def about():
    return render_template_string(HTML_TEMPLATE, current_section='about')

@app.route('/settings')
def settings():
    return render_template_string(HTML_TEMPLATE, current_section='settings')

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
