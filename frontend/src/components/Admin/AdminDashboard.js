import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { TrendingUp, Users, Briefcase, FileText } from 'lucide-react';
import Sidebar from '../Layout/Sidebar';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_views: 0,
    total_profit: 0,
    total_product: 0,
    total_users: 0,
    total_recruiters: 0,
    total_candidates: 0,
    total_applications: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sidebarItems = [
    { name: 'Dashboard', path: '/admin/dashboard', active: true },
    { name: 'Customers', path: '/admin/customers' },
    { name: 'Analytics', path: '/admin/analytics' },
    { name: 'Settings', path: '/admin/settings' }
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/stats');
        setStats(response.data);
        setError('');
      } catch (err) {
        setError('Failed to load dashboard statistics');
        console.error('Error fetching admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <Sidebar 
          title="Admin Panel" 
          items={sidebarItems} 
          user={user} 
          onLogout={logout} 
          navigate={navigate}
        />
        <div className="main-content">
          <div className="loading-spinner">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <Sidebar 
          title="Admin Panel" 
          items={sidebarItems} 
          user={user} 
          onLogout={logout} 
          navigate={navigate}
        />
        <div className="main-content">
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Views',
      value: stats.total_views,
      icon: <TrendingUp size={32} />,
      color: '#3498db',
      bgColor: '#e3f2fd'
    },
    {
      title: 'Total Profit',
      value: `$${stats.total_profit.toLocaleString()}`,
      icon: <TrendingUp size={32} />,
      color: '#2ecc71',
      bgColor: '#e8f5e8'
    },
    {
      title: 'Active Jobs',
      value: stats.total_product,
      icon: <Briefcase size={32} />,
      color: '#f39c12',
      bgColor: '#fff8e1'
    },
    {
      title: 'Total Users',
      value: stats.total_users,
      icon: <Users size={32} />,
      color: '#9b59b6',
      bgColor: '#f3e5f5'
    }
  ];

  const detailedStats = [
    { label: 'Total Recruiters', value: stats.total_recruiters, color: '#3498db' },
    { label: 'Total Candidates', value: stats.total_candidates, color: '#2ecc71' },
    { label: 'Job Applications', value: stats.total_applications, color: '#f39c12' }
  ];

  return (
    <div className="admin-dashboard">
      <Sidebar 
        title="Admin Panel" 
        items={sidebarItems} 
        user={user} 
        onLogout={logout} 
        navigate={navigate}
      />
      
      <div className="main-content">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Overview of platform performance and user activity</p>
        </div>

        {/* Main Stats Cards */}
        <div className="stats-grid">
          {statCards.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-content">
                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Stats */}
        <div className="detailed-stats-section">
          <h2>Platform Statistics</h2>
          <div className="detailed-stats-grid">
            {detailedStats.map((stat, index) => (
              <div key={index} className="detailed-stat-card">
                <div className="stat-bar">
                  <div 
                    className="stat-fill" 
                    style={{ 
                      backgroundColor: stat.color,
                      width: `${Math.min((stat.value / Math.max(...detailedStats.map(s => s.value))) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                <div className="stat-info">
                  <h4>{stat.value}</h4>
                  <p>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <div className="action-card" onClick={() => navigate('/admin/customers')}>
              <Users size={24} />
              <h3>Manage Customers</h3>
              <p>View and manage companies and candidates</p>
            </div>
            <div className="action-card">
              <FileText size={24} />
              <h3>Generate Reports</h3>
              <p>Create detailed platform analytics reports</p>
            </div>
            <div className="action-card">
              <Briefcase size={24} />
              <h3>Job Oversight</h3>
              <p>Monitor active job postings and applications</p>
            </div>
          </div>
        </div>

        {/* Platform Health */}
        <div className="platform-health">
          <h2>Platform Health</h2>
          <div className="health-metrics">
            <div className="health-item">
              <span className="health-label">User Activity</span>
              <div className="health-bar">
                <div className="health-fill" style={{ width: '85%', backgroundColor: '#2ecc71' }}></div>
              </div>
              <span className="health-value">85%</span>
            </div>
            <div className="health-item">
              <span className="health-label">Job Matching Rate</span>
              <div className="health-bar">
                <div className="health-fill" style={{ width: '72%', backgroundColor: '#3498db' }}></div>
              </div>
              <span className="health-value">72%</span>
            </div>
            <div className="health-item">
              <span className="health-label">Application Success</span>
              <div className="health-bar">
                <div className="health-fill" style={{ width: '68%', backgroundColor: '#f39c12' }}></div>
              </div>
              <span className="health-value">68%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;