import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Bell, BellOff, Mail, MailOff, Check, X } from 'lucide-react';
import api from '../../services/api';

export default function NotificationSettings({ onMuteChange }) {
  const { C, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    app_enabled: true,
    email_enabled: true,
    mute_notifications: false,
    mute_emails: false
  });
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/notifications/settings');
      if (res.data?.success) {
        const pref = res.data.data;
        setSettings({
          app_enabled: pref.app_enabled !== undefined ? pref.app_enabled : true,
          email_enabled: pref.email_enabled !== undefined ? pref.email_enabled : true,
          mute_notifications: pref.app_enabled === false,
          mute_emails: pref.email_enabled === false
        });
      }
    } catch (err) {
      console.error('Failed to fetch notification settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    setSaving(true);
    try {
      const newValue = !settings.mute_notifications;
      const res = await api.put('/notifications/toggle-mute', {
        mute_notifications: newValue,
        mute_emails: settings.mute_emails
      });
      if (res.data?.success) {
        setSettings(prev => ({
          ...prev,
          mute_notifications: newValue,
          app_enabled: !newValue
        }));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        if (onMuteChange) onMuteChange(newValue);
      }
    } catch (err) {
      console.error('Failed to toggle notifications:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEmails = async () => {
    setSaving(true);
    try {
      const newValue = !settings.mute_emails;
      const res = await api.put('/notifications/toggle-mute', {
        mute_notifications: settings.mute_notifications,
        mute_emails: newValue
      });
      if (res.data?.success) {
        setSettings(prev => ({
          ...prev,
          mute_emails: newValue,
          email_enabled: !newValue
        }));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to toggle emails:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '12px', color: C.textMid, fontSize: '12px' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px',
      padding: '16px',
      background: isDark ? '#1a1a1a' : '#f8fafc',
      borderRadius: '12px',
      border: `1px solid ${C.border}`
    }}>
      {showSuccess && (
        <div style={{
          background: '#10B98115',
          color: '#10B981',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Check size={14} /> Settings updated successfully
        </div>
      )}

      <div style={{ fontSize: '13px', fontWeight: 800, color: C.text, marginBottom: '4px' }}>
        Notification Preferences
      </div>

      {/* Notification Toggle */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '12px',
        background: isDark ? '#222' : '#fff',
        borderRadius: '8px',
        border: `1px solid ${C.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: settings.mute_notifications ? '#EF444415' : '#10B98115',
            color: settings.mute_notifications ? '#EF4444' : '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {settings.mute_notifications ? <BellOff size={18} /> : <Bell size={18} />}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>
              Push Notifications
            </div>
            <div style={{ fontSize: '11px', color: C.textMid }}>
              {settings.mute_notifications ? 'Muted' : 'Active'}
            </div>
          </div>
        </div>
        <button
          onClick={handleToggleNotifications}
          disabled={saving}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${settings.mute_notifications ? '#10B981' : '#EF4444'}`,
            background: settings.mute_notifications ? '#10B981' : '#EF4444',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 800,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1
          }}
        >
          {settings.mute_notifications ? 'Unmute' : 'Mute'}
        </button>
      </div>

      {/* Email Toggle */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '12px',
        background: isDark ? '#222' : '#fff',
        borderRadius: '8px',
        border: `1px solid ${C.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: settings.mute_emails ? '#EF444415' : '#3B82F615',
            color: settings.mute_emails ? '#EF4444' : '#3B82F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {settings.mute_emails ? <MailOff size={18} /> : <Mail size={18} />}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>
              Email Notifications
            </div>
            <div style={{ fontSize: '11px', color: C.textMid }}>
              {settings.mute_emails ? 'Muted' : 'Active'}
            </div>
          </div>
        </div>
        <button
          onClick={handleToggleEmails}
          disabled={saving}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${settings.mute_emails ? '#3B82F6' : '#EF4444'}`,
            background: settings.mute_emails ? '#3B82F6' : '#EF4444',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 800,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1
          }}
        >
          {settings.mute_emails ? 'Unmute' : 'Mute'}
        </button>
      </div>
    </div>
  );
}
