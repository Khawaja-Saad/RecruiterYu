import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Users, UserCheck, Clock, TrendingUp, Briefcase, Download, Eye, Trash2 } from 'lucide-react';
import Sidebar from '../Layout/Sidebar';
import './RecruiterDashboard.css';

const RecruiterDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_applicants: 0,
    shortlisted_candidates: 0,
    hired_candidates: 0,
    rejected_candidates: 0,
    cost_per_hire: 0,
    time_to_hire: 0,
    time_to_fill: 0,
    total_jobs: 0
  });
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobApplications, setJobApplications] = useState([]);

  const sidebarItems = [
    { name: 'Dashboard', path: '/recruiter/dashboard', active: true },
    { name: 'Job Creation', path: '/recruiter/job-creation' },
    { name: 'Progress', path: '/recruiter/progress' },
    { name: 'Settings', path: '/recruiter/settings' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch stats and jobs
        const [statsResponse, jobsResponse] = await Promise.all([
          api.get('/recruiter/stats'),
          api.get('/recruiter/jobs')
        ]);
        
        setStats(statsResponse.data);
        setJobs(jobsResponse.data);
        
        setError('');
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Error fetching recruiter data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This will also delete all applications for this job.')) {
      return;
    }

    try {
      await api.delete(`/recruiter/jobs/${jobId}`);
      setJobs(jobs.filter(job => job._id !== jobId));
      alert('Job deleted successfully');
    } catch (error) {
      alert('Failed to delete job: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const viewJobApplications = async (job) => {
    try {
      setSelectedJob(job);
      const response = await api.get(`/recruiter/applications/${job._id}`);
      setJobApplications(response.data || []);
    } catch (error) {
      console.error('Error fetching job applications:', error);
      setJobApplications([]);
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await api.put(`/recruiter/applications/${applicationId}`, { status });
      
      // Update the applications list
      setJobApplications(jobApplications.map(app => 
        app._id === applicationId ? { ...app, status } : app
      ));
      
      alert('Application status updated successfully');
    } catch (error) {
      alert('Failed to update application status: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const downloadRecruitmentReport = async () => {
    try {
      // Create a comprehensive report
      const report = {
        company: user.company || 'N/A',
        recruiter: user.name,
        generated_on: new Date().toISOString(),
        summary: {
          total_jobs: stats.total_jobs,
          total_applicants: stats.total_applicants,
          shortlisted_candidates: stats.shortlisted_candidates,
          hired_candidates: stats.hired_candidates,
          rejected_candidates: stats.rejected_candidates,
          cost_per_hire: stats.cost_per_hire,
          time_to_hire: stats.time_to_hire,
          time_to_fill: stats.time_to_fill
        },
        jobs_breakdown: jobs.map(job => ({
          title: job.title,
          skills_required: job.skills_required,
          experience_years: job.experience_years,
          total_applications: job.total_applications || 0,
          created_date: job.created_at,
          status: job.status
        }))
      };

      // Create and download the report
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recruitment-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Recruitment report downloaded successfully!');
    } catch (error) {
      alert('Failed to generate report: ' + error.message);
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

  if (loading) {
    return (
      <div className="recruiter-dashboard">
        <Sidebar 
          title="Recruiter Dashboard" 
          items={sidebarItems} 
          user={user} 
          onLogout={logout} 
          navigate={navigate}
        />
        <div className="main-content">
          <div className="loading-spinner">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recruiter-dashboard">
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

  const statCards = [
    {
      title: 'Total Applicants',
      value: stats.total_applicants,
      icon: <Users size={32} />,
      color: '#3498db',
      bgColor: '#e3f2fd'
    },
    {
      title: 'Shortlisted',
      value: stats.shortlisted_candidates,
      icon: <UserCheck size={32} />,
      color: '#2ecc71',
      bgColor: '#e8f5e8'
    },
    {
      title: 'Hired',
      value: stats.hired_candidates,
      icon: <TrendingUp size={32} />,
      color: '#f39c12',
      bgColor: '#fff8e1'
    },
    {
      title: 'Active Jobs',
      value: stats.total_jobs,
      icon: <Briefcase size={32} />,
      color: '#9b59b6',
      bgColor: '#f3e5f5'
    }
  ];

  return (
    <div className="recruiter-dashboard">
      <Sidebar 
        title="Recruiter Dashboard" 
        items={sidebarItems} 
        user={user} 
        onLogout={logout} 
        navigate={navigate}
      />
      
      <div className="main-content">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Recruiter Dashboard</h1>
            <p>Welcome back, {user.name}! Here's your recruitment overview.</p>
          </div>
          <button className="download-report-btn" onClick={downloadRecruitmentReport}>
            <Download size={18} />
            Download Report
          </button>
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

        {/* Performance Metrics */}
        <div className="metrics-section">
          <h2>Performance Metrics</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <Clock size={20} />
                <h3>Time to Hire</h3>
              </div>
              <div className="metric-value">{stats.time_to_hire} days</div>
              <div className="metric-description">Average time from application to hire</div>
            </div>
            <div className="metric-card">
              <div className="metric-header">
                <TrendingUp size={20} />
                <h3>Cost per Hire</h3>
              </div>
              <div className="metric-value">${stats.cost_per_hire.toLocaleString()}</div>
              <div className="metric-description">Average cost to hire one candidate</div>
            </div>
            <div className="metric-card">
              <div className="metric-header">
                <Users size={20} />
                <h3>Time to Fill</h3>
              </div>
              <div className="metric-value">{stats.time_to_fill} days</div>
              <div className="metric-description">Average time from job posting to fill</div>
            </div>
          </div>
        </div>

        {/* Jobs Management */}
        <div className="jobs-section">
          <div className="section-header">
            <h2>Your Job Postings</h2>
            <button 
              className="create-job-btn"
              onClick={() => navigate('/recruiter/job-creation')}
            >
              <Briefcase size={18} />
              Create New Job
            </button>
          </div>
          
          {jobs.length === 0 ? (
            <div className="no-jobs">
              <Briefcase size={48} />
              <h3>No jobs posted yet</h3>
              <p>Start by creating your first job posting to attract candidates.</p>
              <button 
                className="create-first-job-btn"
                onClick={() => navigate('/recruiter/job-creation')}
              >
                Create First Job
              </button>
            </div>
          ) : (
            <div className="jobs-table-container">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Skills Required</th>
                    <th>Experience</th>
                    <th>Applications</th>
                    <th>Posted Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job._id}>
                      <td>
                        <div className="job-title">
                          <strong>{job.title}</strong>
                          {job.location && <small>{job.location}</small>}
                        </div>
                      </td>
                      <td>
                        <div className="skills-preview">
                          {job.skills_required.split(',').slice(0, 2).map((skill, index) => (
                            <span key={index} className="skill-tag">{skill.trim()}</span>
                          ))}
                          {job.skills_required.split(',').length > 2 && (
                            <span className="more-skills">+{job.skills_required.split(',').length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td>{job.experience_years} years</td>
                      <td>
                        <span className="application-count">
                          {job.total_applications || 0}
                        </span>
                      </td>
                      <td>{formatDate(job.created_at)}</td>
                      <td>
                        <span className={`status ${job.status === 'open' ? 'active' : 'inactive'}`}>
                          {job.status}
                        </span>
                      </td>
                      <td>
                        <div className="job-actions">
                          <button 
                            className="action-btn view"
                            onClick={() => viewJobApplications(job)}
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteJob(job._id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Job Applications Modal */}
        {selectedJob && (
          <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Applications for {selectedJob.title}</h2>
                <button className="close-btn" onClick={() => setSelectedJob(null)}>
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                {jobApplications.length === 0 ? (
                  <div className="no-applications">
                    <Users size={48} />
                    <h3>No applications yet</h3>
                    <p>Applications for this job will appear here once candidates start applying.</p>
                  </div>
                ) : (
                  <div className="applications-list">
                    {jobApplications.map((application) => (
                      <div key={application._id} className="application-item">
                        <div className="applicant-info">
                          <div className="applicant-details">
                            <h4>{application.candidate_name}</h4>
                            <p>{application.candidate_email}</p>
                            <small>Applied on {formatDate(application.applied_at)}</small>
                          </div>
                          {application.candidate_details && (
                            <div className="candidate-profile">
                              {application.candidate_details.profile?.skills && (
                                <div className="candidate-skills">
                                  <strong>Skills:</strong>
                                  <div className="skills-list">
                                    {application.candidate_details.profile.skills.slice(0, 3).map((skill, index) => (
                                      <span key={index} className="skill-tag">{skill}</span>
                                    ))}
                                    {application.candidate_details.profile.skills.length > 3 && (
                                      <span className="more-skills">+{application.candidate_details.profile.skills.length - 3}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="application-status-actions">
                          <span className={`status ${getStatusClass(application.status)}`}>
                            {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                          </span>
                          
                          {application.status === 'pending' && (
                            <div className="status-actions">
                              <button 
                                className="action-btn approve"
                                onClick={() => updateApplicationStatus(application._id, 'approved')}
                              >
                                Approve
                              </button>
                              <button 
                                className="action-btn reject"
                                onClick={() => updateApplicationStatus(application._id, 'rejected')}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          
                          {application.status === 'approved' && (
                            <button 
                              className="action-btn hire"
                              onClick={() => updateApplicationStatus(application._id, 'hired')}
                            >
                              Mark as Hired
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
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

export default RecruiterDashboard;