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
  return value.toFixed(digits);
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

// Trend direction indicator
const TrendIndicator = ({ direction }) => {
  if (!direction) return null;
  
  let icon, colorClass;
  if (direction.toLowerCase().includes('increasing')) {
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
      </svg>
    );
    colorClass = 'positive';
  } else if (direction.toLowerCase().includes('decreasing')) {
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <polyline points="19 12 12 19 5 12"></polyline>
      </svg>
    );
    colorClass = 'negative';
  } else {
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    );
    colorClass = 'neutral';
  }
  
  return (
    <div className={`trend-indicator ${colorClass}`}>
      {icon}
      <span>{direction}</span>
    </div>
  );
};

// Metric overview cards
const MetricOverview = ({ data, metricName }) => {
  if (!data) return null;
  
  return (
    <div className="metric-overview">
      <div className="metric-card">
        <div className="metric-label">Overall Total</div>
        <div className="metric-value">{formatNumber(data.total)}</div>
      </div>
      
      <div className="metric-card">
        <div className="metric-label">Yearly Average</div>
        <div className="metric-value">{formatNumber(data.yearly_avg)}</div>
      </div>
      
      <div className="metric-card">
        <div className="metric-label">Year-over-Year Change</div>
        <div className="metric-value">{formatPercent(data.yoy_change)}</div>
        <div className={`value-change ${data.yoy_change > 0 ? 'positive' : data.yoy_change < 0 ? 'negative' : 'neutral'}`}>
          {data.yoy_change > 0 ? '↑' : data.yoy_change < 0 ? '↓' : '→'}
        </div>
      </div>
      
      <div className="metric-card">
        <div className="metric-label">Trend Direction</div>
        <div className="metric-value">
          {data.trend_direction || 'Decreasing'}
        </div>
        <div className="moderate-trend">↑ Moderate trend</div>
      </div>
    </div>
  );
};

// Year data chart (placeholder - would be replaced with actual chart component)
const YearlyTrendChart = ({ data, metricName }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-placeholder">
        <div className="chart-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <p>No data available for {metricName}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="chart-container">
      {/* This is a placeholder for a chart component */}
      <div className="chart-placeholder">
        <div className="chart-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <p>Yearly trend of {metricName}</p>
        </div>
      </div>
    </div>
  );
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
            <MetricOverview data={metricData?.summary} metricName={formatMetricName(selectedMetric)} />
          </div>
          
          <div className="yearly-trend-section">
            <h2 className="section-title">Yearly Trend</h2>
            <div className="metric-chart-wrapper">
              <h3 className="chart-title">{formatMetricName(selectedMetric)} by Year</h3>
              <YearlyTrendChart data={metricData?.yearly_data} metricName={formatMetricName(selectedMetric)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MetricsDetail;