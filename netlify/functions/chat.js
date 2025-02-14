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
    const { question, userId } = JSON.parse(event.body);
    
    // Get AI response
    const aiResponse = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: question }],
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const botResponse = aiResponse.data.choices[0].message.content;

    // Save conversation to Supabase
    const { data, error } = await supabase
      .from('conversations')
      .insert([
        {
          user_id: userId || 'anonymous',
          question: question,
          answer: botResponse,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Supabase error:', error);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        ...aiResponse.data,
        conversation_saved: !error
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
