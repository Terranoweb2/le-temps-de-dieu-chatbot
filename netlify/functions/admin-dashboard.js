const supabase = require('./supabaseClient');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        // Get total conversations
        const { count: totalConversations } = await supabase
            .from('conversations')
            .select('count', { count: 'exact' });

        // Get total users
        const { count: totalUsers } = await supabase
            .from('users')
            .select('count', { count: 'exact' });

        // Get positive feedback percentage
        const { data: feedbackData } = await supabase
            .from('feedback')
            .select('type');
        
        const positiveFeedback = feedbackData
            ? Math.round((feedbackData.filter(f => f.type === 'positive').length / feedbackData.length) * 100)
            : 0;

        // Get average response time
        const { data: responseTimeData } = await supabase
            .from('conversations')
            .select('response_time');
        
        const avgResponseTime = responseTimeData
            ? Math.round(responseTimeData.reduce((acc, curr) => acc + curr.response_time, 0) / responseTimeData.length * 100) / 100
            : 0;

        // Get conversations per day for the last 7 days
        const { data: conversationsData } = await supabase
            .from('conversations')
            .select('created_at')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const conversationsByDay = {};
        const labels = [];
        const values = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            labels.push(dateStr);
            conversationsByDay[dateStr] = 0;
        }

        conversationsData.forEach(conv => {
            const dateStr = conv.created_at.split('T')[0];
            if (conversationsByDay[dateStr] !== undefined) {
                conversationsByDay[dateStr]++;
            }
        });

        Object.values(conversationsByDay).forEach(value => values.push(value));

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                totalConversations,
                totalUsers,
                positiveFeedback,
                avgResponseTime,
                conversationsData: {
                    labels,
                    values
                },
                feedbackData: {
                    positive: feedbackData.filter(f => f.type === 'positive').length,
                    negative: feedbackData.filter(f => f.type === 'negative').length
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
