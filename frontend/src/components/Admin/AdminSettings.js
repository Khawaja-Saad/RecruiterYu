import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Settings, User, Bell, Lock, Download, Shield, Database, Trash2, Eye, EyeOff, FileText, BarChart3, Users } from 'lucide-react';
import Sidebar from '../Layout/Sidebar';
import './AdminSettings.css';

const AdminSettings = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      systemAlerts: true,
      userRegistrations: true,
      securityNotifications: true,
      weeklyReports: true,
      maintenanceAlerts: true
    },
    systemSettings: {
      allowPublicRegistration: true,
      requireEmailVerification: true,
      enableAuditLogging: true,
      autoBackupEnabled: true,
      maintenanceMode: false
    },
    security: {
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireTwoFactor: false,
      ipWhitelist: ''
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
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalCandidates: 0,
    totalJobs: 0,
    totalApplications: 0
  });

  const sidebarItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Customers', path: '/admin/customers' },
    { name: 'Analytics', path: '/admin/analytics' },
    { name: 'Settings', path: '/admin/settings', active: true }
  ];

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setSystemStats(response.data);
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [section, key] = name.split('.');
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
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
      const res = await api.put('/admin/update-profile', {
    name: settings.name,
    email: settings.email
  });
  setUser(res.data.user); // ✅ update context instantly
  showMessage('success', 'Admin profile updated successfully!');

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

    if (settings.newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await api.put('/admin/change-password', {
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
      await api.put('/admin/notification-settings', settings.notifications);
      showMessage('success', 'Notification preferences updated!');
    } catch (error) {
      showMessage('error', 'Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSettingsUpdate = async () => {
    setLoading(true);
    try {
      await api.put('/admin/system-settings', settings.systemSettings);
      showMessage('success', 'System settings updated successfully!');
    } catch (error) {
      showMessage('error', 'Failed to update system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityUpdate = async () => {
    setLoading(true);
    try {
      await api.put('/admin/security-settings', settings.security);
      showMessage('success', 'Security settings updated successfully!');
    } catch (error) {
      showMessage('error', 'Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  const downloadPlatformReport = async () => {
    try {
      setLoading(true);
      
      const [companiesResponse, candidatesResponse] = await Promise.all([
        api.get('/admin/customers'),
        api.get('/admin/candidates')
      ]);

      const companies = companiesResponse.data;
      const candidates = candidatesResponse.data;

      // Get detailed data for each company
      const companiesWithDetails = await Promise.all(
        companies.map(async (company) => {
          try {
            const [jobsResponse, applicationsResponse] = await Promise.all([
              api.get(`/admin/company/${company._id}/jobs`),
              api.get(`/admin/company/${company._id}/applications`)
            ]);
            
            return {
              ...company,
              jobs: jobsResponse.data || [],
              applications: applicationsResponse.data || []
            };
          } catch (error) {
            return {
              ...company,
              jobs: [],
              applications: []
            };
          }
        })
      );

      // Get detailed data for candidates
      const candidatesWithDetails = await Promise.all(
        candidates.map(async (candidate) => {
          try {
            const applicationsResponse = await api.get(`/admin/candidate/${candidate._id}/applications`);
            return {
              ...candidate,
              applications: applicationsResponse.data || []
            };
          } catch (error) {
            return {
              ...candidate,
              applications: []
            };
          }
        })
      );

      const comprehensiveReport = {
        platform_overview: {
          report_generated_by: user.name,
          report_generated_at: new Date().toISOString(),
          platform_name: "RecruiterYu",
          version: "1.0.0"
        },
        platform_statistics: {
          total_users: systemStats.totalUsers,
          total_companies: systemStats.totalCompanies,
          total_candidates: systemStats.totalCandidates,
          total_jobs: systemStats.totalJobs,
          total_applications: systemStats.totalApplications,
          platform_health: "Active",
          report_period: "All Time"
        },
        companies_data: companiesWithDetails.map(company => ({
          company_id: company._id,
          company_name: company.company || 'N/A',
          contact_person: company.name,
          email: company.email,
          registration_date: company.created_at,
          account_status: company.is_active ? 'Active' : 'Inactive',
          total_jobs_posted: company.jobs.length,
          total_applications_received: company.applications.length,
          hiring_statistics: {
            pending_applications: company.applications.filter(app => app.status === 'pending').length,
            approved_applications: company.applications.filter(app => app.status === 'approved').length,
            rejected_applications: company.applications.filter(app => app.status === 'rejected').length,
            hired_applications: company.applications.filter(app => app.status === 'hired').length
          },
          job_details: company.jobs.map(job => ({
            job_title: job.title,
            skills_required: job.skills_required,
            experience_required: job.experience_years + ' years',
            location: job.location || 'N/A',
            salary_range: job.salary_range || 'N/A',
            posted_date: job.created_at,
            status: job.status,
            total_applications: job.total_applications || 0
          }))
        })),
        candidates_data: candidatesWithDetails.map(candidate => ({
          candidate_id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          registration_date: candidate.created_at,
          account_status: candidate.is_active ? 'Active' : 'Inactive',
          profile_completion: candidate.profile_completion || 0,
          total_applications: candidate.applications.length,
          application_success_rate: candidate.applications.length > 0 ? 
            ((candidate.applications.filter(app => app.status === 'hired').length / candidate.applications.length) * 100).toFixed(2) + '%' : '0%',
          profile_summary: candidate.profile ? {
            bio: candidate.profile.bio || 'Not provided',
            skills: candidate.profile.skills || [],
            experience: candidate.profile.experience || [],
            education: candidate.profile.education || [],
            certifications: candidate.profile.certifications || []
          } : 'Profile not completed',
          application_history: candidate.applications.map(app => ({
            job_title: app.job_title,
            company_name: app.company_name,
            application_date: app.applied_at,
            status: app.status
          }))
        })),
        platform_analytics: {
          user_growth: {
            total_registrations: systemStats.totalUsers,
            company_registrations: systemStats.totalCompanies,
            candidate_registrations: systemStats.totalCandidates
          },
          activity_metrics: {
            total_job_postings: systemStats.totalJobs,
            total_applications: systemStats.totalApplications,
            average_applications_per_job: systemStats.totalJobs > 0 ? 
              (systemStats.totalApplications / systemStats.totalJobs).toFixed(2) : 0
          },
          success_metrics: {
            platform_utilization: "High",
            user_engagement: "Active",
            recruitment_success_rate: "Positive"
          }
        }
      };

      const dataStr = JSON.stringify(comprehensiveReport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recruiteryu-platform-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showMessage('success', 'Platform report downloaded successfully!');
    } catch (error) {
      showMessage('error', 'Failed to generate platform report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadUserDataCSV = async () => {
    try {
      setLoading(true);
      
      const [companiesResponse, candidatesResponse] = await Promise.all([
        api.get('/admin/customers'),
        api.get('/admin/candidates')
      ]);

      let csvContent = "User Type,Name,Email,Company,Registration Date,Status,Profile Completion,Total Applications\n";
      
      // Add company data
      companiesResponse.data.forEach(company => {
        csvContent += `"Recruiter","${company.name}","${company.email}","${company.company || 'N/A'}","${new Date(company.created_at).toLocaleDateString()}","${company.is_active ? 'Active' : 'Inactive'}","100%","N/A"\n`;
      });

      // Add candidate data
      candidatesResponse.data.forEach(candidate => {
        csvContent += `"Candidate","${candidate.name}","${candidate.email}","N/A","${new Date(candidate.created_at).toLocaleDateString()}","${candidate.is_active ? 'Active' : 'Inactive'}","${candidate.profile_completion || 0}%","${candidate.applications ? candidate.applications.length : 0}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recruiteryu-users-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showMessage('success', 'User data CSV downloaded successfully!');
    } catch (error) {
      showMessage('error', 'Failed to generate CSV report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const performSystemBackup = async () => {
    try {
      setLoading(true);
      await api.post('/admin/system-backup');
      showMessage('success', 'System backup completed successfully!');
    } catch (error) {
      showMessage('error', 'Failed to perform system backup: ' + (error.response?.data?.detail || error.message));
    } finally {
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
    <div className="admin-settings">
      <Sidebar 
        title="Admin Panel" 
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
              <h1>System Administration</h1>
              <p>Manage platform settings, security, and system configurations</p>
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
              Admin Profile
            </button>
            <button 
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Lock size={18} />
              Security
            </button>
            <button 
              className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
              onClick={() => setActiveTab('system')}
            >
              <Database size={18} />
              System Settings
            </button>
            <button 
              className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={18} />
              Notifications
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <Download size={18} />
              Data Export
            </button>
            <button 
              className={`tab-btn ${activeTab === 'advanced' ? 'active' : ''}`}
              onClick={() => setActiveTab('advanced')}
            >
              <Shield size={18} />
              Advanced
            </button>
          </div>

          <div className="settings-content">
            {/* Admin Profile Settings */}
            {activeTab === 'profile' && (
              <div className="settings-section">
                <h2>Administrator Profile</h2>
                <p>Update your admin account information and personal details.</p>
                
                <form onSubmit={handleProfileUpdate} className="settings-form">
                  <div className="form-row">
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
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="save-btn"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>

                <div className="admin-stats">
                  <h3>Platform Overview</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <Users size={20} />
                      <div>
                        <span className="stat-value">{systemStats.totalUsers}</span>
                        <span className="stat-label">Total Users</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <FileText size={20} />
                      <div>
                        <span className="stat-value">{systemStats.totalJobs}</span>
                        <span className="stat-label">Active Jobs</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <BarChart3 size={20} />
                      <div>
                        <span className="stat-value">{systemStats.totalApplications}</span>
                        <span className="stat-label">Applications</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="settings-section">
                <h2>Security Configuration</h2>
                <p>Manage password security and system access controls.</p>
                
                <form onSubmit={handlePasswordChange} className="settings-form">
                  <h3>Change Admin Password</h3>
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
                        minLength="8"
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
                        minLength="8"
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

                <div className="security-settings">
                  <h3>System Security Settings</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="sessionTimeout">Session Timeout (minutes)</label>
                      <input
                        type="number"
                        id="sessionTimeout"
                        name="security.sessionTimeout"
                        value={settings.security.sessionTimeout}
                        onChange={handleInputChange}
                        min="5"
                        max="120"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="maxLoginAttempts">Max Login Attempts</label>
                      <input
                        type="number"
                        id="maxLoginAttempts"
                        name="security.maxLoginAttempts"
                        value={settings.security.maxLoginAttempts}
                        onChange={handleInputChange}
                        min="3"
                        max="10"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="ipWhitelist">IP Whitelist (comma-separated)</label>
                    <textarea
                      id="ipWhitelist"
                      name="security.ipWhitelist"
                      value={settings.security.ipWhitelist}
                      onChange={handleInputChange}
                      placeholder="192.168.1.1, 10.0.0.1"
                      className="form-textarea"
                      rows={3}
                    />
                  </div>

                  <button 
                    onClick={handleSecurityUpdate}
                    disabled={loading}
                    className="save-btn"
                  >
                    {loading ? 'Saving...' : 'Save Security Settings'}
                  </button>
                </div>
              </div>
            )}

            {/* System Settings */}
            {activeTab === 'system' && (
              <div className="settings-section">
                <h2>System Configuration</h2>
                <p>Configure platform-wide settings and system behavior.</p>
                
                <div className="settings-form">
                  <div className="toggle-group">
                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Allow Public Registration</h4>
                        <p>Allow new users to register without admin approval</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="systemSettings.allowPublicRegistration"
                          checked={settings.systemSettings.allowPublicRegistration}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Require Email Verification</h4>
                        <p>New users must verify their email address</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="systemSettings.requireEmailVerification"
                          checked={settings.systemSettings.requireEmailVerification}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Enable Audit Logging</h4>
                        <p>Log all system activities and user actions</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="systemSettings.enableAuditLogging"
                          checked={settings.systemSettings.enableAuditLogging}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Auto Backup Enabled</h4>
                        <p>Automatically backup system data daily</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="systemSettings.autoBackupEnabled"
                          checked={settings.systemSettings.autoBackupEnabled}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Maintenance Mode</h4>
                        <p>Put the platform in maintenance mode (users cannot access)</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="systemSettings.maintenanceMode"
                          checked={settings.systemSettings.maintenanceMode}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <button 
                    onClick={handleSystemSettingsUpdate}
                    disabled={loading}
                    className="save-btn"
                  >
                    {loading ? 'Saving...' : 'Save System Settings'}
                  </button>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2>Admin Notifications</h2>
                <p>Configure which system notifications you want to receive.</p>
                
                <div className="settings-form">
                  <div className="toggle-group">
                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>System Alerts</h4>
                        <p>Critical system errors and security alerts</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="notifications.systemAlerts"
                          checked={settings.notifications.systemAlerts}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>User Registrations</h4>
                        <p>Get notified when new users register</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="notifications.userRegistrations"
                          checked={settings.notifications.userRegistrations}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Security Notifications</h4>
                        <p>Login attempts, password changes, and security events</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="notifications.securityNotifications"
                          checked={settings.notifications.securityNotifications}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Weekly Reports</h4>
                        <p>Receive weekly platform analytics and usage reports</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="notifications.weeklyReports"
                          checked={settings.notifications.weeklyReports}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Maintenance Alerts</h4>
                        <p>System maintenance reminders and update notifications</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="notifications.maintenanceAlerts"
                          checked={settings.notifications.maintenanceAlerts}
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
                    {loading ? 'Saving...' : 'Save Notification Preferences'}
                  </button>
                </div>
              </div>
            )}

            {/* Data Export */}
            {activeTab === 'reports' && (
              <div className="settings-section">
                <h2>Data Export & Reports</h2>
                <p>Download comprehensive platform data and generate detailed reports.</p>
                
                <div className="reports-grid">
                  <div className="report-card">
                    <div className="report-icon">
                      <FileText size={32} />
                    </div>
                    <div className="report-content">
                      <h3>Comprehensive Platform Report</h3>
                      <p>Complete JSON export with all platform data, user information, company details, job postings, and analytics.</p>
                      <ul>
                        <li>All user accounts (companies & candidates)</li>
                        <li>Complete job postings and applications</li>
                        <li>Platform statistics and analytics</li>
                        <li>User activity and engagement metrics</li>
                        <li>System health and performance data</li>
                      </ul>
                      <button 
                        className="download-btn comprehensive"
                        onClick={downloadPlatformReport}
                        disabled={loading}
                      >
                        <Download size={16} />
                        Download Platform Report
                      </button>
                    </div>
                  </div>

                  <div className="report-card">
                    <div className="report-icon">
                      <BarChart3 size={32} />
                    </div>
                    <div className="report-content">
                      <h3>User Data CSV Export</h3>
                      <p>Spreadsheet-compatible CSV with all user information for analysis and reporting.</p>
                      <ul>
                        <li>User registration and profile data</li>
                        <li>Account status and activity levels</li>
                        <li>Company and candidate information</li>
                        <li>Application statistics</li>
                        <li>Easy import into Excel or Google Sheets</li>
                      </ul>
                      <button 
                        className="download-btn csv"
                        onClick={downloadUserDataCSV}
                        disabled={loading}
                      >
                        <Download size={16} />
                        Download CSV Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            {activeTab === 'advanced' && (
              <div className="settings-section">
                <h2>Advanced System Operations</h2>
                <p>Advanced system management tools and operations.</p>
                
                <div className="advanced-actions">
                  <div className="action-card">
                    <div className="action-info">
                      <h3>Manual System Backup</h3>
                      <p>Perform an immediate backup of all system data including users, jobs, applications, and system settings.</p>
                    </div>
                    <button 
                      className="action-btn backup"
                      onClick={performSystemBackup}
                      disabled={loading}
                    >
                      <Database size={16} />
                      {loading ? 'Creating Backup...' : 'Create Backup'}
                    </button>
                  </div>
                </div>

                <div className="system-info">
                  <h3>System Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <strong>Platform Version:</strong>
                      <span>RecruiterYu v1.0.0</span>
                    </div>
                    <div className="info-item">
                      <strong>Database Status:</strong>
                      <span className="status-active">Connected</span>
                    </div>
                    <div className="info-item">
                      <strong>Last Backup:</strong>
                      <span>Today at 12:00 AM</span>
                    </div>
                    <div className="info-item">
                      <strong>System Health:</strong>
                      <span className="status-healthy">Healthy</span>
                    </div>
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

export default AdminSettings;