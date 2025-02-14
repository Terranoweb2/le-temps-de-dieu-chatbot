const axios = require('axios');
const supabase = require('./supabaseClient');
require('dotenv').config();

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { message, userId } = JSON.parse(event.body);
        
        // Vérifier si le message est vide
        if (!message || !message.trim()) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Le message ne peut pas être vide' })
            };
        }

        // Préparation du contexte religieux
        let contextPrompt = `En tant qu'assistant spécialisé dans le christianisme et l'islam, je vais répondre à votre question avec précision et respect. `;
        
        // Détecter si la question concerne Jésus/Issa
        if (message.toLowerCase().includes('jesus') || 
            message.toLowerCase().includes('issa') || 
            message.toLowerCase().includes('christ')) {
            contextPrompt += `Pour les questions sur Jésus/Issa, je présenterai les perspectives du christianisme et de l'islam avec respect. `;
        }
        
        // Détecter si la question concerne la Bible
        if (message.toLowerCase().includes('bible') || 
            message.toLowerCase().includes('moïse') || 
            message.toLowerCase().includes('prophète')) {
            contextPrompt += `Pour les questions bibliques, je m'appuie sur les textes sacrés et les interprétations traditionnelles reconnues. `;
        }

        // Détecter si la question concerne l'islam
        if (message.toLowerCase().includes('coran') || 
            message.toLowerCase().includes('islam') || 
            message.toLowerCase().includes('muhammad') ||
            message.toLowerCase().includes('mosquée')) {
            contextPrompt += `Pour les questions sur l'islam, je me base sur le Coran et les hadiths authentiques. `;
        }

        const startTime = Date.now();

        // Appel à l'API DeepSeek avec timeout
        const response = await axios({
            method: 'post',
            url: 'https://api.deepseek.com/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            data: {
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: contextPrompt
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            },
            timeout: 30000 // 30 secondes de timeout
        });

        const answer = response.data.choices[0].message.content;
        const responseTime = (Date.now() - startTime) / 1000;

        // Sauvegarder la conversation dans Supabase
        const { error: dbError } = await supabase
            .from('conversations')
            .insert([
                {
                    user_id: userId || 'anonymous',
                    question: message,
                    answer: answer,
                    response_time: responseTime
                }
            ]);

        if (dbError) {
            console.error('Erreur Supabase:', dbError);
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ answer })
        };

    } catch (error) {
        console.error('Erreur:', error);
        
        let errorMessage = "Je suis désolé, une erreur est survenue. ";
        
        if (error.code === 'ECONNABORTED') {
            errorMessage += "Le serveur met trop de temps à répondre. Veuillez réessayer.";
        } else if (error.response) {
            // Erreur de l'API
            errorMessage += "Il y a un problème avec le service. Veuillez réessayer dans quelques instants.";
        } else if (error.request) {
            // Erreur réseau
            errorMessage += "Impossible de contacter le serveur. Veuillez vérifier votre connexion.";
        } else {
            errorMessage += "Veuillez reformuler votre question ou réessayer plus tard.";
        }

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};
