import React, { useState, useEffect } from 'react';
import { loadYearData } from '../utils/dataUtils';
import '../styles/yearly-analysis.css';

const YearlyAnalysis = () => {
  const [selectedYear, setSelectedYear] = useState('2022');
  const [yearData, setYearData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchYearData = async () => {
      setLoading(true);
      try {
        console.log(`Selected year: ${selectedYear}`);
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
          <div className="year-summary-section">
            <h2 className="year-summary-title">Year Summary - {selectedYear}</h2>
            
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Planned Hours</div>
                <div className="metric-value">20.4</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Actual Hours</div>
                <div className="metric-value">23.8</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Overrun Hours</div>
                <div className="metric-value">-14.0</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Ghost Hours</div>
                <div className="metric-value">39.5</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">NCR Hours</div>
                <div className="metric-value">51.0</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Planned Cost</div>
                <div className="metric-value">$104,873</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Actual Cost</div>
                <div className="metric-value">$58,705</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Opportunity Cost</div>
                <div className="metric-value">$-46,168</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Suggested Buffer</div>
                <div className="metric-value">-0.5%</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Total Jobs</div>
                <div className="metric-value">5</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Total Operations</div>
                <div className="metric-value">20</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Unique Parts</div>
                <div className="metric-value">6</div>
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
                  <tr>
                    <td>Q1</td>
                    <td>152.0</td>
                    <td>82.0</td>
                    <td className="under-budget">-70.0</td>
                    <td>$-13,830</td>
                    <td>6</td>
                  </tr>
                  <tr>
                    <td>Q2</td>
                    <td>122.0</td>
                    <td>105.0</td>
                    <td className="under-budget">-17.0</td>
                    <td>$-3,383</td>
                    <td>6</td>
                  </tr>
                  <tr>
                    <td>Q3</td>
                    <td>155.0</td>
                    <td>62.0</td>
                    <td className="under-budget">-93.0</td>
                    <td>$-18,507</td>
                    <td>5</td>
                  </tr>
                  <tr>
                    <td>Q4</td>
                    <td>98.0</td>
                    <td>46.0</td>
                    <td className="under-budget">-52.0</td>
                    <td>$-10,348</td>
                    <td>3</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="charts-section">
            <h2 className="section-title">Quarterly Hours & Overrun Cost</h2>
            <div className="chart-container">
              {/* Chart placeholder - would be implemented with Chart.js */}
              <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#666' }}>
                Chart showing quarterly hours and overrun costs would appear here
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default YearlyAnalysis;