import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { TrendingUp, Users, Clock, Eye, UserCheck, UserX, Calendar, Briefcase } from 'lucide-react';
import Sidebar from '../Layout/Sidebar';
import './RecruiterProgress.css';

const RecruiterProgress = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    total_applicants: 0,
    shortlisted_candidates: 0,
    hired_candidates: 0,
    rejected_candidates: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sidebarItems = [
    { name: 'Dashboard', path: '/recruiter/dashboard' },
    { name: 'Job Creation', path: '/recruiter/job-creation' },
    { name: 'Progress', path: '/recruiter/progress', active: true },
    { name: 'Settings', path: '/recruiter/settings' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch jobs and stats
        const [jobsResponse, statsResponse] = await Promise.all([
          api.get('/recruiter/jobs'),
          api.get('/recruiter/stats')
        ]);
        
        setJobs(jobsResponse.data);
        setStats(statsResponse.data);
        
        setError('');
      } catch (err) {
        setError('Failed to load progress data');
        console.error('Error fetching recruiter progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const viewJobProgress = async (job) => {
    try {
      setSelectedJob(job);
      const response = await api.get(`/recruiter/applications/${job._id}`);
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error fetching job applications:', error);
      setApplications([]);
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await api.put(`/recruiter/applications/${applicationId}`, { status });
      
      // Update the applications list
      setApplications(applications.map(app => 
        app._id === applicationId ? { ...app, status } : app
      ));
      
      alert('Application status updated successfully');
    } catch (error) {
      alert('Failed to update application status: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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

  const calculateJobProgress = (job, jobApplications = []) => {
    if (!jobApplications.length) return 0;
    
    const processedCount = jobApplications.filter(app => 
      app.status !== 'pending'
    ).length;
    
    return Math.round((processedCount / jobApplications.length) * 100);
  };

  if (loading) {
    return (
      <div className="recruiter-progress">
        <Sidebar 
          title="Recruiter Dashboard" 
          items={sidebarItems} 
          user={user} 
          onLogout={logout} 
          navigate={navigate}
        />
        <div className="main-content">
          <div className="loading-spinner">Loading progress data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recruiter-progress">
        <Sidebar 
          title="Recruiter Dashboard" 
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
    <div className="recruiter-progress">
      <Sidebar 
        title="Recruiter Dashboard" 
        items={sidebarItems} 
        user={user} 
        onLogout={logout} 
        navigate={navigate}
      />
      
      <div className="main-content">
        <div className="progress-header">
          <h1>Recruitment Progress</h1>
          <p>Track your hiring pipeline and manage applications</p>
        </div>

        {/* Overall Stats */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.total_applicants}</h3>
              <p>Total Applications</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon approved">
              <UserCheck size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.shortlisted_candidates}</h3>
              <p>Shortlisted</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon hired">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.hired_candidates}</h3>
              <p>Hired</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon rejected">
              <UserX size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.rejected_candidates}</h3>
              <p>Rejected</p>
            </div>
          </div>
        </div>

        {/* Jobs Progress */}
        <div className="jobs-progress-section">
          <h2>Job Posting Progress</h2>
          {jobs.length === 0 ? (
            <div className="no-jobs">
              <Briefcase size={48} />
              <h3>No job postings yet</h3>
              <p>Create your first job posting to start tracking applications</p>
              <button 
                className="create-job-btn"
                onClick={() => navigate('/recruiter/job-creation')}
              >
                Create Job
              </button>
            </div>
          ) : (
            <div className="jobs-grid">
              {jobs.map((job) => {
                const applicationCount = job.total_applications || 0;
                const progress = applicationCount > 0 ? Math.min(100, (applicationCount / 10) * 100) : 0;
                
                return (
                  <div key={job._id} className="job-progress-card">
                    <div className="job-header">
                      <div className="job-title">
                        <h3>{job.title}</h3>
                        <p>{job.company_name}</p>
                      </div>
                      <button 
                        className="view-btn"
                        onClick={() => viewJobProgress(job)}
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                    </div>
                    
                    <div className="job-meta">
                      <span className="meta-item">
                        <Calendar size={14} />
                        Posted {formatDate(job.created_at)}
                      </span>
                      <span className="meta-item">
                        <Users size={14} />
                        {applicationCount} applications
                      </span>
                    </div>

                    <div className="progress-bar">
                      <div className="progress-label">
                        <span>Application Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="progress-track">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="job-status">
                      <span className={`status ${job.status === 'open' ? 'active' : 'inactive'}`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Job Detail Modal */}
        {selectedJob && (
          <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">
                  <h2>{selectedJob.title}</h2>
                  <p>Applications Management</p>
                </div>
                <button className="close-btn" onClick={() => setSelectedJob(null)}>
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                <div className="job-summary">
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="summary-label">Total Applications</span>
                      <span className="summary-value">{applications.length}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Pending Review</span>
                      <span className="summary-value">
                        {applications.filter(app => app.status === 'pending').length}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Approved</span>
                      <span className="summary-value">
                        {applications.filter(app => app.status === 'approved').length}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Hired</span>
                      <span className="summary-value">
                        {applications.filter(app => app.status === 'hired').length}
                      </span>
                    </div>
                  </div>
                </div>

                {applications.length === 0 ? (
                  <div className="no-applications">
                    <Users size={48} />
                    <h3>No applications yet</h3>
                    <p>Applications for this job will appear here once candidates start applying.</p>
                  </div>
                ) : (
                  <div className="applications-management">
                    <h3>Manage Applications</h3>
                    <div className="applications-table-container">
                      <table className="applications-table">
                        <thead>
                          <tr>
                            <th>Candidate</th>
                            <th>Email</th>
                            <th>Applied Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.map((application) => (
                            <tr key={application._id}>
                              <td>
                                <div className="candidate-info">
                                  <strong>{application.candidate_name}</strong>
                                  {application.candidate_details?.profile?.skills && (
                                    <div className="candidate-skills">
                                      {application.candidate_details.profile.skills.slice(0, 2).map((skill, index) => (
                                        <span key={index} className="skill-tag">{skill}</span>
                                      ))}
                                      {application.candidate_details.profile.skills.length > 2 && (
                                        <span className="more-skills">+{application.candidate_details.profile.skills.length - 2}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>{application.candidate_email}</td>
                              <td>{formatDate(application.applied_at)}</td>
                              <td>
                                <span className={`status ${getStatusClass(application.status)}`}>
                                  {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                                </span>
                              </td>
                              <td>
                                <div className="application-actions">
                                  {application.status === 'pending' && (
                                    <>
                                      <button 
                                        className="action-btn approve"
                                        onClick={() => updateApplicationStatus(application._id, 'approved')}
                                      >
                                        <UserCheck size={14} />
                                        Approve
                                      </button>
                                      <button 
                                        className="action-btn reject"
                                        onClick={() => updateApplicationStatus(application._id, 'rejected')}
                                      >
                                        <UserX size={14} />
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  
                                  {application.status === 'approved' && (
                                    <button 
                                      className="action-btn hire"
                                      onClick={() => updateApplicationStatus(application._id, 'hired')}
                                    >
                                      <TrendingUp size={14} />
                                      Mark as Hired
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterProgress;