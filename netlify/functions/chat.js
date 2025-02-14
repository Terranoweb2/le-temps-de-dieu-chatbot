const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

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
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { message, userId, context: messageContext = {} } = JSON.parse(event.body);

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

        // Appeler l'API DeepSeek
        const startTime = Date.now();
        const response = await axios.post(DEEPSEEK_API_URL, {
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
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            }
        });

        if (response.status !== 200) {
            throw new Error(`Erreur API DeepSeek: ${response.statusText}`);
        }

        const data = response.data;
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
        console.error('Erreur:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Une erreur est survenue lors du traitement de votre demande.'
            })
        };
    }
};
