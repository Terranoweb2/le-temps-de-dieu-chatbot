const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration DeepSeek
const DEEPSEEK_API_KEY = 'sk-43da8693bb18487198f16d4aa2118b28';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const systemPrompt = `Tu es un assistant spirituel spécialisé dans le christianisme et l'islam, nommé "Le Temps de Dieu".
Ta mission est d'aider les utilisateurs à mieux comprendre ces religions, leurs textes sacrés, leurs pratiques et leurs valeurs.
Règles importantes :
1. Reste neutre et objectif dans tes explications
2. Base tes réponses sur des sources fiables et reconnues
3. Encourage le dialogue interreligieux et le respect mutuel
4. Évite tout prosélytisme ou jugement de valeur
5. Si tu n'es pas sûr d'une information, admets-le honnêtement
6. Utilise un langage simple et accessible
7. Cite des sources quand c'est pertinent`;

exports.handler = async (event, context) => {
    // Vérifier la méthode HTTP
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Extraire les données de la requête
        const { message, userId, context: messageContext = {} } = JSON.parse(event.body);

        if (!message || !userId) {
            throw new Error('Message et userId sont requis');
        }

        console.log('Début de la requête :', { userId, messageLength: message.length });

        // Enregistrer la conversation dans Supabase
        const { data: conversationData, error: conversationError } = await supabase
            .from('conversations')
            .insert({
                user_id: userId,
                question: message,
                answer: '',
                context: messageContext
            })
            .select()
            .single();

        if (conversationError) {
            console.error('Erreur Supabase:', conversationError);
            throw new Error('Erreur lors de l\'enregistrement de la conversation');
        }

        console.log('Conversation enregistrée:', conversationData.id);

        // Appeler l'API DeepSeek
        const startTime = Date.now();
        console.log('Appel API DeepSeek...');

        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 2000,
                top_p: 0.9,
                frequency_penalty: 0,
                presence_penalty: 0
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur API DeepSeek:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(`Erreur API DeepSeek: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Réponse API reçue');

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Format de réponse invalide:', data);
            throw new Error('Format de réponse invalide de l\'API');
        }

        const answer = data.choices[0].message.content;
        const responseTime = (Date.now() - startTime) / 1000;

        // Mettre à jour la conversation avec la réponse
        const { error: updateError } = await supabase
            .from('conversations')
            .update({
                answer,
                response_time: responseTime
            })
            .eq('id', conversationData.id);

        if (updateError) {
            console.error('Erreur mise à jour Supabase:', updateError);
        }

        console.log('Réponse envoyée, temps:', responseTime);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                answer,
                conversation_id: conversationData.id,
                response_time: responseTime
            })
        };

    } catch (error) {
        console.error('Erreur générale:', error);
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
