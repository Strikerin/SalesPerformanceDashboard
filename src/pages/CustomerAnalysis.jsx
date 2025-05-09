import React, { useState, useEffect } from 'react';
import { loadCustomerProfitability } from '../utils/dataUtils';
import '../styles/pages.css';

// Simple chart placeholder
const CustomerProfitabilityChart = ({ data }) => (
  <div className="chart-placeholder">
    <div className="chart-message">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="8 12 12 16 16 12"></polyline>
        <line x1="12" y1="8" x2="12" y2="16"></line>
      </svg>
      <p>Customer Profitability Chart</p>
    </div>
  </div>
);

const CustomerProfitabilityTable = ({ data }) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th>Customer</th>
          <th>Planned Hours</th>
          <th>Actual Hours</th>
          <th>Overrun Hours</th>
          <th>Profitability</th>
        </tr>
      </thead>
      <tbody>
        {data && data.map((customer, index) => (
          <tr key={index}>
            <td>{customer.list_name || customer.name}</td>
            <td>{customer.planned_hours?.toFixed(1) || 0}</td>
            <td>{customer.actual_hours?.toFixed(1) || 0}</td>
            <td>{customer.overrun_hours?.toFixed(1) || 0}</td>
            <td className={customer.profitability > 0 ? 'profit-positive' : 'profit-negative'}>
              {customer.profitability > 0 ? '+' : ''}{customer.profitability?.toFixed(1) || 0}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CustomerSummaryMetrics = ({ data }) => (
  <div className="metrics-row">
    {data && (
      <>
        <div className="metric-box">
          <div className="metric-title">Most Profitable</div>
          <div className="metric-value">{data.top_customer_list_name}</div>
        </div>
        <div className="metric-box">
          <div className="metric-title">Highest Overrun</div>
          <div className="metric-value">{data.overrun_customer_list_name}</div>
        </div>
        <div className="metric-box">
          <div className="metric-title">Repeat Rate</div>
          <div className="metric-value">{data.repeat_rate?.toFixed(1) || 0}%</div>
        </div>
        <div className="metric-box">
          <div className="metric-title">Avg Margin</div>
          <div className="metric-value">{data.avg_margin?.toFixed(1) || 0}%</div>
        </div>
      </>
    )}
  </div>
);

const CustomerAnalysis = () => {
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterValue, setFilterValue] = useState('');
  
  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        const data = await loadCustomerProfitability();
        setCustomerData(data);
      } catch (error) {
        console.error('Error loading customer data:', error);
      }
      setLoading(false);
    };
    
    fetchCustomerData();
  }, []);
  
  // Filter customers based on search value
  const filteredCustomers = customerData?.profit_data?.filter(customer => 
    (customer.name?.toLowerCase() || '').includes(filterValue.toLowerCase()) ||
    (customer.list_name?.toLowerCase() || '').includes(filterValue.toLowerCase())
  ) || [];
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Customer Analysis</h1>
        <div className="page-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search customers..."
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
          <p>Loading customer data...</p>
        </div>
      ) : (
        <>
          <CustomerSummaryMetrics data={customerData} />
          
          <div className="chart-section">
            <h2 className="section-title">Customer Profitability Overview</h2>
            <CustomerProfitabilityChart data={customerData?.profit_data} />
          </div>
          
          <div className="table-section">
            <h2 className="section-title">
              Customer Profitability Breakdown
              {filterValue && <span className="filter-tag"> (Filtered)</span>}
            </h2>
            <CustomerProfitabilityTable data={filteredCustomers} />
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerAnalysis;