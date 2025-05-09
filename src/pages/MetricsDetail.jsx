import React, { useState, useEffect } from 'react';
import { loadMetricData } from '../utils/dataUtils';
import '../styles/pages.css';

// Mock chart component - would be replaced with an actual chart component
const MetricTrendChart = ({ data, metric }) => (
  <div className="chart-placeholder">
    <div className="chart-message">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
      <p>Yearly trend chart for {metric}</p>
    </div>
  </div>
);

const CustomerMetricTable = ({ data }) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th>Customer</th>
          <th>Value</th>
          <th>% of Total</th>
        </tr>
      </thead>
      <tbody>
        {data && data.map((customer, index) => (
          <tr key={index}>
            <td>{customer.list_name || customer.name}</td>
            <td>{customer.value?.toFixed(1) || 0}</td>
            <td>{customer.percent_of_total?.toFixed(1) || 0}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const WorkcenterMetricTable = ({ data }) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th>Work Center</th>
          <th>Value</th>
          <th>% of Total</th>
        </tr>
      </thead>
      <tbody>
        {data && data.map((workcenter, index) => (
          <tr key={index}>
            <td>{workcenter.workcenter}</td>
            <td>{workcenter.value?.toFixed(1) || 0}</td>
            <td>{workcenter.percent_of_total?.toFixed(1) || 0}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CorrelationsTable = ({ data }) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>Correlation</th>
          <th>Strength</th>
        </tr>
      </thead>
      <tbody>
        {data && data.map((correlation, index) => (
          <tr key={index}>
            <td>{formatMetricName(correlation.metric)}</td>
            <td>{correlation.correlation?.toFixed(2) || 0}</td>
            <td>{correlation.strength}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

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
  const [activeTab, setActiveTab] = useState('customers');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchMetricData = async () => {
      setLoading(true);
      try {
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
        <h1 className="page-title">Metrics Detail</h1>
        <div className="page-actions">
          <div className="metric-selector">
            <label>Metric:</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="year-select"
            >
              {metricOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-outline btn-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export</span>
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="page-loading">
          <div className="spinner"></div>
          <p>Loading metric data...</p>
        </div>
      ) : (
        <>
          {metricData && metricData.summary && (
            <div className="metrics-row">
              <div className="metric-box">
                <div className="metric-title">Total</div>
                <div className="metric-value">{metricData.summary.total?.toFixed(1) || 0}</div>
              </div>
              <div className="metric-box">
                <div className="metric-title">Yearly Average</div>
                <div className="metric-value">{metricData.summary.yearly_avg?.toFixed(1) || 0}</div>
              </div>
              <div className="metric-box">
                <div className="metric-title">YoY Change</div>
                <div className="metric-value">{metricData.summary.yoy_change?.toFixed(1) || 0}%</div>
              </div>
              <div className="metric-box">
                <div className="metric-title">Trend</div>
                <div className="metric-value">{metricData.summary.trend_direction || "N/A"}</div>
              </div>
            </div>
          )}
          
          <div className="chart-section">
            <h2 className="section-title">Yearly Trends</h2>
            <MetricTrendChart data={metricData?.yearly_data} metric={formatMetricName(selectedMetric)} />
          </div>
          
          <div className="tabs">
            <div className="tab-header">
              <button 
                className={`tab-button ${activeTab === 'customers' ? 'active' : ''}`}
                onClick={() => setActiveTab('customers')}
              >
                Customer Breakdown
              </button>
              <button 
                className={`tab-button ${activeTab === 'workcenters' ? 'active' : ''}`}
                onClick={() => setActiveTab('workcenters')}
              >
                Work Center Breakdown
              </button>
              <button 
                className={`tab-button ${activeTab === 'correlations' ? 'active' : ''}`}
                onClick={() => setActiveTab('correlations')}
              >
                Correlations
              </button>
            </div>
            
            <div className="tab-content">
              {activeTab === 'customers' && (
                <div className="tab-pane">
                  <h2 className="section-title">Customer Breakdown</h2>
                  <CustomerMetricTable data={metricData?.customer_data?.slice(0, 10)} />
                </div>
              )}
              
              {activeTab === 'workcenters' && (
                <div className="tab-pane">
                  <h2 className="section-title">Work Center Breakdown</h2>
                  <WorkcenterMetricTable data={metricData?.workcenter_data?.slice(0, 10)} />
                </div>
              )}
              
              {activeTab === 'correlations' && (
                <div className="tab-pane">
                  <h2 className="section-title">Correlations with Other Metrics</h2>
                  <CorrelationsTable data={metricData?.correlations} />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MetricsDetail;