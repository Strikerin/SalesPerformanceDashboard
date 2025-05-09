import React from 'react';

const YearlySummaryTable = ({ data, onYearClick, formatNumber, formatMoney, selectedYear }) => {
  return (
    <table className="yearly-summary-table">
      <thead>
        <tr>
          <th>Year</th>
          <th>Planned Hours</th>
          <th>Actual Hours</th>
          <th>Overrun Hours</th>
          <th>Jobs</th>
          <th>Operations</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr 
            key={item.year} 
            className={item.year === selectedYear ? 'selected-year' : ''}
            onClick={() => onYearClick(item.year)}
          >
            <td className="year-cell">{item.year}</td>
            <td>{formatNumber(item.planned_hours)}</td>
            <td>{formatNumber(item.actual_hours)}</td>
            <td>{formatNumber(item.overrun_hours)}</td>
            <td>{item.job_count}</td>
            <td>{item.operation_count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default YearlySummaryTable;