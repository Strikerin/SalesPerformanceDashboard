import React, { useState, useEffect } from 'react';
import { loadYearData } from '../utils/dataUtils';
import '../styles/pages.css';

// Placeholder components - would be implemented fully in a complete application
const YearSummaryMetrics = ({ data }) => (
  <div className="metrics-row">
    {data && (
      <>
        <div className="metric-box">
          <div className="metric-title">Planned Hours</div>
          <div className="metric-value">{data.total_planned_hours?.toFixed(1) || 0}</div>
        </div>
        <div className="metric-box">
          <div className="metric-title">Actual Hours</div>
          <div className="metric-value">{data.total_actual_hours?.toFixed(1) || 0}</div>
        </div>
        <div className="metric-box">
          <div className="metric-title">Overrun Hours</div>
          <div className="metric-value">{data.total_overrun_hours?.toFixed(1) || 0}</div>
        </div>
        <div className="metric-box">
          <div className="metric-title">Total Jobs</div>
          <div className="metric-value">{data.total_jobs || 0}</div>
        </div>
      </>
    )}
  </div>
);

const QuarterlyBreakdown = ({ data }) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th>Quarter</th>
          <th>Planned Hours</th>
          <th>Actual Hours</th>
          <th>Overrun Hours</th>
          <th>Jobs</th>
        </tr>
      </thead>
      <tbody>
        {data && data.map((quarter, index) => (
          <tr key={index}>
            <td>{quarter.quarter}</td>
            <td>{quarter.planned_hours?.toFixed(1) || 0}</td>
            <td>{quarter.actual_hours?.toFixed(1) || 0}</td>
            <td>{quarter.overrun_hours?.toFixed(1) || 0}</td>
            <td>{quarter.total_jobs || 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TopOverrunJobs = ({ data }) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th>Job Number</th>
          <th>Part Name</th>
          <th>Work Center</th>
          <th>Planned Hours</th>
          <th>Actual Hours</th>
          <th>Overrun Hours</th>
        </tr>
      </thead>
      <tbody>
        {data && data.map((job, index) => (
          <tr key={index}>
            <td>{job.job_number}</td>
            <td>{job.part_name}</td>
            <td>{job.work_center}</td>
            <td>{job.planned_hours?.toFixed(1) || 0}</td>
            <td>{job.actual_hours?.toFixed(1) || 0}</td>
            <td>{job.overrun_hours?.toFixed(1) || 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const WorkcenterSummary = ({ data }) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th>Work Center</th>
          <th>Job Count</th>
          <th>Planned Hours</th>
          <th>Actual Hours</th>
          <th>Overrun Hours</th>
        </tr>
      </thead>
      <tbody>
        {data && data.map((wc, index) => (
          <tr key={index}>
            <td>{wc.work_center}</td>
            <td>{wc.job_count || 0}</td>
            <td>{wc.planned_hours?.toFixed(1) || 0}</td>
            <td>{wc.actual_hours?.toFixed(1) || 0}</td>
            <td>{wc.overrun_hours?.toFixed(1) || 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const YearlyAnalysis = () => {
  const [selectedYear, setSelectedYear] = useState('2023');
  const [yearData, setYearData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchYearData = async () => {
      setLoading(true);
      try {
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
        <h1 className="page-title">Yearly Analysis</h1>
        <div className="page-actions">
          <div className="year-selector">
            <label>Year:</label>
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
          <p>Loading {selectedYear} data...</p>
        </div>
      ) : (
        <>
          <YearSummaryMetrics data={yearData?.summary} />
          
          <div className="tabs">
            <div className="tab-header">
              <button 
                className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                Quarterly Summary
              </button>
              <button 
                className={`tab-button ${activeTab === 'overruns' ? 'active' : ''}`}
                onClick={() => setActiveTab('overruns')}
              >
                Top Overruns
              </button>
              <button 
                className={`tab-button ${activeTab === 'workcenters' ? 'active' : ''}`}
                onClick={() => setActiveTab('workcenters')}
              >
                Work Centers
              </button>
            </div>
            
            <div className="tab-content">
              {activeTab === 'summary' && (
                <div className="tab-pane">
                  <h2 className="section-title">Quarterly Breakdown</h2>
                  <QuarterlyBreakdown data={yearData?.quarterly_summary} />
                </div>
              )}
              
              {activeTab === 'overruns' && (
                <div className="tab-pane">
                  <h2 className="section-title">Top Overrun Jobs</h2>
                  <TopOverrunJobs data={yearData?.top_overruns?.slice(0, 10)} />
                </div>
              )}
              
              {activeTab === 'workcenters' && (
                <div className="tab-pane">
                  <h2 className="section-title">Work Center Performance</h2>
                  <WorkcenterSummary data={yearData?.workcenter_summary} />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default YearlyAnalysis;