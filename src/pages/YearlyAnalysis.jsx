import React, { useState, useEffect } from 'react';
import { loadYearData } from '../utils/dataUtils';
import '../styles/pages.css';
import '../styles/yearly-analysis.css';

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

// Year Summary Metrics component with improved design
const YearSummaryMetrics = ({ data }) => {
  if (!data) return null;
  
  // Helper function to format hours
  const formatHours = (value) => {
    if (value === undefined || value === null) return '0.0';
    return value.toFixed(1);
  };
  
  return (
    <div className="year-summary-section">
      <h2 className="year-summary-title">Year Summary - {data.year || ''}</h2>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Planned Hours</div>
          <div className="metric-value">{formatHours(data.total_planned_hours)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Actual Hours</div>
          <div className="metric-value">{formatHours(data.total_actual_hours)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Overrun Hours</div>
          <div className="metric-value">{formatHours(data.total_overrun_hours)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Ghost Hours</div>
          <div className="metric-value">{formatHours(data.ghost_hours)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">NCR Hours</div>
          <div className="metric-value">{formatHours(data.total_ncr_hours)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Planned Cost</div>
          <div className="metric-value">{formatMoney(data.total_planned_cost)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Actual Cost</div>
          <div className="metric-value">{formatMoney(data.total_actual_cost)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Opportunity Cost</div>
          <div className="metric-value">{formatMoney(data.opportunity_cost_dollars)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Suggested Buffer</div>
          <div className="metric-value">{data.recommended_buffer_percent ? `${data.recommended_buffer_percent.toFixed(1)}%` : '-0.5%'}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Total Jobs</div>
          <div className="metric-value">{data.total_jobs || 0}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Total Operations</div>
          <div className="metric-value">{data.total_operations || 0}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Unique Parts</div>
          <div className="metric-value">{data.total_unique_parts || 0}</div>
        </div>
      </div>
    </div>
  );
};

const QuarterlyBreakdown = ({ data }) => (
  <div className="quarterly-section">
    <h2 className="section-title">Quarterly Summary</h2>
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Quarter</th>
            <th>Planned</th>
            <th>Actual</th>
            <th>Overrun</th>
            <th>Cost</th>
            <th>Jobs</th>
          </tr>
        </thead>
        <tbody>
          {data && data.map((quarter, index) => (
            <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
              <td>Q{quarter.quarter}</td>
              <td>{quarter.planned_hours?.toFixed(1) || 0}</td>
              <td>{quarter.actual_hours?.toFixed(1) || 0}</td>
              <td 
                className={quarter.overrun_hours < 0 ? 'under-budget' : quarter.overrun_hours > 0 ? 'over-budget' : ''}
              >
                {quarter.overrun_hours?.toFixed(1) || 0}
              </td>
              <td>{formatMoney(quarter.overrun_cost)}</td>
              <td>{quarter.total_jobs || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const YearlyAnalysis = () => {
  const [selectedYear, setSelectedYear] = useState('2022'); // Default to 2022 to match screenshot
  const [yearData, setYearData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchYearData = async () => {
      setLoading(true);
      try {
        console.log(`Loading data for year ${selectedYear}`);
        const data = await loadYearData(selectedYear);
        setYearData(data);
      } catch (error) {
        console.error('Error loading year data:', error);
      }
      setLoading(false);
    };
    
    fetchYearData();
  }, [selectedYear]);
  
  const yearOptions = ['2021', '2022', '2023'];
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Yearly Analysis
        </h1>
        <div className="page-actions">
          <div className="year-selector">
            <label>Select Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="year-select"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="page-loading">
          <div className="spinner"></div>
          <p>Loading {selectedYear} data...</p>
        </div>
      ) : (
        <>
          <YearSummaryMetrics data={yearData?.summary} />
          
          <QuarterlyBreakdown data={yearData?.quarterly_summary} />
          
          <div className="charts-section">
            <h2 className="section-title">Quarterly Hours & Overrun Cost</h2>
            <div className="chart-container">
              {/* Chart will be added here in a future update */}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default YearlyAnalysis;