const axios = require('axios');
const supabase = require('./supabaseClient');
require('dotenv').config();

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { message, action = 'chat' } = JSON.parse(event.body);
        let systemPrompt = '';
        
        switch (action) {
            case 'summarize':
                systemPrompt = "Tu es un assistant expert en résumé de texte. Ta tâche est de résumer le texte fourni de manière concise tout en conservant les informations essentielles.";
                break;
            case 'create_image':
                // Intégration avec un service de génération d'images (à implémenter)
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        image_url: 'URL_DE_L_IMAGE' // À remplacer par l'URL réelle
                    })
                };
            case 'writing_help':
                systemPrompt = "Tu es un assistant expert en rédaction. Ta tâche est d'aider à améliorer et structurer le texte fourni.";
                break;
            default:
                systemPrompt = "Tu es un assistant spécialisé dans le christianisme et l'islam, capable de répondre aux questions sur ces religions de manière objective et informative.";
        }

        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 2048
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = response.data;
        
        // Sauvegarder la conversation dans Supabase
        const { error: dbError } = await supabase
            .from('conversations')
            .insert([
                {
                    user_id: event.headers['client-id'] || 'anonymous',
                    question: message,
                    answer: data.choices[0].message.content,
                    action: action
                }
            ]);

        if (dbError) {
            console.error('Database Error:', dbError);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                response: data.choices[0].message.content
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
