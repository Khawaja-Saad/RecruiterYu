import React from 'react';
import './Sidebar.css';

const Sidebar = ({ title, items, user, onLogout, navigate }) => {
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>{title}</h2>
      </div>
      
      <nav className="sidebar-nav">
        {items.map((item, index) => (
          <button
            key={index}
            className={`nav-item ${item.active ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path)}
          >
            {item.name}
          </button>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <p>{user?.name}</p>
          <small>{user?.email}</small>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;