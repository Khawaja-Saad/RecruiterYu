import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Settings, User, Bell, Lock, Trash2, Eye, EyeOff } from 'lucide-react';
import Sidebar from '../Layout/Sidebar';
import './CandidateSettings.css';

const CandidateSettings = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      emailJobAlerts: true,
      emailApplicationUpdates: true,
      emailNewsletter: false,
      pushNotifications: true
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: true
    }
  });

  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState({ type: '', text: '' });

  const sidebarItems = [
    { name: 'Dashboard', path: '/candidate/dashboard' },
    { name: 'Search Job', path: '/candidate/search-jobs' },
    { name: 'Profile', path: '/candidate/profile' },
    { name: 'Settings', path: '/candidate/settings', active: true }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [section, key] = name.split('.');
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.put('/candidate/update-profile', {
      name: settings.name,
      email: settings.email
    });
    setUser(res.data.user); // ✅ update context instantly
    showMessage('success', 'Profile updated successfully!');

    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (settings.newPassword !== settings.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (settings.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await api.put('/candidate/change-password', {
        current_password: settings.currentPassword,
        new_password: settings.newPassword
      });
      
      setSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      showMessage('success', 'Password changed successfully!');
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);

    try {
      await api.put('/candidate/notification-settings', settings.notifications);
      showMessage('success', 'Notification preferences updated!');
    } catch (error) {
      showMessage('error', 'Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    setLoading(true);

    try {
      await api.put('/candidate/privacy-settings', settings.privacy);
      showMessage('success', 'Privacy settings updated!');
    } catch (error) {
      showMessage('error', 'Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (!confirmDelete) return;

    const finalConfirm = window.prompt(
      'Type "DELETE" to confirm account deletion:'
    );
    
    if (finalConfirm !== 'DELETE') {
      showMessage('error', 'Account deletion cancelled');
      return;
    }

    setLoading(true);

    try {
      await api.delete('/candidate/delete-account');
      alert('Account deleted successfully');
      logout();
      navigate('/auth');
    } catch (error) {
      showMessage('error', 'Failed to delete account');
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="candidate-settings">
      <Sidebar 
        title="Candidate Dashboard" 
        items={sidebarItems} 
        user={user} 
        onLogout={logout} 
        navigate={navigate}
      />
      
      <div className="main-content">
        <div className="settings-header">
          <div className="header-content">
            <Settings size={32} />
            <div>
              <h1>Account Settings</h1>
              <p>Manage your account preferences and security</p>
            </div>
          </div>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="settings-container">
          <div className="settings-tabs">
            <button 
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} />
              Profile
            </button>
            <button 
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Lock size={18} />
              Security
            </button>
            <button 
              className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={18} />
              Notifications
            </button>
            <button 
              className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <Eye size={18} />
              Privacy
            </button>
            <button 
              className={`tab-btn ${activeTab === 'danger' ? 'active' : ''}`}
              onClick={() => setActiveTab('danger')}
            >
              <Trash2 size={18} />
              Account
            </button>
          </div>

          <div className="settings-content">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="settings-section">
                <h2>Profile Information</h2>
                <p>Update your personal information and contact details.</p>
                
                <form onSubmit={handleProfileUpdate} className="settings-form">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={settings.name}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={settings.email}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="save-btn"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="settings-section">
                <h2>Password & Security</h2>
                <p>Keep your account secure with a strong password.</p>
                
                <form onSubmit={handlePasswordChange} className="settings-form">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <div className="password-input-container">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        id="currentPassword"
                        name="currentPassword"
                        value={settings.currentPassword}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div className="password-input-container">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        id="newPassword"
                        name="newPassword"
                        value={settings.newPassword}
                        onChange={handleInputChange}
                        className="form-input"
                        minLength="6"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <div className="password-input-container">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={settings.confirmPassword}
                        onChange={handleInputChange}
                        className="form-input"
                        minLength="6"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="save-btn"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2>Notification Preferences</h2>
                <p>Choose what notifications you want to receive.</p>
                
                <div className="settings-form">
                  <div className="toggle-group">
                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Job Alerts</h4>
                        <p>Receive email notifications about new job opportunities</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="notifications.emailJobAlerts"
                          checked={settings.notifications.emailJobAlerts}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Application Updates</h4>
                        <p>Get notified about changes to your job applications</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="notifications.emailApplicationUpdates"
                          checked={settings.notifications.emailApplicationUpdates}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Newsletter</h4>
                        <p>Receive our weekly newsletter with career tips</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="notifications.emailNewsletter"
                          checked={settings.notifications.emailNewsletter}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Push Notifications</h4>
                        <p>Receive instant notifications on your device</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="notifications.pushNotifications"
                          checked={settings.notifications.pushNotifications}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <button 
                    onClick={handleNotificationUpdate}
                    disabled={loading}
                    className="save-btn"
                  >
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <div className="settings-section">
                <h2>Privacy Settings</h2>
                <p>Control who can see your information and how it's used.</p>
                
                <div className="settings-form">
                  <div className="form-group">
                    <label htmlFor="profileVisibility">Profile Visibility</label>
                    <select
                      id="profileVisibility"
                      name="privacy.profileVisibility"
                      value={settings.privacy.profileVisibility}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="public">Public - Anyone can view</option>
                      <option value="recruiters">Recruiters Only</option>
                      <option value="private">Private - Hidden from search</option>
                    </select>
                  </div>

                  <div className="toggle-group">
                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Show Email Address</h4>
                        <p>Allow recruiters to see your email address</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="privacy.showEmail"
                          checked={settings.privacy.showEmail}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Show Phone Number</h4>
                        <p>Display your phone number on your profile</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="privacy.showPhone"
                          checked={settings.privacy.showPhone}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <button 
                    onClick={handlePrivacyUpdate}
                    disabled={loading}
                    className="save-btn"
                  >
                    {loading ? 'Saving...' : 'Save Privacy Settings'}
                  </button>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div className="settings-section danger-zone">
                <h2>Danger Zone</h2>
                <p>Irreversible and destructive actions.</p>
                
                <div className="danger-actions">
                  <div className="danger-item">
                    <div className="danger-info">
                      <h4>Delete Account</h4>
                      <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                    </div>
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="danger-btn"
                    >
                      {loading ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateSettings;