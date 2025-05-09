import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const WorkcenterChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    
    // Sort data by actual hours
    const sortedData = [...data].sort((a, b) => b.actual_hours - a.actual_hours);
    
    // Take top workcenters for display
    const topWorkcenters = sortedData.slice(0, 6);
    
    // Prepare data for chart
    const workcenterNames = topWorkcenters.map(item => item.work_center);
    const plannedHours = topWorkcenters.map(item => item.planned_hours);
    const actualHours = topWorkcenters.map(item => item.actual_hours);
    
    // Create the chart
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: workcenterNames,
        datasets: [
          {
            label: 'Planned Hours',
            data: plannedHours,
            backgroundColor: 'rgba(50, 107, 240, 0.6)',
            borderColor: 'rgba(50, 107, 240, 1)',
            borderWidth: 1,
            borderRadius: 4,
            order: 2
          },
          {
            label: 'Actual Hours',
            data: actualHours,
            backgroundColor: 'rgba(248, 121, 45, 0.6)',
            borderColor: 'rgba(248, 121, 45, 1)',
            borderWidth: 1,
            borderRadius: 4,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              afterTitle: function(context) {
                const workcenterIndex = context[0].dataIndex;
                const workcenter = topWorkcenters[workcenterIndex];
                const overrunHours = workcenter.overrun_hours;
                const overrunPercent = (overrunHours / workcenter.planned_hours) * 100;
                
                return `Overrun: ${overrunHours.toFixed(1)} hrs (${overrunPercent.toFixed(1)}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Hours'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      }
    });
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);
  
  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default WorkcenterChart;