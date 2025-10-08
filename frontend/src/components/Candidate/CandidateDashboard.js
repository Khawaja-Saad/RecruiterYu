import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Sidebar from '../Layout/Sidebar';
import './CandidateDashboard.css';

const CandidateDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [appliedJobs, setAppliedJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sidebarItems = [
    { name: 'Dashboard', path: '/candidate/dashboard', active: true },
    { name: 'Search Job', path: '/candidate/search-jobs' },
    { name: 'Profile', path: '/candidate/profile' },
    { name: 'Settings', path: '/candidate/settings' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch applied jobs
        const applicationsResponse = await api.get('/candidate/applications');
        setAppliedJobs(applicationsResponse.data);

        // Fetch available jobs for recommendations (limit to 6)
        const jobsResponse = await api.get('/candidate/jobs');
        const availableJobs = jobsResponse.data.filter(job => !job.has_applied).slice(0, 6);
        setRecommendedJobs(availableJobs);

        setError('');
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Error fetching candidate data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) {
      return;
    }

    try {
      await api.delete(`/candidate/applications/${applicationId}`);
      
      // Remove from local state
      setAppliedJobs(appliedJobs.filter(job => job._id !== applicationId));
      
      alert('Application withdrawn successfully!');
    } catch (error) {
      alert('Failed to withdraw application: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleQuickApply = async (jobId) => {
    try {
      await api.post(`/candidate/apply/${jobId}`);
      
      // Remove from recommended jobs and refresh applied jobs
      setRecommendedJobs(recommendedJobs.filter(job => job._id !== jobId));
      
      // Refresh applied jobs
      const applicationsResponse = await api.get('/candidate/applications');
      setAppliedJobs(applicationsResponse.data);
      
      alert('Application submitted successfully!');
    } catch (error) {
      alert('Failed to apply: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'pending':
        return 'status-pending';
      case 'rejected':
        return 'status-rejected';
      case 'hired':
        return 'status-hired';
      default:
        return 'status-pending';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="candidate-dashboard">
        <Sidebar 
          title="Candidate Dashboard" 
          items={sidebarItems} 
          user={user} 
          onLogout={logout} 
          navigate={navigate}
        />
        <div className="main-content">
          <div className="loading-spinner">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candidate-dashboard">
        <Sidebar 
          title="Candidate Dashboard" 
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

  return (
    <div className="candidate-dashboard">
      <Sidebar 
        title="Candidate Dashboard" 
        items={sidebarItems} 
        user={user} 
        onLogout={logout} 
        navigate={navigate}
      />
      
      <div className="main-content">
        <div className="dashboard-header">
          <h1>My Job Applications</h1>
          <p>Track your application status and discover new opportunities</p>
        </div>

        {/* Applied Jobs Table */}
        <div className="applied-jobs-section">
          {appliedJobs.length === 0 ? (
            <div className="no-applications">
              <h3>No applications yet</h3>
              <p>Start applying for jobs to see them here!</p>
              <button 
                onClick={() => navigate('/candidate/search-jobs')}
                className="search-jobs-btn"
              >
                Search Jobs
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appliedJobs.map((application) => (
                    <tr key={application._id}>
                      <td>{application.job_title}</td>
                      <td>{application.job_details?.company_name || 'N/A'}</td>
                      <td>{formatDate(application.applied_at)}</td>
                      <td>
                        <span className={`status ${getStatusClass(application.status)}`}>
                          {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                        </span>
                      </td>
                      <td>
                        {application.status === 'pending' && (
                          <button 
                            className="action-btn withdraw"
                            onClick={() => handleWithdraw(application._id)}
                          >
                            Withdraw
                          </button>
                        )}
                        {application.status !== 'pending' && (
                          <span className="action-disabled">
                            {application.status === 'approved' ? 'Approved' : 
                             application.status === 'rejected' ? 'Rejected' : 
                             application.status === 'hired' ? 'Hired' : 'Processing'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recommended Jobs Section */}
        <div className="recommended-jobs-section">
          <h2>Recommended Jobs for You</h2>
          {recommendedJobs.length === 0 ? (
            <div className="no-recommendations">
              <p>No job recommendations available at the moment.</p>
              <button 
                onClick={() => navigate('/candidate/search-jobs')}
                className="search-jobs-btn"
              >
                Browse All Jobs
              </button>
            </div>
          ) : (
            <div className="jobs-grid">
              {recommendedJobs.map((job) => (
                <div key={job._id} className="job-card">
                  <h3>{job.title}</h3>
                  <p className="company-name">{job.company_name}</p>
                  <div className="job-details">
                    <p><strong>Experience:</strong> {job.experience_years} years</p>
                    <p><strong>Location:</strong> {job.location || 'Not specified'}</p>
                    <p><strong>Skills:</strong> {job.skills_required}</p>
                    {job.salary_range && (
                      <p><strong>Salary:</strong> {job.salary_range}</p>
                    )}
                  </div>
                  <div className="job-actions">
                    <button 
                      className="apply-btn"
                      onClick={() => handleQuickApply(job._id)}
                    >
                      Quick Apply
                    </button>
                    <button 
                      className="view-btn"
                      onClick={() => navigate('/candidate/search-jobs')}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-box">
            <h4>{appliedJobs.length}</h4>
            <p>Total Applications</p>
          </div>
          <div className="stat-box">
            <h4>{appliedJobs.filter(app => app.status === 'pending').length}</h4>
            <p>Pending Reviews</p>
          </div>
          <div className="stat-box">
            <h4>{appliedJobs.filter(app => app.status === 'approved').length}</h4>
            <p>Approved</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;