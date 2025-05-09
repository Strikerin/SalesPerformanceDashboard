import React from 'react';
import '../styles/sidebar.css';

// Icons for the sidebar
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const AnalysisIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

const MetricsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const CustomerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const WorkcenterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10l-6-6H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V10z"></path>
    <path d="M16 10V4"></path>
    <path d="M8 16h8"></path>
    <path d="M8 12h8"></path>
  </svg>
);

const ReportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const Sidebar = () => {
  // Simulate active link for demo
  const [activeLink, setActiveLink] = React.useState('dashboard');
  
  const handleLinkClick = (link) => {
    setActiveLink(link);
  };
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#F8792D" strokeWidth="2"/>
            <path d="M9 12L11 14L15 10" stroke="#F8792D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Work History</span>
        </div>
      </div>
      
      <div className="sidebar-user">
        <div className="user-avatar">
          <span>AU</span>
        </div>
        <div className="user-info">
          <div className="user-name">Admin User</div>
          <div className="user-role">Administrator</div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-group">
          <div className="nav-group-title">MAIN</div>
          <ul className="nav-list">
            <li className={activeLink === 'dashboard' ? 'nav-item active' : 'nav-item'} 
                onClick={() => handleLinkClick('dashboard')}>
              <HomeIcon />
              <span>Dashboard</span>
            </li>
            <li className={activeLink === 'yearly' ? 'nav-item active' : 'nav-item'} 
                onClick={() => handleLinkClick('yearly')}>
              <AnalysisIcon />
              <span>Yearly Analysis</span>
            </li>
            <li className={activeLink === 'metrics' ? 'nav-item active' : 'nav-item'} 
                onClick={() => handleLinkClick('metrics')}>
              <MetricsIcon />
              <span>Metrics Detail</span>
            </li>
            <li className={activeLink === 'upload' ? 'nav-item active' : 'nav-item'} 
                onClick={() => handleLinkClick('upload')}>
              <UploadIcon />
              <span>Upload Data</span>
            </li>
          </ul>
        </div>
        
        <div className="nav-group">
          <div className="nav-group-title">ANALYSIS</div>
          <ul className="nav-list">
            <li className={activeLink === 'customers' ? 'nav-item active' : 'nav-item'} 
                onClick={() => handleLinkClick('customers')}>
              <CustomerIcon />
              <span>Customer Analysis</span>
            </li>
            <li className={activeLink === 'workcenters' ? 'nav-item active' : 'nav-item'} 
                onClick={() => handleLinkClick('workcenters')}>
              <WorkcenterIcon />
              <span>Workcenter Analysis</span>
            </li>
            <li className={activeLink === 'reports' ? 'nav-item active' : 'nav-item'} 
                onClick={() => handleLinkClick('reports')}>
              <ReportIcon />
              <span>Monthly Reports</span>
            </li>
          </ul>
        </div>
        
        <div className="nav-group">
          <div className="nav-group-title">SETTINGS</div>
          <ul className="nav-list">
            <li className={activeLink === 'settings' ? 'nav-item active' : 'nav-item'} 
                onClick={() => handleLinkClick('settings')}>
              <SettingsIcon />
              <span>System Settings</span>
            </li>
          </ul>
        </div>
      </nav>
      
      <div className="sidebar-footer">
        <div className="upgrade-banner">
          <div className="upgrade-text">
            <h4>Premium Features</h4>
            <p>Upgrade to access all analysis tools</p>
          </div>
          <button className="upgrade-button">Upgrade</button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;