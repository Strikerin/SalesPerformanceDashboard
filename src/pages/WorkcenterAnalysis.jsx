import React, { useState, useEffect } from 'react';
import { loadWorkcenterTrends } from '../utils/dataUtils';
import '../styles/pages.css';

// Chart placeholder component
const WorkcenterChart = ({ data }) => (
  <div className="chart-placeholder">
    <div className="chart-message">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
      <p>Workcenter Performance Chart</p>
    </div>
  </div>
);

const WorkcenterTable = ({ data }) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th>Work Center</th>
          <th>Planned Hours</th>
          <th>Actual Hours</th>
          <th>Overrun Hours</th>
          <th>Efficiency</th>
        </tr>
      </thead>
      <tbody>
        {data && data.map((wc, index) => {
          const efficiency = wc.planned_hours > 0 
            ? (wc.planned_hours / wc.actual_hours * 100) 
            : 100;
          
          return (
            <tr key={index}>
              <td>{wc.work_center}</td>
              <td>{wc.planned_hours?.toFixed(1) || 0}</td>
              <td>{wc.actual_hours?.toFixed(1) || 0}</td>
              <td>{wc.overrun_hours?.toFixed(1) || 0}</td>
              <td className={efficiency >= 90 ? 'efficiency-good' : efficiency >= 75 ? 'efficiency-medium' : 'efficiency-low'}>
                {efficiency.toFixed(1)}%
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const WorkcenterSummaryMetrics = ({ data }) => (
  <div className="metrics-row">
    {data && (
      <>
        <div className="metric-box">
          <div className="metric-title">Most Used</div>
          <div className="metric-value">{data.most_used_wc}</div>
        </div>
        <div className="metric-box">
          <div className="metric-title">Highest Overrun</div>
          <div className="metric-value">{data.overrun_wc}</div>
        </div>
        <div className="metric-box">
          <div className="metric-title">Avg Utilization</div>
          <div className="metric-value">{data.avg_util?.toFixed(1) || 0}%</div>
        </div>
        <div className="metric-box">
          <div className="metric-title">Total Hours</div>
          <div className="metric-value">{data.total_wc_hours?.toFixed(1) || 0}</div>
        </div>
      </>
    )}
  </div>
);

const WorkcenterAnalysis = () => {
  const [workcenterData, setWorkcenterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterValue, setFilterValue] = useState('');
  const [sortBy, setSortBy] = useState('actual_hours');
  const [sortDirection, setSortDirection] = useState('desc');
  
  useEffect(() => {
    const fetchWorkcenterData = async () => {
      setLoading(true);
      try {
        const data = await loadWorkcenterTrends();
        setWorkcenterData(data);
      } catch (error) {
        console.error('Error loading workcenter data:', error);
      }
      setLoading(false);
    };
    
    fetchWorkcenterData();
  }, []);
  
  // Filter workcenters based on search value
  const filteredWorkcenters = workcenterData?.work_center_data?.filter(wc => 
    (wc.work_center?.toLowerCase() || '').includes(filterValue.toLowerCase())
  ) || [];
  
  // Sort workcenters
  const sortedWorkcenters = [...filteredWorkcenters].sort((a, b) => {
    const aValue = a[sortBy] || 0;
    const bValue = b[sortBy] || 0;
    
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });
  
  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for new field
      setSortBy(field);
      setSortDirection('desc');
    }
  };
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Workcenter Analysis</h1>
        <div className="page-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search workcenters..."
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="search-input"
            />
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
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
          <p>Loading workcenter data...</p>
        </div>
      ) : (
        <>
          <WorkcenterSummaryMetrics data={workcenterData} />
          
          <div className="chart-section">
            <h2 className="section-title">Work Center Hours Distribution</h2>
            <WorkcenterChart data={workcenterData?.work_center_data} />
          </div>
          
          <div className="sort-controls">
            <div className="sort-label">Sort by:</div>
            <div className="sort-options">
              <button 
                className={`sort-button ${sortBy === 'actual_hours' ? 'active' : ''}`}
                onClick={() => handleSort('actual_hours')}
              >
                Actual Hours {sortBy === 'actual_hours' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button 
                className={`sort-button ${sortBy === 'planned_hours' ? 'active' : ''}`}
                onClick={() => handleSort('planned_hours')}
              >
                Planned Hours {sortBy === 'planned_hours' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button 
                className={`sort-button ${sortBy === 'overrun_hours' ? 'active' : ''}`}
                onClick={() => handleSort('overrun_hours')}
              >
                Overrun Hours {sortBy === 'overrun_hours' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
          
          <div className="table-section">
            <h2 className="section-title">
              Work Center Performance
              {filterValue && <span className="filter-tag"> (Filtered)</span>}
            </h2>
            <WorkcenterTable data={sortedWorkcenters} />
          </div>
        </>
      )}
    </div>
  );
};

export default WorkcenterAnalysis;