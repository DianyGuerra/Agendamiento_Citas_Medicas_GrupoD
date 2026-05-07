-- =====================================================
-- Migration: 006_create_user_notifications.sql
-- Description: Create user_notifications table for in-app notifications
-- This allows admin announcements and system notifications to be 
-- displayed in patient and doctor notification pages.
-- =====================================================

-- Create the user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipient (NULL means broadcast to all)
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Target role for broadcast notifications ('patient', 'doctor', 'all')
    target_role VARCHAR(50),
    
    -- Notification content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Notification type: 'announcement', 'system', 'reminder', 'alert'
    notification_type VARCHAR(50) DEFAULT 'system',
    
    -- Priority: 'low', 'normal', 'high', 'urgent'
    priority VARCHAR(20) DEFAULT 'normal',
    
    -- Status tracking
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Expiration (optional - NULL means no expiration)
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Who created this notification
    created_by_user_id UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);

-- Index for broadcast notifications (where user_id is NULL)
CREATE INDEX IF NOT EXISTS idx_user_notifications_target_role ON user_notifications(target_role) WHERE user_id IS NULL;

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = FALSE AND is_deleted = FALSE;

-- Index for active notifications (not deleted, not expired)
CREATE INDEX IF NOT EXISTS idx_user_notifications_active ON user_notifications(user_id, is_deleted, expires_at);

-- Comment on table
COMMENT ON TABLE user_notifications IS 'Stores in-app notifications for users including admin announcements, system messages, and alerts';

-- Grant permissions (adjust based on your Supabase setup)
-- These are typically handled by Supabase RLS policies

-- =====================================================
-- How to use this table:
-- 
-- 1. BROADCAST to ALL users:
--    INSERT INTO user_notifications (target_role, title, message, notification_type)
--    VALUES ('all', 'Mantenimiento Programado', 'El sistema...', 'announcement');
--
-- 2. BROADCAST to PATIENTS only:
--    INSERT INTO user_notifications (target_role, title, message, notification_type)
--    VALUES ('patient', 'Nueva funcionalidad', 'Ahora puedes...', 'announcement');
--
-- 3. DIRECT notification to specific user:
--    INSERT INTO user_notifications (user_id, title, message, notification_type)
--    VALUES ('uuid-here', 'Tu cita fue confirmada', '...', 'reminder');
--
-- 4. Query notifications for a patient:
--    SELECT * FROM user_notifications 
--    WHERE (user_id = 'patient-uuid' OR (user_id IS NULL AND target_role IN ('patient', 'all')))
--      AND is_deleted = FALSE 
--      AND (expires_at IS NULL OR expires_at > NOW())
--    ORDER BY created_at DESC;
-- =====================================================
