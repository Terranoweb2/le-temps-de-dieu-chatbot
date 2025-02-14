const supabase = require('./supabaseClient');

exports.handler = async function(event, context) {
    try {
        switch (event.httpMethod) {
            case 'GET':
                const { data: users, error: getError } = await supabase
                    .from('users')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (getError) throw getError;

                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ users })
                };

            case 'POST':
                const { name, email, role } = JSON.parse(event.body);
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert([{ name, email, role }])
                    .select()
                    .single();

                if (createError) throw createError;

                return {
                    statusCode: 201,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify(newUser)
                };

            case 'PUT':
                const { id, ...updateData } = JSON.parse(event.body);
                const { data: updatedUser, error: updateError } = await supabase
                    .from('users')
                    .update(updateData)
                    .eq('id', id)
                    .select()
                    .single();

                if (updateError) throw updateError;

                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify(updatedUser)
                };

            case 'DELETE':
                const userId = event.queryStringParameters.id;
                const { error: deleteError } = await supabase
                    .from('users')
                    .delete()
                    .eq('id', userId);

                if (deleteError) throw deleteError;

                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ message: 'Utilisateur supprimé avec succès' })
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
