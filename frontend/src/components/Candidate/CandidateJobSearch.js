import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Sidebar from '../Layout/Sidebar';
import './CandidateJobSearch.css';

const CandidateJobSearch = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);

  const sidebarItems = [
    { name: 'Dashboard', path: '/candidate/dashboard' },
    { name: 'Search Job', path: '/candidate/search-jobs', active: true },
    { name: 'Profile', path: '/candidate/profile' },
    { name: 'Settings', path: '/candidate/settings' }
  ];

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await api.get('/candidate/jobs');
        setJobs(response.data);
        setFilteredJobs(response.data);
        setError('');
      } catch (err) {
        setError('Failed to load jobs');
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    let filtered = jobs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills_required.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(job =>
        job.location && job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Experience filter
    if (experienceFilter !== 'all') {
      const expYears = parseInt(experienceFilter);
      filtered = filtered.filter(job => job.experience_years <= expYears);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, locationFilter, experienceFilter]);

  const handleApply = async (jobId) => {
    try {
      await api.post(`/candidate/apply/${jobId}`);
      
      // Update the job in local state
      setJobs(jobs.map(job => 
        job._id === jobId 
          ? { ...job, has_applied: true, application_status: 'pending' }
          : job
      ));
      
      alert('Application submitted successfully!');
    } catch (error) {
      alert('Failed to apply: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getUniqueLocations = () => {
    const locations = jobs
      .map(job => job.location)
      .filter(location => location && location.trim())
      .filter((location, index, arr) => arr.indexOf(location) === index);
    return locations;
  };

  const openJobModal = (job) => {
    setSelectedJob(job);
  };

  const closeJobModal = () => {
    setSelectedJob(null);
  };

  if (loading) {
    return (
      <div className="candidate-job-search">
        <Sidebar 
          title="Candidate Dashboard" 
          items={sidebarItems} 
          user={user} 
          onLogout={logout} 
          navigate={navigate}
        />
        <div className="main-content">
          <div className="loading-spinner">Loading available jobs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candidate-job-search">
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
    <div className="candidate-job-search">
      <Sidebar 
        title="Candidate Dashboard" 
        items={sidebarItems} 
        user={user} 
        onLogout={logout} 
        navigate={navigate}
      />
      
      <div className="main-content">
        <div className="search-header">
          <h1>Find Your Next Opportunity</h1>
          <p>Discover {jobs.length} available positions</p>
        </div>

        {/* Search and Filter Section */}
        <div className="search-filters">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by job title, skills, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filters-row">
            <div className="filter-group">
              <label>Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Locations</option>
                {getUniqueLocations().map((location, index) => (
                  <option key={index} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Experience Level</label>
              <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Any Experience</option>
                <option value="0">Entry Level (0 years)</option>
                <option value="2">Junior (≤ 2 years)</option>
                <option value="5">Mid Level (≤ 5 years)</option>
                <option value="10">Senior (≤ 10 years)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="results-summary">
          <p>Showing {filteredJobs.length} of {jobs.length} jobs</p>
        </div>

        {/* Job Listings */}
        <div className="jobs-section">
          {filteredJobs.length === 0 ? (
            <div className="no-jobs">
              <h3>No jobs found</h3>
              <p>Try adjusting your search criteria or check back later for new opportunities.</p>
            </div>
          ) : (
            <div className="jobs-grid">
              {filteredJobs.map((job) => (
                <div key={job._id} className="job-card">
                  <div className="job-header">
                    <h3>{job.title}</h3>
                    <span className="company-name">{job.company_name}</span>
                  </div>
                  
                  <div className="job-meta">
                    <span className="location">{job.location || 'Remote'}</span>
                    <span className="experience">{job.experience_years} years exp</span>
                    <span className="posted-date">Posted {formatDate(job.created_at)}</span>
                  </div>

                  <div className="job-skills">
                    <strong>Skills:</strong>
                    <div className="skills-tags">
                      {job.skills_required.split(',').slice(0, 3).map((skill, index) => (
                        <span key={index} className="skill-tag">
                          {skill.trim()}
                        </span>
                      ))}
                      {job.skills_required.split(',').length > 3 && (
                        <span className="skill-tag more">
                          +{job.skills_required.split(',').length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {job.salary_range && (
                    <div className="salary-range">
                      <strong>Salary:</strong> {job.salary_range}
                    </div>
                  )}

                  <div className="job-actions">
                    <button 
                      className="view-details-btn"
                      onClick={() => openJobModal(job)}
                    >
                      View Details
                    </button>
                    
                    {job.has_applied ? (
                      <button className="applied-btn" disabled>
                        Applied - {job.application_status || 'Pending'}
                      </button>
                    ) : (
                      <button 
                        className="apply-btn"
                        onClick={() => handleApply(job._id)}
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job Detail Modal */}
        {selectedJob && (
          <div className="job-modal-overlay" onClick={closeJobModal}>
            <div className="job-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedJob.title}</h2>
                <button className="close-btn" onClick={closeJobModal}>×</button>
              </div>
              
              <div className="modal-content">
                <div className="job-company">
                  <h3>{selectedJob.company_name}</h3>
                  <p>Posted by: {selectedJob.recruiter_name}</p>
                </div>

                <div className="job-details-full">
                  <div className="detail-row">
                    <strong>Location:</strong> {selectedJob.location || 'Remote'}
                  </div>
                  <div className="detail-row">
                    <strong>Experience Required:</strong> {selectedJob.experience_years} years
                  </div>
                  <div className="detail-row">
                    <strong>Qualification:</strong> {selectedJob.qualification}
                  </div>
                  {selectedJob.salary_range && (
                    <div className="detail-row">
                      <strong>Salary:</strong> {selectedJob.salary_range}
                    </div>
                  )}
                  <div className="detail-row">
                    <strong>Skills Required:</strong> {selectedJob.skills_required}
                  </div>
                </div>

                <div className="job-description-full">
                  <h4>Job Description</h4>
                  <p>{selectedJob.description}</p>
                </div>

                <div className="modal-actions">
                  {selectedJob.has_applied ? (
                    <button className="applied-btn" disabled>
                      Already Applied
                    </button>
                  ) : (
                    <button 
                      className="apply-btn"
                      onClick={() => {
                        handleApply(selectedJob._id);
                        closeJobModal();
                      }}
                    >
                      Apply for this Job
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateJobSearch;