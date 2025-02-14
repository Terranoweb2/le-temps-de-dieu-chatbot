const supabase = require('./supabaseClient');

exports.handler = async function(event, context) {
    try {
        switch (event.httpMethod) {
            case 'GET':
                const { data: conversations, error: getError } = await supabase
                    .from('conversations')
                    .select(`
                        id,
                        user_id,
                        question,
                        answer,
                        created_at,
                        response_time,
                        feedback_status
                    `)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (getError) throw getError;

                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ conversations })
                };

            case 'DELETE':
                const id = event.queryStringParameters.id;
                const { error: deleteError } = await supabase
                    .from('conversations')
                    .delete()
                    .eq('id', id);

                if (deleteError) throw deleteError;

                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ message: 'Conversation supprimée avec succès' })
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
