import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { User, Camera, Plus, Trash2, Save, Edit3 } from 'lucide-react';
import Sidebar from '../Layout/Sidebar';
import './CandidateProfile.css';

const CandidateProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
    bio: '',
    profile_picture: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState({});
  const [newItems, setNewItems] = useState({
    skill: '',
    experience: { company: '', role: '', duration: '', description: '' },
    education: { degree: '', university: '', year: '', gpa: '' },
    certification: '',
    project: { name: '', description: '', technologies: '', url: '' }
  });

  const sidebarItems = [
    { name: 'Dashboard', path: '/candidate/dashboard' },
    { name: 'Search Job', path: '/candidate/search-jobs' },
    { name: 'Profile', path: '/candidate/profile', active: true },
    { name: 'Settings', path: '/candidate/settings' }
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/candidate/profile');
        if (response.data.profile) {
          setProfile(response.data.profile);
        }
        setError('');
      } catch (err) {
        setError('Failed to load profile');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const saveProfile = async () => {
    try {
      setSaving(true);
      await api.put('/candidate/profile', profile);
      alert('Profile saved successfully!');
      setEditMode({});
    } catch (err) {
      alert('Failed to save profile: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/candidate/upload-profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile({ ...profile, profile_picture: response.data.file_path });
      alert('Profile picture updated successfully!');
    } catch (error) {
      alert('Failed to upload profile picture');
    }
  };

  const addSkill = () => {
    if (newItems.skill.trim()) {
      setProfile({
        ...profile,
        skills: [...profile.skills, newItems.skill.trim()]
      });
      setNewItems({ ...newItems, skill: '' });
    }
  };

  const removeSkill = (index) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter((_, i) => i !== index)
    });
  };

  const addExperience = () => {
    if (newItems.experience.company && newItems.experience.role) {
      setProfile({
        ...profile,
        experience: [...profile.experience, { ...newItems.experience }]
      });
      setNewItems({
        ...newItems,
        experience: { company: '', role: '', duration: '', description: '' }
      });
    }
  };

  const removeExperience = (index) => {
    setProfile({
      ...profile,
      experience: profile.experience.filter((_, i) => i !== index)
    });
  };

  const addEducation = () => {
    if (newItems.education.degree && newItems.education.university) {
      setProfile({
        ...profile,
        education: [...profile.education, { ...newItems.education }]
      });
      setNewItems({
        ...newItems,
        education: { degree: '', university: '', year: '', gpa: '' }
      });
    }
  };

  const removeEducation = (index) => {
    setProfile({
      ...profile,
      education: profile.education.filter((_, i) => i !== index)
    });
  };

  const addCertification = () => {
    if (newItems.certification.trim()) {
      setProfile({
        ...profile,
        certifications: [...profile.certifications, newItems.certification.trim()]
      });
      setNewItems({ ...newItems, certification: '' });
    }
  };

  const removeCertification = (index) => {
    setProfile({
      ...profile,
      certifications: profile.certifications.filter((_, i) => i !== index)
    });
  };

  const addProject = () => {
    if (newItems.project.name && newItems.project.description) {
      setProfile({
        ...profile,
        projects: [...profile.projects, { ...newItems.project }]
      });
      setNewItems({
        ...newItems,
        project: { name: '', description: '', technologies: '', url: '' }
      });
    }
  };

  const removeProject = (index) => {
    setProfile({
      ...profile,
      projects: profile.projects.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="candidate-profile">
        <Sidebar 
          title="Candidate Dashboard" 
          items={sidebarItems} 
          user={user} 
          onLogout={logout} 
          navigate={navigate}
        />
        <div className="main-content">
          <div className="loading-spinner">Loading your profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-profile">
      <Sidebar 
        title="Candidate Dashboard" 
        items={sidebarItems} 
        user={user} 
        onLogout={logout} 
        navigate={navigate}
      />
      
      <div className="main-content">
        <div className="profile-header">
          <h1>My Profile</h1>
          <button 
            className="save-profile-btn"
            onClick={saveProfile}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <div className="profile-container">
          {/* Profile Picture and Basic Info */}
          <div className="profile-basic-info">
            <div className="profile-picture-section">
              <div className="profile-picture-container">
                {profile.profile_picture ? (
                  <img 
                    src={`http://localhost:8000${profile.profile_picture}`} 
                    alt="Profile" 
                    className="profile-picture"
                  />
                ) : (
                  <div className="profile-picture-placeholder">
                    <User size={48} />
                  </div>
                )}
                <label className="profile-picture-upload">
                  <Camera size={20} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleProfilePictureChange}
                    hidden 
                  />
                </label>
              </div>
              <div className="basic-info">
                <h2>{user.name}</h2>
                <p>{user.email}</p>
              </div>
            </div>

            {/* Bio Section */}
            <div className="bio-section">
              <h3>About Me</h3>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about yourself, your career goals, and what makes you unique..."
                className="bio-textarea"
                rows={4}
              />
            </div>
          </div>

          {/* Skills Section */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Skills</h3>
            </div>
            <div className="skills-container">
              {profile.skills.map((skill, index) => (
                <div key={index} className="skill-tag">
                  <span>{skill}</span>
                  <button 
                    onClick={() => removeSkill(index)}
                    className="remove-btn"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <div className="add-skill">
                <input
                  type="text"
                  value={newItems.skill}
                  onChange={(e) => setNewItems({ ...newItems, skill: e.target.value })}
                  placeholder="Add a skill"
                  className="add-input"
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <button onClick={addSkill} className="add-btn">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Experience Section */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Work Experience</h3>
            </div>
            {profile.experience.map((exp, index) => (
              <div key={index} className="experience-item">
                <div className="experience-header">
                  <h4>{exp.role} at {exp.company}</h4>
                  <button 
                    onClick={() => removeExperience(index)}
                    className="remove-btn"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="experience-duration">{exp.duration}</p>
                {exp.description && <p className="experience-description">{exp.description}</p>}
              </div>
            ))}
            <div className="add-experience">
              <div className="experience-form">
                <input
                  type="text"
                  value={newItems.experience.company}
                  onChange={(e) => setNewItems({
                    ...newItems,
                    experience: { ...newItems.experience, company: e.target.value }
                  })}
                  placeholder="Company"
                  className="form-input"
                />
                <input
                  type="text"
                  value={newItems.experience.role}
                  onChange={(e) => setNewItems({
                    ...newItems,
                    experience: { ...newItems.experience, role: e.target.value }
                  })}
                  placeholder="Role/Position"
                  className="form-input"
                />
                <input
                  type="text"
                  value={newItems.experience.duration}
                  onChange={(e) => setNewItems({
                    ...newItems,
                    experience: { ...newItems.experience, duration: e.target.value }
                  })}
                  placeholder="Duration (e.g., 2022-2024)"
                  className="form-input"
                />
                <textarea
                  value={newItems.experience.description}
                  onChange={(e) => setNewItems({
                    ...newItems,
                    experience: { ...newItems.experience, description: e.target.value }
                  })}
                  placeholder="Job description and achievements"
                  className="form-textarea"
                  rows={2}
                />
                <button onClick={addExperience} className="add-btn">
                  <Plus size={16} /> Add Experience
                </button>
              </div>
            </div>
          </div>

          {/* Education Section */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Education</h3>
            </div>
            {profile.education.map((edu, index) => (
              <div key={index} className="education-item">
                <div className="education-header">
                  <h4>{edu.degree}</h4>
                  <button 
                    onClick={() => removeEducation(index)}
                    className="remove-btn"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p>{edu.university}</p>
                <div className="education-details">
                  {edu.year && <span>Year: {edu.year}</span>}
                  {edu.gpa && <span>GPA: {edu.gpa}</span>}
                </div>
              </div>
            ))}
            <div className="add-education">
              <div className="education-form">
                <input
                  type="text"
                  value={newItems.education.degree}
                  onChange={(e) => setNewItems({
                    ...newItems,
                    education: { ...newItems.education, degree: e.target.value }
                  })}
                  placeholder="Degree"
                  className="form-input"
                />
                <input
                  type="text"
                  value={newItems.education.university}
                  onChange={(e) => setNewItems({
                    ...newItems,
                    education: { ...newItems.education, university: e.target.value }
                  })}
                  placeholder="University/Institution"
                  className="form-input"
                />
                <input
                  type="text"
                  value={newItems.education.year}
                  onChange={(e) => setNewItems({
                    ...newItems,
                    education: { ...newItems.education, year: e.target.value }
                  })}
                  placeholder="Graduation Year"
                  className="form-input"
                />
                <input
                  type="text"
                  value={newItems.education.gpa}
                  onChange={(e) => setNewItems({
                    ...newItems,
                    education: { ...newItems.education, gpa: e.target.value }
                  })}
                  placeholder="GPA (optional)"
                  className="form-input"
                />
                <button onClick={addEducation} className="add-btn">
                  <Plus size={16} /> Add Education
                </button>
              </div>
            </div>
          </div>

          {/* Certifications Section */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Certifications</h3>
            </div>
            <div className="certifications-container">
              {profile.certifications.map((cert, index) => (
                <div key={index} className="certification-tag">
                  <span>{cert}</span>
                  <button 
                    onClick={() => removeCertification(index)}
                    className="remove-btn"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <div className="add-certification">
                <input
                  type="text"
                  value={newItems.certification}
                  onChange={(e) => setNewItems({ ...newItems, certification: e.target.value })}
                  placeholder="Add a certification"
                  className="add-input"
                  onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                />
                <button onClick={addCertification} className="add-btn">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Projects</h3>
            </div>
            {profile.projects.map((project, index) => (
              <div key={index} className="project-item">
                <div className="project-header">
                  <h4>{project.name}</h4>
                  <button 
                    onClick={() => removeProject(index)}
                    className="remove-btn"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="project-description">{project.description}</p>
                {project.technologies && (
                  <p className="project-technologies">
                    <strong>Technologies:</strong> {project.technologies}
                  </p>
                )}
                {project.url && (
                  <a 
                    href={project.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="project-link"
                  >
                    View Project
                  </a>
                )}
              </div>
            ))}
            <div className="add-project">
              <div className="project-form">
                <input
                  type="text"
                  value={newItems.project.name}
                  onChange={(e) => setNewItems({
                    ...newItems,
                    project: { ...newItems.project, name: e.target.value }
                  })}
                  placeholder="Project Name"
                  className="form-input"
                />
                <textarea
                  value={newItems.project.description}
                  onChange={(e) => setNewItems({
                    ...newItems,
                    project: { ...newItems.project, description: e.target.value }
                  })}
                  placeholder="Project Description"
                  className="form-textarea"
                  rows={2}
                />
                <input
                  type="text"
                  value={newItems.project.technologies}
                  onChange={(e) => setNewItems({
                    ...newItems,
                    project: { ...newItems.project, technologies: e.target.value }
                  })}
                  placeholder="Technologies Used"
                  className="form-input"
                />
                <input
                  type="url"
                  value={newItems.project.url}
                  onChange={(e) => setNewItems({
                    ...newItems,
                    project: { ...newItems.project, url: e.target.value }
                  })}
                  placeholder="Project URL (optional)"
                  className="form-input"
                />
                <button onClick={addProject} className="add-btn">
                  <Plus size={16} /> Add Project
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;