import React, { useEffect, useState } from 'react';
import { useParams, Link } from './wouter-adapter';
import { useWorkHistory } from '../hooks/useWorkHistory';
import LoadingSpinner from './LoadingSpinner';
import ErrorAlert from './ErrorAlert';
import { 
  QuarterlySummary, 
  TopOverrunOperation, 
  NcrSummaryItem, 
  WorkcenterBreakdown, 
  RepeatNcrFailure, 
  JobAdjustment, 
  PartOverrun, 
  PartTaskDetail,
  WorkHistorySummary
} from '../types/summaryData';
import MonthlyTrendChart from './MonthlyTrendChart';
import WorkCenterUtilizationChart from './WorkCenterUtilizationChart';
import CustomerBreakdownChart from './CustomerBreakdownChart';
import TaskOverrunDistributionChart from './TaskOverrunDistributionChart';
import GhostHoursTrendChart from './GhostHoursTrendChart';

interface WorkHistoryYearProps {
  debug?: boolean;
}

const WorkHistoryYear: React.FC<WorkHistoryYearProps> = ({ debug = false }) => {
  const { year } = useParams<{ year: string }>();
  const {
    yearData,
    yearLoading,
    yearError,
    fetchYearData,
    fetchNcrPartDetails,
    ncrPartData,
    ncrPartLoading,
    formatMoney,
    formatNumber
  } = useWorkHistory();

  const [activeTab, setActiveTab] = useState('overrun');
  const [expandedNcrRow, setExpandedNcrRow] = useState<number | null>(null);
  const [expandedAdjustRow, setExpandedAdjustRow] = useState<number | null>(null);
  const [dataFetched, setDataFetched] = useState(false);

  useEffect(() => {
    if (year && !dataFetched) {
      console.log(`Fetching data for year: ${year}`);
      fetchYearData(parseInt(year));
      setDataFetched(true);
    }
  }, [year, fetchYearData, dataFetched]);

  // Add a debug log to see what data is coming back
  useEffect(() => {
    if (debug && yearData) {
      console.log('Year data loaded:', yearData);
    }
  }, [yearData, debug]);

  const handleNcrRowClick = async (index: number, partName: string) => {
    if (expandedNcrRow === index) {
      setExpandedNcrRow(null);
      return;
    }

    setExpandedNcrRow(index);
    await fetchNcrPartDetails(parseInt(year!), partName);
  };

  const handleAdjustRowClick = (index: number) => {
    setExpandedAdjustRow(expandedAdjustRow === index ? null : index);
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  if (yearLoading) return <LoadingSpinner />;
  if (yearError) return <ErrorAlert message={yearError} />;
  
  // Check if we have valid data
  if (!yearData) {
    return (
      <div className="container-fluid py-4 px-4">
        <div className="alert alert-warning">
          <h4 className="alert-heading">No data available</h4>
          <p>No work history data is available for the year {year}.</p>
          <Link to="/workhistory" className="btn btn-primary">Return to Work History Dashboard</Link>
        </div>
        {debug && (
          <div className="mt-3 p-3 border rounded bg-light">
            <h5>Debug Information</h5>
            <pre>{JSON.stringify({
              year,
              yearLoading,
              yearError,
              yearDataExists: !!yearData,
            }, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  // Destructure with default empty objects/arrays to avoid undefined errors
  const {
    summary = {} as WorkHistorySummary,
    quarterly_summary = [] as QuarterlySummary[],
    top_overruns = [] as TopOverrunOperation[],
    ncr_summary = [] as NcrSummaryItem[],
    workcenter_summary = [] as WorkcenterBreakdown[],
    repeat_ncr_failures = [] as RepeatNcrFailure[],
    job_adjustments = [] as JobAdjustment[],
    part_overruns = [] as PartOverrun[],
    part_task_details = [] as PartTaskDetail[]
  } = yearData;

  // Safely access summary properties
  const safeFormatNumber = (value?: number, digits: number = 1) => {
    return formatNumber(value || 0, digits);
  };

  const safeFormatMoney = (value?: number) => {
    return formatMoney(value || 0);
  };

  return (
    <div className="container-fluid py-4 px-3">
      {/* Top Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
        <div>
          <h1 className="text-primary display-6">📊 Work History Overview – {year}</h1>
          <p className="lead text-muted mb-0">
            Executive analysis of shop performance with focus on cost, labor efficiency, and process breakdowns.
          </p>
        </div>
        <div className="text-end">
          <Link to="/workhistory" className="btn btn-outline-primary btn-sm">
            ⬅️ Back to Full Work History
          </Link>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-2">
          <div className="card shadow-sm h-100 border-start border-primary border-5">
            <div className="card-body">
              <div className="card-label">Planned Hours</div>
              <div className="card-value">{safeFormatNumber(summary.total_planned_hours)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card shadow-sm h-100 border-start border-success border-5">
            <div className="card-body">
              <div className="card-label">Actual Hours</div>
              <div className="card-value">{safeFormatNumber(summary.total_actual_hours)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card shadow-sm h-100 border-start border-danger border-5">
            <div className="card-body">
              <div className="card-label">Overrun Hours</div>
              <div className="card-value text-danger">{safeFormatNumber(summary.total_overrun_hours)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card shadow-sm h-100 border-start border-warning border-5">
            <div className="card-body">
              <div className="card-label">Ghost Hours</div>
              <div className="card-value text-muted">{safeFormatNumber(summary.ghost_hours)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card shadow-sm h-100 border-start border-info border-5">
            <div className="card-body">
              <div className="card-label">NCR Hours</div>
              <div className="card-value text-warning">{safeFormatNumber(summary.total_ncr_hours)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card shadow-sm h-100 border-start border-secondary border-5">
            <div className="card-body">
              <div className="card-label">Total Jobs</div>
              <div className="card-value">{safeFormatNumber(summary.total_jobs, 0)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphs Row 1 */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light fw-bold">Monthly Trend (Planned vs Actual Hours)</div>
            <div className="card-body">
              <MonthlyTrendChart year={parseInt(year!)} formatNumber={formatNumber} />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light fw-bold">Ghost Hours Trend</div>
            <div className="card-body">
              <GhostHoursTrendChart year={parseInt(year!)} formatNumber={formatNumber} />
            </div>
          </div>
        </div>
      </div>

      {/* Graphs Row 2 */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light fw-bold">Work Center Utilization</div>
            <div className="card-body">
              <WorkCenterUtilizationChart formatNumber={formatNumber} />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light fw-bold">Overrun Distribution by Task Type</div>
            <div className="card-body">
              <TaskOverrunDistributionChart formatNumber={formatNumber} />
            </div>
          </div>
        </div>
      </div>

      {/* Graphs Row 3 */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light fw-bold">Customer Breakdown</div>
            <div className="card-body">
              <CustomerBreakdownChart formatNumber={formatNumber} formatMoney={formatMoney} />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          {/* You can add another chart or table here if needed */}
        </div>
      </div>

      {/* Existing tabbed insights and tables can follow here, styled as cards */}
      {/* ... existing code ... */}
    </div>
  );
};

export default WorkHistoryYear; 