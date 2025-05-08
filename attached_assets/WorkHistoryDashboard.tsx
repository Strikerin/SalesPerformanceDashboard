import React, { useEffect, useState } from 'react';
import { useNavigate } from './wouter-adapter';
import { useWorkHistory } from '../hooks/useWorkHistory';
import SummaryMetrics from './SummaryMetrics';
import YearlyTable from './YearlyTable';
import WorkCenterTable from './WorkCenterTable';
import CustomerProfitChart from './CustomerProfitChart';
import PartPerformanceChart from './PartPerformanceChart';
import WorkCenterTrendChart from './WorkCenterTrendChart';
import MonthlyTrendChart from './MonthlyTrendChart';
import WorkCenterUtilizationChart from './WorkCenterUtilizationChart';
import CustomerBreakdownChart from './CustomerBreakdownChart';
import TaskOverrunDistributionChart from './TaskOverrunDistributionChart';
import GhostHoursTrendChart from './GhostHoursTrendChart';
import LoadingSpinner from './LoadingSpinner';
import ErrorAlert from './ErrorAlert';

const WorkHistoryDashboard: React.FC = () => {
  const {
    loading,
    error,
    summaryData,
    yearlyData,
    customerData,
    partData,
    workcenterData,
    fetchAllData,
    formatMoney,
    formatNumber
  } = useWorkHistory();

  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleMetricClick = (metric: string) => {
    navigate(`/workhistory/metric/${metric}`);
  };

  const handleYearClick = (year: number) => {
    setSelectedYear(year);
    navigate(`/workhistory/year/${year}`);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!summaryData) return <ErrorAlert message="No data available" />;

  // Derived values from summary
  const s = summaryData.summary;
  const overrunPercent = s.total_planned_hours > 0
    ? ((s.total_overrun_hours / s.total_planned_hours) * 100).toFixed(1) + "%"
    : "N/A";

  const avgCostPerHour = s.total_actual_hours > 0
    ? formatMoney(s.total_actual_cost / s.total_actual_hours)
    : "N/A";

  const overrunCost = s.total_actual_cost - s.total_planned_cost > 0
    ? formatMoney(s.total_actual_cost - s.total_planned_cost)
    : "$0";

  const avgJobSize = s.total_jobs > 0
    ? formatNumber(s.total_planned_hours / s.total_jobs)
    : "N/A";

  return (
    <div className="container-fluid py-4 px-3">
      {/* Title */}
      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
        <h1 className="text-primary display-6">📊 Work History Overview</h1>
        <div>
          <button className="btn btn-outline-primary me-2">
            <i className="bi bi-filter"></i> Filter
          </button>
          <button className="btn btn-outline-primary">
            ⬇️ Export Report (CSV)
          </button>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card shadow-sm h-100 border-start border-primary border-5">
            <div className="card-body d-flex flex-column">
              <h6 className="text-uppercase text-muted small mb-2">Income</h6>
              <div className="d-flex align-items-center mb-2">
                <h3 className="mb-0 me-2">{formatMoney(s.total_actual_cost)}</h3>
                <span className="badge bg-success px-2 py-1">+{((s.total_actual_cost - s.total_planned_cost) / s.total_planned_cost * 100).toFixed(1)}%</span>
              </div>
              <span className="text-muted small">Compared to planned revenue</span>
              <span className="text-muted small mt-1">Last week: {formatMoney(s.total_actual_cost * 0.8)}</span>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card shadow-sm h-100 border-start border-danger border-5">
            <div className="card-body d-flex flex-column">
              <h6 className="text-uppercase text-muted small mb-2">Expenses</h6>
              <div className="d-flex align-items-center mb-2">
                <h3 className="mb-0 me-2">{formatMoney(s.total_actual_cost * 0.6)}</h3>
                <span className="badge bg-success px-2 py-1">+{((s.total_actual_cost * 0.6 - s.total_planned_cost * 0.55) / (s.total_planned_cost * 0.55) * 100).toFixed(1)}%</span>
              </div>
              <span className="text-muted small">Compared to planned expenses</span>
              <span className="text-muted small mt-1">Last week: {formatMoney(s.total_actual_cost * 0.55)}</span>
            </div>
          </div>
        </div>
        <div className="col-xl-6 col-md-12">
          <div className="card shadow-sm h-100">
            <div className="card-body p-0">
              <div className="row g-0 h-100">
                <div className="col-md-8">
                  <div className="p-3">
                    <h6 className="text-muted mb-3">How vs Cancel</h6>
                    <div className="chart-container d-flex justify-content-center align-items-center" style={{ height: '120px' }}>
                      {/* Circular progress chart - would replace with actual chart component */}
                      <div className="position-relative" style={{ width: '120px', height: '120px' }}>
                        <div className="position-absolute top-50 start-50 translate-middle text-center">
                          <h3>{s.avg_profit_margin || 0}%</h3>
                          <div className="small text-muted">Profit Margin</div>
                        </div>
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="54" fill="none" stroke="#e9ecef" strokeWidth="12" />
                          <circle cx="60" cy="60" r="54" fill="none" stroke="#0d6efd" strokeWidth="12" 
                            strokeDasharray="339.292" strokeDashoffset={339.292 * (1 - (s.avg_profit_margin || 0)/100)} 
                            transform="rotate(-90 60 60)" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 bg-light">
                  <div className="p-3">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-muted">Total Completed</span>
                        <span className="small fw-bold text-success">68%</span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div className="progress-bar bg-success" style={{ width: '68%' }}></div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-muted">Total Cancelled</span>
                        <span className="small fw-bold text-danger">22%</span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div className="progress-bar bg-danger" style={{ width: '22%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-muted">Total Pending</span>
                        <span className="small fw-bold text-warning">10%</span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div className="progress-bar bg-warning" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Car Availability Section */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Car Availability</h6>
            <div className="d-flex">
              <div className="input-group input-group-sm me-2" style={{ width: "180px" }}>
                <span className="input-group-text">Car number</span>
                <select className="form-select form-select-sm">
                  <option>All</option>
                </select>
              </div>
              <div className="input-group input-group-sm me-2" style={{ width: "180px" }}>
                <span className="input-group-text">Jan 25, 2022</span>
                <select className="form-select form-select-sm">
                  <option>10 AM</option>
                </select>
              </div>
              <button className="btn btn-primary btn-sm">Check</button>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>#</th>
                  <th>Car ID</th>
                  <th>Name</th>
                  <th style={{ width: "120px" }}>Status</th>
                  <th>Earning</th>
                  <th style={{ width: "100px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>01</td>
                  <td>6482</td>
                  <td>Alex Nelson</td>
                  <td><span className="badge bg-success rounded-pill">Completed</span></td>
                  <td>$35.44</td>
                  <td><button className="btn btn-primary btn-sm">Details</button></td>
                </tr>
                <tr>
                  <td>02</td>
                  <td>5823</td>
                  <td>David Johnson</td>
                  <td><span className="badge bg-warning rounded-pill">Pending</span></td>
                  <td>$0.00</td>
                  <td><button className="btn btn-primary btn-sm">Details</button></td>
                </tr>
                <tr>
                  <td>03</td>
                  <td>9201</td>
                  <td>Luke North</td>
                  <td><span className="badge bg-info rounded-pill">Booked</span></td>
                  <td>$23.50</td>
                  <td><button className="btn btn-primary btn-sm">Details</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Earnings Summary Section */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Earning Summary</h6>
            <div className="d-flex align-items-center">
              <div className="input-group input-group-sm" style={{ width: "200px" }}>
                <span className="input-group-text">Jun 2022 - Oct 2022</span>
                <div className="input-group-text">
                  <i className="bi bi-calendar"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="d-flex mb-3">
            <button className="btn btn-sm btn-outline-primary me-2">Last 6 months</button>
            <button className="btn btn-sm btn-outline-primary">Compare previous year</button>
          </div>
          
          <div className="chart-container" style={{ height: '300px' }}>
            {/* This would be replaced with an actual chart component */}
            <img src="https://via.placeholder.com/800x300?text=Earnings+Line+Chart" alt="Earnings Chart" className="img-fluid" />
          </div>
        </div>
      </div>

      {/* New Charts Section */}
      <h2 className="text-primary mb-4">Performance Trends</h2>

      <div className="row g-4 mb-4">
        {/* Monthly Trend Chart */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header d-flex justify-content-between align-items-center bg-light">
              <h6 className="mb-0">Monthly Trend (Planned vs Actual Hours)</h6>
              <select className="form-select form-select-sm" style={{ width: "auto" }} 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                {yearlyData?.map(y => (
                  <option key={y.year} value={y.year}>{y.year}</option>
                ))}
              </select>
            </div>
            <div className="card-body">
              <MonthlyTrendChart year={selectedYear} formatNumber={formatNumber} />
            </div>
          </div>
        </div>

        {/* Ghost Hours Trend Chart */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header d-flex justify-content-between align-items-center bg-light">
              <h6 className="mb-0">Ghost Hours Trend</h6>
              <select className="form-select form-select-sm" style={{ width: "auto" }} 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                {yearlyData?.map(y => (
                  <option key={y.year} value={y.year}>{y.year}</option>
                ))}
              </select>
            </div>
            <div className="card-body">
              <GhostHoursTrendChart year={selectedYear} formatNumber={formatNumber} />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Work Center Utilization Chart */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light">
              <h6 className="mb-0">Work Center Utilization</h6>
            </div>
            <div className="card-body">
              <WorkCenterUtilizationChart formatNumber={formatNumber} />
            </div>
          </div>
        </div>

        {/* Task Overrun Distribution Chart */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light">
              <h6 className="mb-0">Overrun Distribution by Task Type</h6>
            </div>
            <div className="card-body">
              <TaskOverrunDistributionChart formatNumber={formatNumber} />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Customer Breakdown Chart */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header d-flex justify-content-between align-items-center bg-light">
              <h6 className="mb-0">Customer Breakdown</h6>
              <select className="form-select form-select-sm" style={{ width: "auto" }}>
                <option value="hours">By Hours</option>
                <option value="cost">By Cost</option>
              </select>
            </div>
            <div className="card-body">
              <CustomerBreakdownChart formatNumber={formatNumber} formatMoney={formatMoney} />
            </div>
          </div>
        </div>

        {/* Yearly Data Table */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light">
              <h6 className="mb-0">Yearly Performance Overview</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <YearlyTable 
                  yearly={summaryData.yearly_breakdown} 
                  onYearClick={handleYearClick}
                  formatNumber={formatNumber}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Original Summary Metrics Section (keep for backward compatibility) */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <h6 className="mb-0">Summary Metrics</h6>
        </div>
        <div className="card-body">
          <div className="row row-cols-3 g-2">
            <SummaryMetrics 
              metrics={[
                { 
                  label: "Planned Hours", 
                  value: formatNumber(s.total_planned_hours),
                  metric: "planned_hours" 
                },
                { 
                  label: "Planned Cost", 
                  value: formatMoney(s.total_planned_cost),
                  metric: "planned_cost",
                  colorClass: "text-secondary" 
                },
                { 
                  label: "Actual Hours", 
                  value: formatNumber(s.total_actual_hours),
                  metric: "actual_hours" 
                },
                { 
                  label: "Actual Cost", 
                  value: formatMoney(s.total_actual_cost),
                  metric: "actual_cost",
                  colorClass: "text-danger" 
                },
                { 
                  label: "Total Operations", 
                  value: Number(s.total_operations).toLocaleString(),
                  metric: "total_operations" 
                },
                { 
                  label: "Total Jobs", 
                  value: Number(s.total_jobs).toLocaleString(),
                  metric: "total_jobs" 
                },
                { 
                  label: "Total Customers", 
                  value: Number(s.total_customers).toLocaleString(),
                  metric: "total_customers" 
                },
                { 
                  label: "NCR Hours", 
                  value: formatNumber(s.total_ncr_hours),
                  metric: "ncr_hours",
                  colorClass: "text-warning" 
                },
                { 
                  label: "All-Time Overrun Hours", 
                  value: formatNumber(s.total_overrun_hours),
                  metric: "overrun_hours",
                  colorClass: "text-danger",
                  fullWidth: true 
                }
              ]}
              onMetricClick={handleMetricClick}
            />
          </div>
        </div>
      </div>

      {/* Calculation Notes */}
      <div className="mt-5">
        <div className="alert alert-secondary small">
          <strong>📘 Calculation Notes:</strong>
          <ul className="mb-0">
            <li><strong>Planned/Actual Cost:</strong> <code>Hours × $199/hour</code></li>
            <li><strong>Overrun Hours:</strong> When <code>Actual {'>'} Planned</code></li>
            <li><strong>Ghost Hours:</strong> Planned hours with <code>zero actual hours</code> logged</li>
            <li><strong>NCR Hours:</strong> Total hours for <code>NCR</code> work center ops</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WorkHistoryDashboard; 