const supabase = require('./supabaseClient');

exports.handler = async function(event, context) {
    try {
        switch (event.httpMethod) {
            case 'GET':
                const { data: settings, error: getError } = await supabase
                    .from('settings')
                    .select('*');

                if (getError) throw getError;

                const formattedSettings = settings.reduce((acc, setting) => {
                    acc[setting.key] = setting.value;
                    return acc;
                }, {});

                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify(formattedSettings)
                };

            case 'POST':
                const { type, ...settingsData } = JSON.parse(event.body);
                let key, value;

                if (type === 'api') {
                    key = 'api_settings';
                    value = {
                        apiKey: settingsData.apiKey,
                        model: settingsData.model
                    };
                } else if (type === 'chatbot') {
                    key = 'chatbot_settings';
                    value = {
                        temperature: parseFloat(settingsData.temperature),
                        maxTokens: parseInt(settingsData.maxTokens)
                    };
                } else {
                    throw new Error('Type de paramètres invalide');
                }

                const { error: upsertError } = await supabase
                    .from('settings')
                    .upsert({
                        key,
                        value,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'key'
                    });

                if (upsertError) throw upsertError;

                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ message: 'Paramètres mis à jour avec succès' })
                };

            default:
                return {
                    statusCode: 405,
                    body: JSON.stringify({ error: 'Method Not Allowed' })
                };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
