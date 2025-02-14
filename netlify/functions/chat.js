const axios = require('axios');
const supabase = require('./supabaseClient');
require('dotenv').config();

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { message, userId } = JSON.parse(event.body);
        const startTime = Date.now();

        // Appel à l'API DeepSeek
        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "Vous êtes un assistant spécialisé dans le christianisme et l'islam. Votre rôle est d'aider les utilisateurs à comprendre ces religions, leurs similitudes et leurs différences. Répondez de manière objective, respectueuse et factuelle."
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
            throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const data = response.data;
        const answer = data.choices[0].message.content;
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
            console.error('Supabase error:', dbError);
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                answer,
                responseTime
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: 'Une erreur est survenue lors du traitement de votre demande.',
                details: error.message
            })
        };
    }
};
