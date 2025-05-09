import React, { useState, useEffect } from 'react';
import { loadSummaryMetrics, loadYearlySummary, loadCustomerProfitability, loadWorkcenterTrends } from '../utils/dataUtils';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [summaryMetrics, setSummaryMetrics] = useState(null);
  const [yearlySummary, setYearlySummary] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [workcenterData, setWorkcenterData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [metricsData, yearlyData, customerData, workcenterData] = await Promise.all([
          loadSummaryMetrics(),
          loadYearlySummary(),
          loadCustomerProfitability(),
          loadWorkcenterTrends()
        ]);
        
        setSummaryMetrics(metricsData);
        setYearlySummary(yearlyData);
        setCustomerData(customerData);
        setWorkcenterData(workcenterData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
      setLoading(false);
    };
    
    fetchDashboardData();
  }, []);
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Work History Dashboard
        </h1>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <div className="dashboard-content">
          <div className="dashboard-section">
            <h2 className="section-title">Summary Metrics</h2>
            <p>Dashboard content will be implemented in a future update</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;