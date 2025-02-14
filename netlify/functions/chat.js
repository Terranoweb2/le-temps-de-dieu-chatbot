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
        
        // Détecter si la question concerne la Bible
        if (message.toLowerCase().includes('bible') || 
            message.toLowerCase().includes('moïse') || 
            message.toLowerCase().includes('jésus') ||
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

        // Appel à l'API DeepSeek
        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
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
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.status !== 200) {
            throw new Error(`Erreur API: ${response.status}`);
        }

        const answer = response.data.choices[0].message.content;
        const responseTime = (Date.now() - startTime) / 1000;

        // Sauvegarder la conversation dans Supabase
        const { error: dbError } = await supabase
            .from('conversations')
            .insert([
                {
                    user_id: userId,
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
        
        // Message d'erreur personnalisé selon le type d'erreur
        let errorMessage = "Je suis désolé, une erreur est survenue. ";
        
        if (error.message.includes('API')) {
            errorMessage += "Il y a un problème de communication avec le service. Veuillez réessayer dans quelques instants.";
        } else if (error.message.includes('Supabase')) {
            errorMessage += "Votre message a été traité mais n'a pas pu être sauvegardé. La réponse reste valide.";
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
