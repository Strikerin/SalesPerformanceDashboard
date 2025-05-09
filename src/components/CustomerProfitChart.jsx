import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const CustomerProfitChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    
    // Sort data by profitability (descending)
    const sortedData = [...data].sort((a, b) => b.profitability - a.profitability);
    
    // Take top customers for display
    const topCustomers = sortedData.slice(0, 6);
    
    // Prepare data for chart
    const customerNames = topCustomers.map(item => item.list_name);
    const profitabilities = topCustomers.map(item => item.profitability);
    
    // Determine colors based on profitability
    const backgroundColors = profitabilities.map(value => 
      value >= 0 ? 
        `rgba(46, 204, 113, ${0.5 + (value / 40)})` : 
        `rgba(231, 76, 60, ${0.5 + (Math.abs(value) / 40)})`
    );
    
    const borderColors = profitabilities.map(value => 
      value >= 0 ? 'rgba(46, 204, 113, 1)' : 'rgba(231, 76, 60, 1)'
    );
    
    // Create the chart
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: customerNames,
        datasets: [
          {
            label: 'Profitability %',
            data: profitabilities,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1,
            borderRadius: 4,
            maxBarThickness: 40
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += context.parsed.y.toFixed(1) + '%';
                return label;
              },
              afterLabel: function(context) {
                const customerIndex = context.dataIndex;
                const customer = topCustomers[customerIndex];
                return [
                  `Planned Hours: ${customer.planned_hours.toFixed(1)}`,
                  `Actual Hours: ${customer.actual_hours.toFixed(1)}`,
                  `Overrun Hours: ${customer.overrun_hours.toFixed(1)}`
                ];
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
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
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

export default CustomerProfitChart;