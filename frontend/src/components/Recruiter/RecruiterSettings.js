import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Settings, User, Bell, Lock, Download, Building, Trash2, Eye, EyeOff, FileText, BarChart3 } from 'lucide-react';
import Sidebar from '../Layout/Sidebar';
import './RecruiterSettings.css';

const RecruiterSettings = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      emailApplicationAlerts: true,
      emailJobExpiryReminders: true,
      emailWeeklyReports: true,
      emailNewsletter: false,
      pushNotifications: true
    },
    privacy: {
      companyProfileVisibility: 'public',
      showContactInfo: true,
      allowDirectMessages: true
    },
    preferences: {
      autoRejectAfterDays: 30,
      requireCoverLetter: false,
      enableAIScreening: true,
      sendAutoResponses: true
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
    { name: 'Dashboard', path: '/recruiter/dashboard' },
    { name: 'Job Creation', path: '/recruiter/job-creation' },
    { name: 'Progress', path: '/recruiter/progress' },
    { name: 'Settings', path: '/recruiter/settings', active: true }
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
      const res = await api.put('/recruiter/update-profile', {
      name: settings.name,
      email: settings.email,
      company: settings.company
    });
    setUser(res.data.user);
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
      await api.put('/recruiter/change-password', {
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
      await api.put('/recruiter/notification-settings', settings.notifications);
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
      await api.put('/recruiter/privacy-settings', settings.privacy);
      showMessage('success', 'Privacy settings updated!');
    } catch (error) {
      showMessage('error', 'Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setLoading(true);
    try {
      await api.put('/recruiter/preferences', settings.preferences);
      showMessage('success', 'Preferences updated successfully!');
    } catch (error) {
      showMessage('error', 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const downloadComprehensiveReport = async () => {
    try {
      setLoading(true);
      const [jobsResponse, statsResponse] = await Promise.all([
        api.get('/recruiter/jobs'),
        api.get('/recruiter/stats')
      ]);

      const jobs = jobsResponse.data;
      const stats = statsResponse.data;

      // Get detailed applications for each job
      const jobsWithApplications = await Promise.all(
        jobs.map(async (job) => {
          try {
            const applicationsResponse = await api.get(`/recruiter/applications/${job._id}`);
            return {
              ...job,
              applications: applicationsResponse.data || []
            };
          } catch (error) {
            return {
              ...job,
              applications: []
            };
          }
        })
      );

      const report = {
        company_info: {
          company_name: user.company || 'N/A',
          recruiter_name: user.name,
          email: user.email,
          report_generated: new Date().toISOString()
        },
        summary_statistics: {
          total_jobs_posted: stats.total_jobs,
          total_applicants: stats.total_applicants,
          shortlisted_candidates: stats.shortlisted_candidates,
          hired_candidates: stats.hired_candidates,
          rejected_candidates: stats.rejected_candidates,
          success_rate: stats.total_applicants > 0 ? ((stats.hired_candidates / stats.total_applicants) * 100).toFixed(2) + '%' : '0%',
          average_time_to_hire: stats.time_to_hire + ' days',
          cost_per_hire: '$' + stats.cost_per_hire.toLocaleString()
        },
        detailed_job_breakdown: jobsWithApplications.map(job => ({
          job_title: job.title,
          skills_required: job.skills_required,
          experience_required: job.experience_years + ' years',
          qualification: job.qualification,
          location: job.location || 'Not specified',
          salary_range: job.salary_range || 'Not specified',
          posted_date: job.created_at,
          status: job.status,
          total_applications: job.applications.length,
          pending_applications: job.applications.filter(app => app.status === 'pending').length,
          approved_applications: job.applications.filter(app => app.status === 'approved').length,
          rejected_applications: job.applications.filter(app => app.status === 'rejected').length,
          hired_applications: job.applications.filter(app => app.status === 'hired').length,
          candidates_details: job.applications.map(app => ({
            name: app.candidate_name,
            email: app.candidate_email,
            application_date: app.applied_at,
            current_status: app.status,
            profile_summary: app.candidate_details?.profile ? {
              skills: app.candidate_details.profile.skills || [],
              experience: app.candidate_details.profile.experience || [],
              education: app.candidate_details.profile.education || [],
              bio: app.candidate_details.profile.bio || 'Not provided'
            } : 'Profile not available'
          }))
        })),
        recruitment_analytics: {
          most_popular_skills: this.getMostPopularSkills(jobsWithApplications),
          application_trends: this.getApplicationTrends(jobsWithApplications),
          hiring_funnel: {
            applications_received: stats.total_applicants,
            applications_reviewed: stats.total_applicants - jobsWithApplications.reduce((acc, job) => acc + job.applications.filter(app => app.status === 'pending').length, 0),
            candidates_shortlisted: stats.shortlisted_candidates,
            candidates_hired: stats.hired_candidates
          }
        }
      };

      // Create and download the comprehensive report
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `comprehensive-recruitment-report-${user.company?.replace(/\s+/g, '-') || 'company'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showMessage('success', 'Comprehensive recruitment report downloaded successfully!');
    } catch (error) {
      showMessage('error', 'Failed to generate comprehensive report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSVReport = async () => {
    try {
      setLoading(true);
      const jobsResponse = await api.get('/recruiter/jobs');
      const jobs = jobsResponse.data;

      const jobsWithApplications = await Promise.all(
        jobs.map(async (job) => {
          try {
            const applicationsResponse = await api.get(`/recruiter/applications/${job._id}`);
            return {
              ...job,
              applications: applicationsResponse.data || []
            };
          } catch (error) {
            return {
              ...job,
              applications: []
            };
          }
        })
      );

      // Create CSV data
      let csvContent = "Job Title,Skills Required,Experience,Location,Salary,Posted Date,Status,Candidate Name,Candidate Email,Application Date,Application Status,Candidate Skills\n";
      
      jobsWithApplications.forEach(job => {
        if (job.applications.length === 0) {
          csvContent += `"${job.title}","${job.skills_required}","${job.experience_years} years","${job.location || 'N/A'}","${job.salary_range || 'N/A'}","${new Date(job.created_at).toLocaleDateString()}","${job.status}","No applications","","","",""\n`;
        } else {
          job.applications.forEach(app => {
            const candidateSkills = app.candidate_details?.profile?.skills ? app.candidate_details.profile.skills.join('; ') : 'N/A';
            csvContent += `"${job.title}","${job.skills_required}","${job.experience_years} years","${job.location || 'N/A'}","${job.salary_range || 'N/A'}","${new Date(job.created_at).toLocaleDateString()}","${job.status}","${app.candidate_name}","${app.candidate_email}","${new Date(app.applied_at).toLocaleDateString()}","${app.status}","${candidateSkills}"\n`;
          });
        }
      });

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recruitment-data-${user.company?.replace(/\s+/g, '-') || 'company'}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showMessage('success', 'CSV report downloaded successfully!');
    } catch (error) {
      showMessage('error', 'Failed to generate CSV report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete your recruiter account? This will permanently delete all your job postings, applications, and data. This action cannot be undone.'
    );
    
    if (!confirmDelete) return;

    const finalConfirm = window.prompt(
      'Type "DELETE ACCOUNT" to confirm permanent deletion:'
    );
    
    if (finalConfirm !== 'DELETE ACCOUNT') {
      showMessage('error', 'Account deletion cancelled - incorrect confirmation text');
      return;
    }

    setLoading(true);

    try {
      await api.delete('/recruiter/delete-account');
      alert('Recruiter account and all associated data deleted successfully');
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
    <div className="recruiter-settings">
      <Sidebar 
        title="Recruiter Dashboard" 
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
              <h1>Recruiter Settings</h1>
              <p>Manage your account, preferences, and download recruitment data</p>
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
              Company Profile
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
              className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <Settings size={18} />
              Preferences
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <Download size={18} />
              Reports & Data
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
            {/* Company Profile Settings */}
            {activeTab === 'profile' && (
              <div className="settings-section">
                <h2>Company Profile Information</h2>
                <p>Update your company and personal information visible to candidates.</p>
                
                <form onSubmit={handleProfileUpdate} className="settings-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Your Name</label>
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

                  <div className="form-group">
                    <label htmlFor="company">Company Name</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={settings.company}
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
                <p>Keep your recruiter account secure with a strong password.</p>
                
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
                <p>Choose what recruitment notifications you want to receive.</p>
                
                <div className="settings-form">
                  <div className="toggle-group">
                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Application Alerts</h4>
                        <p>Get notified when candidates apply to your jobs</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="notifications.emailApplicationAlerts"
                          checked={settings.notifications.emailApplicationAlerts}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Job Expiry Reminders</h4>
                        <p>Reminders when your job postings are about to expire</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="notifications.emailJobExpiryReminders"
                          checked={settings.notifications.emailJobExpiryReminders}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Weekly Reports</h4>
                        <p>Receive weekly recruitment performance reports</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="notifications.emailWeeklyReports"
                          checked={settings.notifications.emailWeeklyReports}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Newsletter</h4>
                        <p>Receive our newsletter with recruitment tips and updates</p>
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
                    {loading ? 'Saving...' : 'Save Notification Preferences'}
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <div className="settings-section">
                <h2>Privacy Settings</h2>
                <p>Control who can see your company information and how candidates can contact you.</p>
                
                <div className="settings-form">
                  <div className="form-group">
                    <label htmlFor="companyProfileVisibility">Company Profile Visibility</label>
                    <select
                      id="companyProfileVisibility"
                      name="privacy.companyProfileVisibility"
                      value={settings.privacy.companyProfileVisibility}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="public">Public - Anyone can view company profile</option>
                      <option value="candidates">Candidates Only - Only registered candidates can view</option>
                      <option value="private">Private - Hidden from public search</option>
                    </select>
                  </div>

                  <div className="toggle-group">
                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Show Contact Information</h4>
                        <p>Allow candidates to see your contact details</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="privacy.showContactInfo"
                          checked={settings.privacy.showContactInfo}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Allow Direct Messages</h4>
                        <p>Let candidates send you direct messages</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="privacy.allowDirectMessages"
                          checked={settings.privacy.allowDirectMessages}
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

            {/* Preferences */}
            {activeTab === 'preferences' && (
              <div className="settings-section">
                <h2>Recruitment Preferences</h2>
                <p>Configure how you want to handle job applications and candidate screening.</p>
                
                <div className="settings-form">
                  <div className="form-group">
                    <label htmlFor="autoRejectAfterDays">Auto-reject applications after (days)</label>
                    <select
                      id="autoRejectAfterDays"
                      name="preferences.autoRejectAfterDays"
                      value={settings.preferences.autoRejectAfterDays}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                      <option value={60}>60 days</option>
                      <option value={0}>Never auto-reject</option>
                    </select>
                  </div>

                  <div className="toggle-group">
                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Require Cover Letter</h4>
                        <p>Make cover letter mandatory for all applications</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="preferences.requireCoverLetter"
                          checked={settings.preferences.requireCoverLetter}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Enable AI Screening</h4>
                        <p>Use AI to automatically screen and rank candidates</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="preferences.enableAIScreening"
                          checked={settings.preferences.enableAIScreening}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="toggle-item">
                      <div className="toggle-info">
                        <h4>Send Auto Responses</h4>
                        <p>Automatically send acknowledgment emails to applicants</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name="preferences.sendAutoResponses"
                          checked={settings.preferences.sendAutoResponses}
                          onChange={handleInputChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <button 
                    onClick={handlePreferencesUpdate}
                    disabled={loading}
                    className="save-btn"
                  >
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}

            {/* Reports & Data */}
            {activeTab === 'reports' && (
              <div className="settings-section">
                <h2>Reports & Data Export</h2>
                <p>Download comprehensive reports of your recruitment activities, job postings, and candidate data.</p>
                
                <div className="reports-grid">
                  <div className="report-card">
                    <div className="report-icon">
                      <FileText size={32} />
                    </div>
                    <div className="report-content">
                      <h3>Comprehensive Recruitment Report</h3>
                      <p>Complete JSON report including all job postings, candidate details, application statuses, hiring statistics, and detailed analytics.</p>
                      <ul>
                        <li>All job postings with full details</li>
                        <li>Complete candidate profiles and application history</li>
                        <li>Hiring statistics and success rates</li>
                        <li>Timeline and application trends</li>
                        <li>Recruitment analytics and insights</li>
                      </ul>
                      <button 
                        className="download-btn comprehensive"
                        onClick={downloadComprehensiveReport}
                        disabled={loading}
                      >
                        <Download size={16} />
                        Download JSON Report
                      </button>
                    </div>
                  </div>

                  <div className="report-card">
                    <div className="report-icon">
                      <BarChart3 size={32} />
                    </div>
                    <div className="report-content">
                      <h3>CSV Data Export</h3>
                      <p>Spreadsheet-compatible CSV export with all recruitment data for easy analysis in Excel or other tools.</p>
                      <ul>
                        <li>Job postings and candidate applications</li>
                        <li>Application statuses and dates</li>
                        <li>Candidate skills and contact information</li>
                        <li>Easy to import into spreadsheet applications</li>
                        <li>Perfect for data analysis and reporting</li>
                      </ul>
                      <button 
                        className="download-btn csv"
                        onClick={downloadCSVReport}
                        disabled={loading}
                      >
                        <Download size={16} />
                        Download CSV Report
                      </button>
                    </div>
                  </div>
                </div>

                <div className="data-info">
                  <h3>Data Export Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <strong>Data Included:</strong>
                      <p>Your reports include all job postings, candidate applications, interview schedules, hiring decisions, and complete candidate profiles with skills, experience, and contact information.</p>
                    </div>
                    <div className="info-item">
                      <strong>Privacy & Security:</strong>
                      <p>All exported data follows privacy guidelines. Only data related to your job postings and applications is included. Candidate personal data is handled according to privacy policies.</p>
                    </div>
                    <div className="info-item">
                      <strong>Report Frequency:</strong>
                      <p>You can generate and download reports as often as needed. Reports are generated in real-time and include the most current data available.</p>
                    </div>
                    <div className="info-item">
                      <strong>File Formats:</strong>
                      <p>Choose between comprehensive JSON format for detailed analysis or CSV format for spreadsheet applications. Both formats include complete recruitment data.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div className="settings-section danger-zone">
                <h2>Danger Zone</h2>
                <p>Irreversible and destructive actions for your recruiter account.</p>
                
                <div className="danger-actions">
                  <div className="danger-item">
                    <div className="danger-info">
                      <h4>Delete Recruiter Account</h4>
                      <p>Permanently delete your recruiter account, all job postings, applications, and candidate data. This action cannot be undone and will remove all recruitment history.</p>
                    </div>
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="danger-btn"
                    >
                      {loading ? 'Deleting...' : 'Delete Recruiter Account'}
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

export default RecruiterSettings;