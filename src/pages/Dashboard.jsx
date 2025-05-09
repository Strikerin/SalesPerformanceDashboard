import React, { useState } from 'react';
import '../styles/dashboard.css';

// Import mock data utils (will be replaced with real API calls)
import { 
  loadSummaryMetrics, 
  loadYearlySummary, 
  loadCustomerProfitability, 
  loadWorkcenterTrends 
} from '../utils/dataUtils';

// Components
import MetricCard from '../components/MetricCard';
import YearlyTrends from '../components/YearlyTrends';
import CustomerProfitChart from '../components/CustomerProfitChart';
import WorkcenterChart from '../components/WorkcenterChart';
import YearlySummaryTable from '../components/YearlySummaryTable';

const Dashboard = () => {
  // State for data
  const [summaryMetrics, setSummaryMetrics] = useState(null);
  const [yearlySummary, setYearlySummary] = useState([]);
  const [customerData, setCustomerData] = useState(null);
  const [workcenterData, setWorkcenterData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Load data on component mount
  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const metrics = await loadSummaryMetrics();
        const years = await loadYearlySummary();
        const customers = await loadCustomerProfitability();
        const workcenters = await loadWorkcenterTrends();
        
        setSummaryMetrics(metrics);
        setYearlySummary(years);
        setCustomerData(customers);
        setWorkcenterData(workcenters);
        
        // Set default selected year to the most recent
        if (years && years.length > 0) {
          const sortedYears = [...years].sort((a, b) => b.year - a.year);
          setSelectedYear(sortedYears[0].year);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
      setLoading(false);
    };
    
    fetchData();
  }, []);
  
  // Format functions
  const formatNumber = (value, digits = 1) => {
    if (value === undefined || value === null) return '0';
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(value);
  };
  
  const formatMoney = (value) => {
    if (value === undefined || value === null) return '$0';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const formatPercent = (value) => {
    if (value === undefined || value === null) return '0%';
    
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };
  
  // Handle year selection
  const handleYearClick = (year) => {
    setSelectedYear(year);
    // In a real app, this would load data specific to that year
    console.log(`Selected year: ${year}`);
  };
  
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Work History Dashboard</h1>
        <div className="dashboard-actions">
          <button className="btn btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Last 30 Days</span>
          </button>
          <button className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Upload Data</span>
          </button>
        </div>
      </div>
      
      {/* Summary Metrics */}
      <div className="dashboard-grid">
        {summaryMetrics && (
          <>
            <MetricCard 
              title="Total Planned Hours" 
              value={formatNumber(summaryMetrics.total_planned_hours)}
              change={"+3.2%"}
              iconType="clock"
              accentColor="blue"
            />
            <MetricCard 
              title="Total Actual Hours" 
              value={formatNumber(summaryMetrics.total_actual_hours)} 
              change={"+5.7%"}
              iconType="chart"
              accentColor="orange"
            />
            <MetricCard 
              title="Overrun Percentage" 
              value={formatPercent(summaryMetrics.overrun_percent)}
              change={"+2.5%"}
              iconType="alert"
              accentColor="red"
            />
            <MetricCard 
              title="Total Revenue" 
              value={formatMoney(summaryMetrics.total_planned_cost)} 
              change={"+4.1%"}
              iconType="money"
              accentColor="green"
            />
          </>
        )}
        
        {/* Yearly Trends Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Yearly Hours & Overrun Trends</h2>
            <div className="chart-actions">
              <button className="btn btn-outline btn-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                <span>Share</span>
              </button>
              <button className="btn btn-outline btn-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Export</span>
              </button>
            </div>
          </div>
          <div className="chart-container">
            {yearlySummary.length > 0 && <YearlyTrends data={yearlySummary} />}
          </div>
        </div>
        
        {/* Customer Profitability Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Customer Profitability</h2>
            <div className="chart-actions">
              <button className="btn btn-outline btn-sm">View All</button>
            </div>
          </div>
          <div className="chart-container">
            {customerData && <CustomerProfitChart data={customerData.profit_data} />}
          </div>
        </div>
        
        {/* Work Center Performance Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Work Center Performance</h2>
            <div className="chart-actions">
              <button className="btn btn-outline btn-sm">View All</button>
            </div>
          </div>
          <div className="chart-container">
            {workcenterData && <WorkcenterChart data={workcenterData.work_center_data} />}
          </div>
        </div>
        
        {/* Yearly Summary Table */}
        <div className="table-card">
          <div className="chart-header">
            <h2 className="chart-title">Yearly Summary</h2>
            <div className="chart-actions">
              <button className="btn btn-outline btn-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
                <span>Filter</span>
              </button>
            </div>
          </div>
          <div className="table-container">
            {yearlySummary.length > 0 && (
              <YearlySummaryTable 
                data={yearlySummary} 
                onYearClick={handleYearClick}
                formatNumber={formatNumber}
                formatMoney={formatMoney}
                selectedYear={selectedYear}
              />
            )}
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stats-card">
            <div className="stats-header">
              <h3 className="stats-title">Most Profitable Customer</h3>
              <div className="stats-icon profitable">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20V10"></path>
                  <path d="M18 16l-6-6-6 6"></path>
                </svg>
              </div>
            </div>
            {customerData && (
              <div className="stats-content">
                <div className="stats-value">{customerData.top_customer_list_name}</div>
                <div className="stats-subtext">
                  <span className="stats-change positive">+14.2% Profit Margin</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="stats-card">
            <div className="stats-header">
              <h3 className="stats-title">Highest Overrun Customer</h3>
              <div className="stats-icon overrun">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v16"></path>
                  <path d="M18 14l-6 6-6-6"></path>
                </svg>
              </div>
            </div>
            {customerData && (
              <div className="stats-content">
                <div className="stats-value">{customerData.overrun_customer_list_name}</div>
                <div className="stats-subtext">
                  <span className="stats-change negative">-8.7% Profit Loss</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="stats-card">
            <div className="stats-header">
              <h3 className="stats-title">Most Used Work Center</h3>
              <div className="stats-icon utilized">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
            </div>
            {workcenterData && (
              <div className="stats-content">
                <div className="stats-value">{workcenterData.most_used_wc}</div>
                <div className="stats-subtext">
                  <span className="stats-metric">{formatNumber(workcenterData.avg_util)}% Utilization</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="stats-card">
            <div className="stats-header">
              <h3 className="stats-title">Repeat Business Rate</h3>
              <div className="stats-icon repeat">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.47-4.02M22 12.5a10 10 0 0 1-18.47 4.02"></path>
                </svg>
              </div>
            </div>
            {customerData && (
              <div className="stats-content">
                <div className="stats-value">{formatPercent(customerData.repeat_rate)}</div>
                <div className="stats-subtext">
                  <span className="stats-change positive">+2.1% from last year</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;