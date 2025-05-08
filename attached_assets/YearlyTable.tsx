import React from 'react';
import { YearBreakdown } from '../types/summaryData';

interface YearlyTableProps {
  yearly: YearBreakdown[];
  onYearClick: (year: number) => void;
  formatNumber: (value: number, digits?: number) => string;
}

const YearlyTable: React.FC<YearlyTableProps> = ({ yearly, onYearClick, formatNumber }) => {
  if (!yearly || yearly.length === 0) {
    return <div className="text-center p-4">No yearly data available</div>;
  }

  return (
    <table className="table table-sm table-striped table-bordered">
      <thead>
        <tr>
          <th>Year</th>
          <th>Planned</th>
          <th>Actual</th>
          <th>Overrun</th>
          <th>NCR</th>
          <th>Jobs</th>
          <th>Ops</th>
          <th>Customers</th>
        </tr>
      </thead>
      <tbody>
        {yearly.map((row) => (
          <tr 
            key={row.year} 
            className="clickable-row" 
            onClick={() => onYearClick(parseInt(row.year))}
            style={{ cursor: 'pointer' }}
          >
            <td>{row.year}</td>
            <td>{formatNumber(row.planned_hours)}</td>
            <td>{formatNumber(row.actual_hours)}</td>
            <td className="text-danger">{formatNumber(row.overrun_hours)}</td>
            <td className="text-warning">{formatNumber(row.ncr_hours)}</td>
            <td>{Number(row.job_count).toLocaleString()}</td>
            <td>{Number(row.operation_count).toLocaleString()}</td>
            <td>{Number(row.customer_count).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default YearlyTable; 