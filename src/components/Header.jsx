import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/header.css';

// Example user data
const user = {
  name: 'Admin User',
  avatar: null, // Would be an image URL in a real app
  role: 'Administrator'
};

// Helper function to get page title from path
const getPageTitle = (pathname) => {
  switch (pathname) {
    case '/':
      return 'Dashboard';
    case '/yearly-analysis':
      return 'Yearly Analysis';
    case '/metrics-detail':
      return 'Metrics Detail';
    case '/upload-data':
      return 'Upload Data';
    case '/payment-details':
      return 'Payment Details';
    case '/transactions':
      return 'Transactions';
    case '/monthly-report':
      return 'Monthly Report';
    default:
      return 'Dashboard';
  }
};

const Header = () => {
  const location = useLocation();
  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Generate user initials for avatar placeholder
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };
  
  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('Search for:', searchValue);
    // Would implement actual search functionality here
  };
  
  // Toggle notification dropdown
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showUserMenu) setShowUserMenu(false);
  };
  
  // Toggle user menu dropdown
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    if (showNotifications) setShowNotifications(false);
  };
  
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="page-title">{getPageTitle(location.pathname)}</h1>
          <div className="page-subtitle">Today's Statistics</div>
        </div>
        
        <div className="header-right">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <div className="search-container">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="search-icon">
                <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="currentColor"/>
              </svg>
              <input
                type="text"
                placeholder="Search here..."
                value={searchValue}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
          </form>
          
          <div className="header-actions">
            <button className="notification-button" onClick={toggleNotifications}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor"/>
              </svg>
              {/* Notification indicator dot */}
              <span className="notification-indicator"></span>
            </button>
            
            {showNotifications && (
              <div className="dropdown-menu notification-dropdown">
                <div className="dropdown-header">
                  <h3>Notifications</h3>
                  <button className="dropdown-close" onClick={toggleNotifications}>×</button>
                </div>
                <div className="dropdown-content">
                  <div className="notification-item">
                    <div className="notification-icon success">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">Data upload complete</div>
                      <div className="notification-time">5 min ago</div>
                    </div>
                  </div>
                  <div className="notification-item">
                    <div className="notification-icon warning">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">High overrun detected</div>
                      <div className="notification-time">1 hour ago</div>
                    </div>
                  </div>
                  <div className="notification-item">
                    <div className="notification-icon info">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">New metrics available</div>
                      <div className="notification-time">Yesterday</div>
                    </div>
                  </div>
                </div>
                <div className="dropdown-footer">
                  <button className="view-all-button">View All</button>
                </div>
              </div>
            )}
            
            <div className="user-profile" onClick={toggleUserMenu}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="user-avatar" />
              ) : (
                <div className="user-avatar-placeholder">
                  {getInitials(user.name)}
                </div>
              )}
              <span className="user-name">{user.name}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dropdown-arrow">
                <path d="M7 10L12 15L17 10H7Z" fill="currentColor"/>
              </svg>
            </div>
            
            {showUserMenu && (
              <div className="dropdown-menu user-dropdown">
                <div className="dropdown-header">
                  <h3>My Account</h3>
                  <button className="dropdown-close" onClick={toggleUserMenu}>×</button>
                </div>
                <div className="dropdown-content">
                  <a href="#profile" className="dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 16C6.03 14 10 12.9 12 12.9C14 12.9 17.97 14 18 16C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
                    </svg>
                    <span>Profile</span>
                  </a>
                  <a href="#settings" className="dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.68 19.18 11.36 19.13 11.06L21.16 9.48C21.34 9.34 21.39 9.07 21.28 8.87L19.36 5.55C19.24 5.33 18.99 5.26 18.77 5.33L16.38 6.29C15.88 5.91 15.35 5.59 14.76 5.35L14.4 2.81C14.36 2.57 14.16 2.4 13.92 2.4H10.08C9.84 2.4 9.65 2.57 9.61 2.81L9.25 5.35C8.66 5.59 8.12 5.92 7.63 6.29L5.24 5.33C5.02 5.25 4.77 5.33 4.65 5.55L2.74 8.87C2.62 9.08 2.66 9.34 2.86 9.48L4.89 11.06C4.84 11.36 4.8 11.69 4.8 12C4.8 12.31 4.82 12.64 4.87 12.94L2.84 14.52C2.66 14.66 2.61 14.93 2.72 15.13L4.64 18.45C4.76 18.67 5.01 18.74 5.23 18.67L7.62 17.71C8.12 18.09 8.65 18.41 9.24 18.65L9.6 21.19C9.65 21.43 9.84 21.6 10.08 21.6H13.92C14.16 21.6 14.36 21.43 14.39 21.19L14.75 18.65C15.34 18.41 15.88 18.09 16.37 17.71L18.76 18.67C18.98 18.75 19.23 18.67 19.35 18.45L21.27 15.13C21.39 14.91 21.34 14.66 21.15 14.52L19.14 12.94ZM12 15.6C10.02 15.6 8.4 13.98 8.4 12C8.4 10.02 10.02 8.4 12 8.4C13.98 8.4 15.6 10.02 15.6 12C15.6 13.98 13.98 15.6 12 15.6Z" fill="currentColor"/>
                    </svg>
                    <span>Settings</span>
                  </a>
                  <a href="#help" className="dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.4 11.45 12.4 12.17 11.67L13.41 10.41C13.78 10.05 14 9.55 14 9C14 7.9 13.1 7 12 7C10.9 7 10 7.9 10 9H8C8 6.79 9.79 5 12 5C14.21 5 16 6.79 16 9C16 9.88 15.64 10.68 15.07 11.25Z" fill="currentColor"/>
                    </svg>
                    <span>Help & Support</span>
                  </a>
                </div>
                <div className="dropdown-footer">
                  <button className="logout-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.58L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;