-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    preferences JSONB DEFAULT '{}'::jsonb
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_time FLOAT,
    feedback_status TEXT,
    context JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Feedback table
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    type TEXT NOT NULL CHECK (type IN ('helpful', 'not_helpful', 'inappropriate', 'other')),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_feedback_conversation_id ON feedback(conversation_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_settings_category ON settings(category);

-- Create admin user function
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS UUID AS $$
DECLARE
    admin_id UUID;
BEGIN
    INSERT INTO users (name, email, role, preferences)
    VALUES (
        'Admin', 
        'admin@letempsde.dieu', 
        'admin',
        '{
            "theme": "light",
            "language": "fr",
            "notifications": true
        }'::jsonb
    )
    RETURNING id INTO admin_id;
    RETURN admin_id;
END;
$$ LANGUAGE plpgsql;

-- Create default settings function
CREATE OR REPLACE FUNCTION create_default_settings()
RETURNS void AS $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM users WHERE role = 'admin' LIMIT 1;
    
    INSERT INTO settings (key, value, description, category, updated_by) VALUES
    (
        'api_settings',
        '{
            "model": "deepseek-chat",
            "temperature": 0.7,
            "max_tokens": 2000,
            "top_p": 0.9,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        }'::jsonb,
        'Configuration de l''API DeepSeek',
        'api',
        admin_id
    ),
    (
        'chatbot_settings',
        '{
            "greeting": "Comment puis-je vous aider à en apprendre davantage sur le christianisme et l''islam ?",
            "max_context_length": 10,
            "min_response_time": 1.0,
            "max_response_time": 15.0
        }'::jsonb,
        'Configuration générale du chatbot',
        'chatbot',
        admin_id
    ),
    (
        'interface_settings',
        '{
            "theme": "auto",
            "message_display_limit": 50,
            "enable_code_highlighting": true,
            "enable_markdown": true
        }'::jsonb,
        'Configuration de l''interface utilisateur',
        'interface',
        admin_id
    )
    ON CONFLICT (key) DO UPDATE
    SET 
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Initialize default data
DO $$ 
BEGIN
    PERFORM create_admin_user();
    PERFORM create_default_settings();
END $$;
