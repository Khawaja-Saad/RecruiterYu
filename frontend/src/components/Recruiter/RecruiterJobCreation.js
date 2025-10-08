import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Briefcase, Save, ArrowLeft } from 'lucide-react';
import Sidebar from '../Layout/Sidebar';
import './RecruiterJobCreation.css';

const RecruiterJobCreation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [jobData, setJobData] = useState({
    title: '',
    skills_required: '',
    experience_years: 0,
    qualification: '',
    description: '',
    location: '',
    salary_range: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sidebarItems = [
    { name: 'Dashboard', path: '/recruiter/dashboard' },
    { name: 'Job Creation', path: '/recruiter/job-creation', active: true },
    { name: 'Progress', path: '/recruiter/progress' },
    { name: 'Settings', path: '/recruiter/settings' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setJobData({
      ...jobData,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!jobData.title.trim()) {
      setError('Job title is required');
      return;
    }
    if (!jobData.skills_required.trim()) {
      setError('Skills required field is required');
      return;
    }
    if (!jobData.qualification.trim()) {
      setError('Qualification field is required');
      return;
    }
    if (!jobData.description.trim()) {
      setError('Job description is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/recruiter/jobs', jobData);
      alert('Job created successfully!');
      navigate('/recruiter/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recruiter-job-creation">
      <Sidebar 
        title="Recruiter Dashboard" 
        items={sidebarItems} 
        user={user} 
        onLogout={logout} 
        navigate={navigate}
      />
      
      <div className="main-content">
        <div className="job-creation-header">
          <div className="header-content">
            <button className="back-btn" onClick={() => navigate('/recruiter/dashboard')}>
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            <div className="title-section">
              <Briefcase size={32} />
              <div>
                <h1>Create New Job</h1>
                <p>Post a new job opening to attract the best candidates</p>
              </div>
            </div>
          </div>
        </div>

        <div className="job-creation-container">
          <div className="job-form-card">
            <form onSubmit={handleSubmit} className="job-form">
              {error && (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              )}

              <div className="form-section">
                <h2>Basic Information</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="title">Job Title *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={jobData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Senior Software Engineer"
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={jobData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., New York, Remote, Hybrid"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="experience_years">Experience Required (Years) *</label>
                    <input
                      type="number"
                      id="experience_years"
                      name="experience_years"
                      value={jobData.experience_years}
                      onChange={handleInputChange}
                      min="0"
                      max="30"
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="salary_range">Salary Range</label>
                    <input
                      type="text"
                      id="salary_range"
                      name="salary_range"
                      value={jobData.salary_range}
                      onChange={handleInputChange}
                      placeholder="e.g., $80,000 - $120,000, Competitive"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2>Requirements</h2>
                <div className="form-group">
                  <label htmlFor="qualification">Required Qualification *</label>
                  <input
                    type="text"
                    id="qualification"
                    name="qualification"
                    value={jobData.qualification}
                    onChange={handleInputChange}
                    placeholder="e.g., Bachelor's in Computer Science or equivalent"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="skills_required">Required Skills *</label>
                  <textarea
                    id="skills_required"
                    name="skills_required"
                    value={jobData.skills_required}
                    onChange={handleInputChange}
                    placeholder="e.g., JavaScript, React, Node.js, Python, SQL (separate with commas)"
                    className="form-textarea"
                    rows={3}
                    required
                  />
                  <small className="form-hint">
                    List skills separated by commas. These will help match candidates to your job.
                  </small>
                </div>
              </div>

              <div className="form-section">
                <h2>Job Description</h2>
                <div className="form-group">
                  <label htmlFor="description">Detailed Job Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={jobData.description}
                    onChange={handleInputChange}
                    placeholder="Provide a comprehensive description of the role, responsibilities, company culture, benefits, etc."
                    className="form-textarea"
                    rows={8}
                    required
                  />
                  <small className="form-hint">
                    Include role responsibilities, company information, benefits, and what makes this opportunity special.
                  </small>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => navigate('/recruiter/dashboard')}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  <Save size={18} />
                  {loading ? 'Creating Job...' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>

          <div className="job-preview-card">
            <h2>Job Preview</h2>
            <div className="preview-content">
              {jobData.title ? (
                <div className="preview-job">
                  <div className="preview-header">
                    <h3>{jobData.title}</h3>
                    <p className="company-name">{user.company || 'Your Company'}</p>
                  </div>
                  
                  <div className="preview-meta">
                    {jobData.location && <span className="meta-item">📍 {jobData.location}</span>}
                    <span className="meta-item">💼 {jobData.experience_years} years experience</span>
                    {jobData.salary_range && <span className="meta-item">💰 {jobData.salary_range}</span>}
                  </div>

                  {jobData.qualification && (
                    <div className="preview-section">
                      <h4>Qualification Required</h4>
                      <p>{jobData.qualification}</p>
                    </div>
                  )}

                  {jobData.skills_required && (
                    <div className="preview-section">
                      <h4>Required Skills</h4>
                      <div className="skills-preview">
                        {jobData.skills_required.split(',').map((skill, index) => (
                          <span key={index} className="skill-tag">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {jobData.description && (
                    <div className="preview-section">
                      <h4>Job Description</h4>
                      <p className="description-preview">
                        {jobData.description.length > 200 
                          ? jobData.description.substring(0, 200) + '...'
                          : jobData.description
                        }
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="preview-placeholder">
                  <Briefcase size={48} />
                  <h3>Job Preview</h3>
                  <p>Fill out the form to see how your job posting will look to candidates</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterJobCreation;