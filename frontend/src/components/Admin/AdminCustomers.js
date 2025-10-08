import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Users, Building, Eye, Trash2, X, Briefcase, UserCheck, Calendar } from 'lucide-react';
import Sidebar from '../Layout/Sidebar';
import './AdminCustomers.css';

const AdminCustomers = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('companies');
  const [companies, setCompanies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [companyApplications, setCompanyApplications] = useState([]);
  const [candidateApplications, setCandidateApplications] = useState([]);

  const sidebarItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Customers', path: '/admin/customers', active: true },
    { name: 'Analytics', path: '/admin/analytics' },
    { name: 'Settings', path: '/admin/settings' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [companiesResponse, candidatesResponse] = await Promise.all([
        api.get('/admin/customers'),
        api.get('/admin/candidates')
      ]);
      
      setCompanies(companiesResponse.data);
      if (candidatesResponse.data) {
        setCandidates(candidatesResponse.data);
      }
      setError('');
    } catch (err) {
      setError('Failed to load customer data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company? This will also delete all their jobs and applications.')) {
      return;
    }

    try {
      await api.delete(`/admin/customers/${companyId}`);
      setCompanies(companies.filter(company => company._id !== companyId));
      alert('Company deleted successfully');
    } catch (error) {
      alert('Failed to delete company: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    if (!window.confirm('Are you sure you want to delete this candidate? This will also delete all their applications.')) {
      return;
    }

    try {
      await api.delete(`/admin/candidates/${candidateId}`);
      setCandidates(candidates.filter(candidate => candidate._id !== candidateId));
      alert('Candidate deleted successfully');
    } catch (error) {
      alert('Failed to delete candidate: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const viewCompanyDetails = async (company) => {
    try {
      setSelectedCompany(company);
      
      // Fetch company's jobs and applications
      const [jobsResponse, applicationsResponse] = await Promise.all([
        api.get(`/admin/company/${company._id}/jobs`),
        api.get(`/admin/company/${company._id}/applications`)
      ]);
      
      setCompanyJobs(jobsResponse.data || []);
      setCompanyApplications(applicationsResponse.data || []);
    } catch (error) {
      console.error('Error fetching company details:', error);
      setCompanyJobs([]);
      setCompanyApplications([]);
    }
  };

  const viewCandidateDetails = async (candidate) => {
    try {
      setSelectedCandidate(candidate);
      
      // Fetch candidate's applications
      const applicationsResponse = await api.get(`/admin/candidate/${candidate._id}/applications`);
      setCandidateApplications(applicationsResponse.data || []);
    } catch (error) {
      console.error('Error fetching candidate details:', error);
      setCandidateApplications([]);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="admin-customers">
        <Sidebar 
          title="Admin Panel" 
          items={sidebarItems} 
          user={user} 
          onLogout={logout} 
          navigate={navigate}
        />
        <div className="main-content">
          <div className="loading-spinner">Loading customer data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-customers">
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
            <button onClick={fetchData} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-customers">
      <Sidebar 
        title="Admin Panel" 
        items={sidebarItems} 
        user={user} 
        onLogout={logout} 
        navigate={navigate}
      />
      
      <div className="main-content">
        <div className="customers-header">
          <h1>Customer Management</h1>
          <p>Manage companies and candidates on the platform</p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            <Building size={18} />
            Companies ({companies.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'candidates' ? 'active' : ''}`}
            onClick={() => setActiveTab('candidates')}
          >
            <Users size={18} />
            Candidates ({candidates.length})
          </button>
        </div>

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div className="tab-content">
            <div className="customers-table-container">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Contact Person</th>
                    <th>Email</th>
                    <th>Joined Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company._id}>
                      <td>
                        <div className="company-info">
                          <Building size={16} />
                          {company.company || 'N/A'}
                        </div>
                      </td>
                      <td>{company.name}</td>
                      <td>{company.email}</td>
                      <td>{formatDate(company.created_at)}</td>
                      <td>
                        <span className={`status ${company.is_active ? 'active' : 'inactive'}`}>
                          {company.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button 
                            className="action-btn view"
                            onClick={() => viewCompanyDetails(company)}
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteCompany(company._id)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <div className="tab-content">
            <div className="customers-table-container">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Joined Date</th>
                    <th>Status</th>
                    <th>Profile Completion</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate._id}>
                      <td>
                        <div className="candidate-info">
                          <Users size={16} />
                          {candidate.name}
                        </div>
                      </td>
                      <td>{candidate.email}</td>
                      <td>{formatDate(candidate.created_at)}</td>
                      <td>
                        <span className={`status ${candidate.is_active ? 'active' : 'inactive'}`}>
                          {candidate.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="profile-completion">
                          <div className="completion-bar">
                            <div 
                              className="completion-fill" 
                              style={{ width: `${candidate.profile_completion || 0}%` }}
                            ></div>
                          </div>
                          <span>{candidate.profile_completion || 0}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="actions">
                          <button 
                            className="action-btn view"
                            onClick={() => viewCandidateDetails(candidate)}
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteCandidate(candidate._id)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Company Details Modal */}
        {selectedCompany && (
          <div className="modal-overlay" onClick={() => setSelectedCompany(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <Building size={24} />
                  {selectedCompany.company || selectedCompany.name}
                </h2>
                <button className="close-btn" onClick={() => setSelectedCompany(null)}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="company-details">
                  <div className="detail-section">
                    <h3>Company Information</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="label">Contact Person:</span>
                        <span className="value">{selectedCompany.name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Email:</span>
                        <span className="value">{selectedCompany.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Company Name:</span>
                        <span className="value">{selectedCompany.company || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Join Date:</span>
                        <span className="value">{formatDate(selectedCompany.created_at)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Status:</span>
                        <span className={`status ${selectedCompany.is_active ? 'active' : 'inactive'}`}>
                          {selectedCompany.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>
                      <Briefcase size={18} />
                      Job Postings ({companyJobs.length})
                    </h3>
                    {companyJobs.length > 0 ? (
                      <div className="jobs-list">
                        {companyJobs.map((job, index) => (
                          <div key={index} className="job-item">
                            <div className="job-info">
                              <h4>{job.title}</h4>
                              <p>{job.skills_required}</p>
                            </div>
                            <div className="job-stats">
                              <span className="stat">
                                <UserCheck size={14} />
                                {job.total_applications || 0} applications
                              </span>
                              <span className="job-date">
                                <Calendar size={14} />
                                {formatDate(job.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data">No jobs posted yet</p>
                    )}
                  </div>

                  <div className="detail-section">
                    <h3>Hiring Statistics</h3>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-number">{companyJobs.length}</div>
                        <div className="stat-label">Total Jobs</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-number">{companyApplications.length}</div>
                        <div className="stat-label">Applications Received</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-number">{companyApplications.filter(app => app.status === 'approved').length}</div>
                        <div className="stat-label">Approved</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-number">{companyApplications.filter(app => app.status === 'hired').length}</div>
                        <div className="stat-label">Hired</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Candidate Details Modal */}
        {selectedCandidate && (
          <div className="modal-overlay" onClick={() => setSelectedCandidate(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <Users size={24} />
                  {selectedCandidate.name}
                </h2>
                <button className="close-btn" onClick={() => setSelectedCandidate(null)}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="candidate-details">
                  <div className="detail-section">
                    <h3>Candidate Information</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="label">Name:</span>
                        <span className="value">{selectedCandidate.name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Email:</span>
                        <span className="value">{selectedCandidate.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Join Date:</span>
                        <span className="value">{formatDate(selectedCandidate.created_at)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Status:</span>
                        <span className={`status ${selectedCandidate.is_active ? 'active' : 'inactive'}`}>
                          {selectedCandidate.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Profile Information</h3>
                    {selectedCandidate.profile && (
                      <div className="profile-info">
                        {selectedCandidate.profile.bio && (
                          <div className="profile-item">
                            <h4>About</h4>
                            <p>{selectedCandidate.profile.bio}</p>
                          </div>
                        )}
                        
                        {selectedCandidate.profile.skills && selectedCandidate.profile.skills.length > 0 && (
                          <div className="profile-item">
                            <h4>Skills</h4>
                            <div className="skills-list">
                              {selectedCandidate.profile.skills.map((skill, index) => (
                                <span key={index} className="skill-tag">{skill}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedCandidate.profile.experience && selectedCandidate.profile.experience.length > 0 && (
                          <div className="profile-item">
                            <h4>Experience</h4>
                            <div className="experience-list">
                              {selectedCandidate.profile.experience.map((exp, index) => (
                                <div key={index} className="experience-item">
                                  <strong>{exp.role} at {exp.company}</strong>
                                  <span className="duration">{exp.duration}</span>
                                  {exp.description && <p>{exp.description}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="detail-section">
                    <h3>Application History ({candidateApplications.length})</h3>
                    {candidateApplications.length > 0 ? (
                      <div className="applications-list">
                        {candidateApplications.map((app, index) => (
                          <div key={index} className="application-item">
                            <div className="app-info">
                              <h4>{app.job_title}</h4>
                              <p>{app.company_name}</p>
                            </div>
                            <div className="app-status">
                              <span className={`status status-${app.status}`}>
                                {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                              </span>
                              <span className="app-date">
                                <Calendar size={14} />
                                {formatDate(app.applied_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data">No applications submitted yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;