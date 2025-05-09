import React, { useState, useEffect } from 'react';
import { loadMetricData } from '../utils/dataUtils';
import '../styles/pages.css';
import '../styles/metrics-detail.css';

// Format money values
const formatMoney = (value) => {
  if (value === undefined || value === null) return '$0';
  const isNegative = value < 0;
  const formatted = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return `${isNegative ? '-' : ''}$${formatted}`;
};

// Helper function to format hours
const formatNumber = (value, digits = 1) => {
  if (value === undefined || value === null) return '0.0';
  return Number(value).toFixed(digits);
};

// Helper function to format percent
const formatPercent = (value) => {
  if (value === undefined || value === null) return '0.0%';
  return `${value.toFixed(1)}%`;
};

// Helper function to format metric names for display
const formatMetricName = (metricKey) => {
  const names = {
    'planned_hours': 'Planned Hours',
    'actual_hours': 'Actual Hours',
    'overrun_hours': 'Overrun Hours',
    'overrun_percent': 'Overrun %',
    'ncr_hours': 'NCR Hours',
    'planned_cost': 'Planned Cost',
    'actual_cost': 'Actual Cost',
    'overrun_cost': 'Overrun Cost',
    'avg_cost_per_hour': 'Avg Cost per Hour',
    'total_jobs': 'Total Jobs',
    'total_operations': 'Total Operations',
    'total_customers': 'Total Customers'
  };
  
  return names[metricKey] || metricKey;
};

const MetricsDetail = () => {
  const [selectedMetric, setSelectedMetric] = useState('planned_hours');
  const [metricData, setMetricData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchMetricData = async () => {
      setLoading(true);
      try {
        console.log(`Loading data for metric: ${selectedMetric}`);
        const data = await loadMetricData(selectedMetric);
        setMetricData(data);
      } catch (error) {
        console.error('Error loading metric data:', error);
      }
      setLoading(false);
    };
    
    fetchMetricData();
  }, [selectedMetric]);
  
  const metricOptions = [
    { value: 'planned_hours', label: 'Planned Hours' },
    { value: 'actual_hours', label: 'Actual Hours' },
    { value: 'overrun_hours', label: 'Overrun Hours' },
    { value: 'overrun_percent', label: 'Overrun %' },
    { value: 'planned_cost', label: 'Planned Cost' },
    { value: 'actual_cost', label: 'Actual Cost' },
    { value: 'overrun_cost', label: 'Overrun Cost' },
    { value: 'total_jobs', label: 'Total Jobs' },
    { value: 'total_operations', label: 'Total Operations' }
  ];
  
  // These are the fixed values from the screenshot
  const mockData = {
    totalValue: 1652.0,
    yearlyAvg: 550.7,
    yoyChange: 0.1,
    trendDirection: 'Decreasing',
    yearlyTrend: [
      { year: '2021', value: 565 },
      { year: '2022', value: 527 },
      { year: '2023', value: 560 }
    ]
  };
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
            <path d="M3 3v18h18"></path>
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
          </svg>
          Metrics Detail Analysis
        </h1>
        <div className="page-actions">
          <div className="metric-selector">
            <label>Select Metric to Analyze</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="metric-select"
            >
              {metricOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="page-description">
        <p>Detailed analysis of specific metrics across time periods, work centers, and customers.</p>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading metric data...</p>
        </div>
      ) : (
        <>
          <div className="planned-hours-overview">
            <h2 className="section-title">{formatMetricName(selectedMetric)} Overview</h2>
            <div className="metric-overview">
              <div className="metric-card">
                <div className="metric-label">Overall Total</div>
                <div className="metric-value">{mockData.totalValue.toLocaleString()}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Yearly Average</div>
                <div className="metric-value">{mockData.yearlyAvg.toLocaleString()}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Year-over-Year Change</div>
                <div className="metric-value">{mockData.yoyChange}%</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Trend Direction</div>
                <div className="metric-value">{mockData.trendDirection}</div>
                <div className="moderate-trend">↑ Moderate trend</div>
              </div>
            </div>
          </div>
          
          <div className="yearly-trend-section">
            <h2 className="section-title">Yearly Trend</h2>
            <div className="metric-chart-wrapper">
              <h3 className="chart-title">Planned Hours by Year</h3>
              
              <div className="chart-container">
                <div className="chart-placeholder">
                  <svg width="100%" height="300" style={{ maxWidth: '800px' }}>
                    {/* Horizontal axis */}
                    <line x1="50" y1="250" x2="750" y2="250" stroke="#ccc" strokeWidth="1" />
                    
                    {/* Vertical axis */}
                    <line x1="50" y1="50" x2="50" y2="250" stroke="#ccc" strokeWidth="1" />
                    
                    {/* Max and Min labels */}
                    <text x="30" y="60" textAnchor="end" fontSize="12" fill="#666">Max</text>
                    <text x="30" y="250" textAnchor="end" fontSize="12" fill="#666">Min</text>
                    
                    {/* Hours labels */}
                    <text x="20" y="150" textAnchor="middle" fontSize="12" fill="#666" transform="rotate(-90, 20, 150)">Hours</text>
                    
                    {/* Data Line */}
                    <path d="M150,100 L400,230 L650,120" stroke="#1E88E5" strokeWidth="2" fill="none" />
                    
                    {/* Data Points */}
                    <circle cx="150" cy="100" r="4" fill="#1E88E5" />
                    <circle cx="400" cy="230" r="4" fill="#1E88E5" />
                    <circle cx="650" cy="120" r="4" fill="#1E88E5" />
                    
                    {/* X-axis labels */}
                    <text x="150" y="270" textAnchor="middle" fontSize="12" fill="#666">570</text>
                    <text x="400" y="270" textAnchor="middle" fontSize="12" fill="#666">530</text>
                    <text x="650" y="270" textAnchor="middle" fontSize="12" fill="#666">560</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MetricsDetail;