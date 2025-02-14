const supabase = require('./supabaseClient');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        // Get recent feedback
        const { data: feedback, error: feedbackError } = await supabase
            .from('feedback')
            .select(`
                id,
                conversation_id,
                user_id,
                type,
                comment,
                created_at
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (feedbackError) throw feedbackError;

        // Get feedback trends for the last 7 days
        const { data: trendsData, error: trendsError } = await supabase
            .from('feedback')
            .select('type, created_at')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        if (trendsError) throw trendsError;

        // Process trends data
        const trendsByDay = {};
        const labels = [];
        const positiveData = [];
        const negativeData = [];

        // Initialize data structure
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            labels.push(dateStr);
            trendsByDay[dateStr] = { positive: 0, negative: 0 };
        }

        // Populate trends data
        trendsData.forEach(item => {
            const dateStr = item.created_at.split('T')[0];
            if (trendsByDay[dateStr]) {
                trendsByDay[dateStr][item.type]++;
            }
        });

        // Format data for chart
        Object.values(trendsByDay).forEach(day => {
            positiveData.push(day.positive);
            negativeData.push(day.negative);
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                feedback,
                trends: {
                    labels,
                    positive: positiveData,
                    negative: negativeData
                }
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
