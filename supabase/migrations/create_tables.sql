-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_time FLOAT,
    feedback_status TEXT
);

-- Feedback table
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('positive', 'negative')),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_feedback_conversation_id ON feedback(conversation_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
CREATE INDEX idx_settings_key ON settings(key);

-- Create admin user function
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS UUID AS $$
DECLARE
    admin_id UUID;
BEGIN
    INSERT INTO users (name, email, role)
    VALUES ('Admin', 'admin@letempsde.dieu', 'admin')
    RETURNING id INTO admin_id;
    RETURN admin_id;
END;
$$ LANGUAGE plpgsql;

-- Create default settings function
CREATE OR REPLACE FUNCTION create_default_settings()
RETURNS void AS $$
BEGIN
    INSERT INTO settings (key, value) VALUES
    ('api_settings', '{"model": "deepseek-chat", "temperature": 0.3, "max_tokens": 2048}'::jsonb),
    ('chatbot_settings', '{"greeting": "Comment puis-je vous aider à en apprendre davantage sur le christianisme et l''islam ?"}'::jsonb)
    ON CONFLICT (key) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Initialize default data
SELECT create_admin_user();
SELECT create_default_settings();
