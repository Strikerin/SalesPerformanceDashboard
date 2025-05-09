import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const YearlyTrends = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    
    // Sort data by year
    const sortedData = [...data].sort((a, b) => a.year - b.year);
    
    // Prepare data for chart
    const years = sortedData.map(item => item.year);
    const plannedHours = sortedData.map(item => item.planned_hours);
    const actualHours = sortedData.map(item => item.actual_hours);
    const overrunPercent = sortedData.map(item => 
      (item.overrun_hours / item.planned_hours) * 100
    );
    
    // Create the chart
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: years,
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
          },
          {
            label: 'Overrun %',
            data: overrunPercent,
            borderColor: 'rgba(231, 76, 60, 1)',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            borderWidth: 2,
            type: 'line',
            yAxisID: 'y1',
            tension: 0.4,
            order: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
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
            usePointStyle: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.dataset.yAxisID === 'y1') {
                  label += context.parsed.y.toFixed(1) + '%';
                } else {
                  label += context.parsed.y.toFixed(1);
                }
                return label;
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
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            title: {
              display: true,
              text: 'Overrun %'
            },
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              callback: function(value) {
                return value + '%';
              }
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

export default YearlyTrends;