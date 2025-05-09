import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import YearlyAnalysis from './pages/YearlyAnalysis';
import MetricsDetail from './pages/MetricsDetail';
import CustomerAnalysis from './pages/CustomerAnalysis';
import WorkcenterAnalysis from './pages/WorkcenterAnalysis';
import UploadData from './pages/UploadData';
import './styles/App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }
  
  const handleNavigation = (path) => {
    navigate(path);
  };
  
  // Get current active link based on path
  const getActivePath = () => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path === '/yearly-analysis') return 'yearly';
    if (path === '/metrics-detail') return 'metrics';
    if (path === '/customer-analysis') return 'customers';
    if (path === '/workcenter-analysis') return 'workcenters';
    if (path === '/upload-data') return 'upload';
    return 'dashboard';
  };
  
  return (
    <div className="app">
      <Sidebar activeLink={getActivePath()} onNavigate={handleNavigation} />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/yearly-analysis" element={<YearlyAnalysis />} />
          <Route path="/metrics-detail" element={<MetricsDetail />} />
          <Route path="/customer-analysis" element={<CustomerAnalysis />} />
          <Route path="/workcenter-analysis" element={<WorkcenterAnalysis />} />
          <Route path="/upload-data" element={<UploadData />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;