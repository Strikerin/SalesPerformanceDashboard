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

// Helper function to format hours
const formatNumber = (value, decimals = 1) => {
  if (value === undefined || value === null) return '0.0';
  return Number(value).toFixed(decimals);
};

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
  
  // These are the fixed values from the screenshot
  const mockData = {
    year: '2022',
    plannedHours: 20.4,
    actualHours: 23.8,
    overrunHours: -14.0,
    ghostHours: 39.5,
    ncrHours: 51.0,
    plannedCost: 104873,
    actualCost: 58705,
    opportunityCost: -46168,
    suggestedBuffer: -0.5,
    totalJobs: 5,
    totalOperations: 20,
    uniqueParts: 6,
    quarterlyData: [
      { quarter: 1, planned: 152.0, actual: 82.0, overrun: -70.0, cost: -13830, jobs: 6 },
      { quarter: 2, planned: 122.0, actual: 105.0, overrun: -17.0, cost: -3383, jobs: 6 },
      { quarter: 3, planned: 155.0, actual: 62.0, overrun: -93.0, cost: -18507, jobs: 5 },
      { quarter: 4, planned: 98.0, actual: 46.0, overrun: -52.0, cost: -10348, jobs: 3 }
    ]
  };
  
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
          <div className="year-summary-section">
            <h2 className="year-summary-title">Year Summary - {selectedYear}</h2>
            
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Planned Hours</div>
                <div className="metric-value">{mockData.plannedHours}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Actual Hours</div>
                <div className="metric-value">{mockData.actualHours}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Overrun Hours</div>
                <div className="metric-value">{mockData.overrunHours}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Ghost Hours</div>
                <div className="metric-value">{mockData.ghostHours}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">NCR Hours</div>
                <div className="metric-value">{mockData.ncrHours}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Planned Cost</div>
                <div className="metric-value">${mockData.plannedCost.toLocaleString()}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Actual Cost</div>
                <div className="metric-value">${mockData.actualCost.toLocaleString()}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Opportunity Cost</div>
                <div className="metric-value">$-{Math.abs(mockData.opportunityCost).toLocaleString()}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Suggested Buffer</div>
                <div className="metric-value">{mockData.suggestedBuffer}%</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Total Jobs</div>
                <div className="metric-value">{mockData.totalJobs}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Total Operations</div>
                <div className="metric-value">{mockData.totalOperations}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Unique Parts</div>
                <div className="metric-value">{mockData.uniqueParts}</div>
              </div>
            </div>
          </div>
          
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
                  {mockData.quarterlyData.map((quarter, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                      <td>Q{quarter.quarter}</td>
                      <td>{quarter.planned}</td>
                      <td>{quarter.actual}</td>
                      <td 
                        className={quarter.overrun < 0 ? 'under-budget' : quarter.overrun > 0 ? 'over-budget' : ''}
                      >
                        {quarter.overrun}
                      </td>
                      <td>${quarter.cost.toString().replace('-', '-')}</td>
                      <td>{quarter.jobs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
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