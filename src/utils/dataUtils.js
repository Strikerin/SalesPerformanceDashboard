// This file contains the functions to fetch and process data
// Initially, it will mimic the Python functions in utils/data_utils.py

// Mock data API - in a real application, you would fetch this from your backend
const mockDataDelay = 300; // simulate network delay

// Helper function to simulate API calls
const fetchWithDelay = (data) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), mockDataDelay);
  });
};

// Load yearly summary data
export const loadYearlySummary = async () => {
  // This would be replaced with an actual API call
  // For now, we'll return sample data based on the original Python function
  const yearlyData = [
    {
      year: "2021",
      planned_hours: 4523.5,
      actual_hours: 4876.2,
      overrun_hours: 352.7,
      ncr_hours: 125.3,
      job_count: 124,
      operation_count: 723,
      customer_count: 18
    },
    {
      year: "2022",
      planned_hours: 5218.8,
      actual_hours: 5720.4,
      overrun_hours: 501.6,
      ncr_hours: 178.6,
      job_count: 156,
      operation_count: 892,
      customer_count: 22
    },
    {
      year: "2023",
      planned_hours: 6245.3,
      actual_hours: 6780.1,
      overrun_hours: 534.8,
      ncr_hours: 204.5,
      job_count: 192,
      operation_count: 1056,
      customer_count: 26
    }
  ];
  
  return fetchWithDelay(yearlyData);
};

// Load summary metrics
export const loadSummaryMetrics = async () => {
  // Calculate totals based on yearly data
  const yearlyData = await loadYearlySummary();
  
  const total_planned_hours = yearlyData.reduce((sum, item) => sum + item.planned_hours, 0);
  const total_actual_hours = yearlyData.reduce((sum, item) => sum + item.actual_hours, 0);
  const total_overrun_hours = yearlyData.reduce((sum, item) => sum + item.overrun_hours, 0);
  const total_ncr_hours = yearlyData.reduce((sum, item) => sum + item.ncr_hours, 0);
  const total_jobs = yearlyData.reduce((sum, item) => sum + item.job_count, 0);
  const total_operations = yearlyData.reduce((sum, item) => sum + item.operation_count, 0);
  
  // Take max as customers may overlap years
  const total_customers = Math.max(...yearlyData.map(item => item.customer_count));
  
  // Calculate costs (assuming $199/hour as mentioned in notes)
  const hourly_rate = 199;
  const total_planned_cost = total_planned_hours * hourly_rate;
  const total_actual_cost = total_actual_hours * hourly_rate;
  
  // Calculate overrun percent
  const overrun_percent = total_planned_hours > 0 
    ? (total_overrun_hours / total_planned_hours * 100) 
    : 0;
  
  const summaryMetrics = {
    total_planned_hours,
    total_actual_hours,
    total_overrun_hours,
    total_ncr_hours,
    total_planned_cost,
    total_actual_cost,
    overrun_percent,
    total_jobs,
    total_operations,
    total_customers
  };
  
  return fetchWithDelay(summaryMetrics);
};

// Load customer profitability data
export const loadCustomerProfitability = async () => {
  // Sample data based on the original Python function
  const customers = [
    { name: "GlobalTech", list_name: "GlobalTech" },
    { name: "MetalWorks", list_name: "MetalWorks" },
    { name: "Precision Parts", list_name: "Prec. Parts" },
    { name: "Acme Inc", list_name: "Acme Inc" },
    { name: "Industrial Systems", list_name: "Ind. Systems" },
    { name: "Tech Manufacturing", list_name: "Tech Mfg." },
    { name: "Aerospace Dynamics", list_name: "Aero Dyn." },
    { name: "Defense Components", list_name: "Def. Comp." }
  ];
  
  // Generate profit data
  const profit_data = customers.map(customer => {
    const planned_hours = 200 + Math.random() * 1000;
    const efficiency = 0.9 + Math.random() * 0.4; // Some under, some over
    const actual_hours = planned_hours / efficiency;
    const overrun_hours = Math.max(0, actual_hours - planned_hours);
    const profitability = (efficiency - 0.9) * 100; // Some negative, most positive
    
    return {
      customer: customer.name,
      list_name: customer.list_name,
      planned_hours,
      actual_hours,
      overrun_hours,
      profitability
    };
  });
  
  // Sort by profitability
  profit_data.sort((a, b) => b.profitability - a.profitability);
  
  // Get the most profitable customer
  const top_customer_data = profit_data[0];
  
  // Get the customer with highest overrun
  const overrun_sorted = [...profit_data].sort((a, b) => b.overrun_hours - a.overrun_hours);
  const overrun_customer_data = overrun_sorted[0];
  
  const customerData = {
    top_customer: top_customer_data.customer,
    top_customer_list_name: top_customer_data.list_name,
    overrun_customer: overrun_customer_data.customer,
    overrun_customer_list_name: overrun_customer_data.list_name,
    repeat_rate: 76.5, // Percentage of repeat business
    avg_margin: 12.8,  // Average profit margin percentage
    profit_data
  };
  
  return fetchWithDelay(customerData);
};

// Load work center trends
export const loadWorkcenterTrends = async () => {
  // Sample work centers
  const work_centers = [
    "Assembly", "Machining", "Welding", "Inspection", "Painting",
    "Testing", "Packaging", "CNC", "Quality Control", "Finishing"
  ];
  
  // Generate work center data
  const work_center_data = work_centers.map(wc => {
    const planned_hours = 300 + Math.random() * 1500;
    const efficiency = 0.9 + Math.random() * 0.35; // Some under, some over
    const actual_hours = planned_hours / efficiency;
    const overrun_hours = Math.max(0, actual_hours - planned_hours);
    
    return {
      work_center: wc,
      planned_hours,
      actual_hours,
      overrun_hours
    };
  });
  
  // Sort by actual hours
  work_center_data.sort((a, b) => b.actual_hours - a.actual_hours);
  
  // Find most used and highest overrun work centers
  const most_used_wc = work_center_data[0].work_center;
  const overrun_wc = [...work_center_data]
    .sort((a, b) => b.overrun_hours - a.overrun_hours)[0].work_center;
  
  // Calculate total hours and average utilization
  const total_hours = work_center_data.reduce((sum, wc) => sum + wc.actual_hours, 0);
  const avg_util = 78.5; // Sample utilization percentage
  
  const workcenterData = {
    most_used_wc,
    overrun_wc,
    avg_util,
    total_wc_hours: total_hours,
    work_center_data
  };
  
  return fetchWithDelay(workcenterData);
};

// Load year data
export const loadYearData = async (year) => {
  console.log(`Loading data for year ${year}`);
  
  // All yearly data
  const yearlyData = await loadYearlySummary();
  
  // Find the specific year's data
  const yearData = yearlyData.find(item => item.year === String(year));
  
  if (!yearData) {
    console.log(`No data found for year ${year}`);
    return {
      summary: {
        total_planned_hours: 0,
        total_actual_hours: 0,
        total_overrun_hours: 0,
        ghost_hours: 0,
        total_ncr_hours: 0,
        total_planned_cost: 0,
        total_actual_cost: 0,
        opportunity_cost_dollars: 0,
        recommended_buffer_percent: 0,
        total_jobs: 0,
        total_operations: 0,
        total_unique_parts: 0
      },
      quarterly_summary: [],
      top_overruns: [],
      ncr_summary: [],
      workcenter_summary: [],
      repeat_ncr_failures: [],
      job_adjustments: []
    };
  }
  
  // Extract values from year data
  const {
    planned_hours,
    actual_hours,
    overrun_hours,
    ncr_hours,
    job_count,
    operation_count
  } = yearData;
  
  // Calculate costs
  const hourly_rate = 199;
  const planned_cost = planned_hours * hourly_rate;
  const actual_cost = actual_hours * hourly_rate;
  const opportunity_cost = overrun_hours * hourly_rate;
  
  // Calculate recommended buffer based on overrun percentage
  const overrun_percent = planned_hours > 0 ? (overrun_hours / planned_hours * 100) : 0;
  const recommended_buffer = Math.min(overrun_percent * 1.2, 30); // Cap at 30%
  
  // Generate ghost hours (planned hours with no recorded work)
  const ghost_hours = planned_hours * (0.02 + Math.random() * 0.06);
  
  // Calculate total unique parts (roughly 20-40% of operations)
  const unique_parts = Math.floor(operation_count * (0.2 + Math.random() * 0.2));
  
  // Create quarterly summary
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const quarterly_data = [];
  
  let remaining_planned = planned_hours;
  let remaining_actual = actual_hours;
  let remaining_overrun = overrun_hours;
  let remaining_jobs = job_count;
  
  quarters.forEach((quarter, i) => {
    // For the first 3 quarters, allocate a portion of the yearly total
    let quarter_planned, quarter_actual, quarter_overrun, quarter_jobs;
    
    if (i < 3) {
      const quarter_ratio = 0.15 + Math.random() * 0.2;
      quarter_planned = planned_hours * quarter_ratio;
      quarter_actual = actual_hours * quarter_ratio;
      quarter_overrun = overrun_hours * quarter_ratio;
      quarter_jobs = Math.floor(job_count * quarter_ratio);
      
      remaining_planned -= quarter_planned;
      remaining_actual -= quarter_actual;
      remaining_overrun -= quarter_overrun;
      remaining_jobs -= quarter_jobs;
    } else {
      // Last quarter gets the remainder
      quarter_planned = remaining_planned;
      quarter_actual = remaining_actual;
      quarter_overrun = remaining_overrun;
      quarter_jobs = remaining_jobs;
    }
    
    quarterly_data.push({
      quarter,
      planned_hours: quarter_planned,
      actual_hours: quarter_actual,
      overrun_hours: quarter_overrun,
      overrun_cost: quarter_overrun * hourly_rate,
      total_jobs: quarter_jobs
    });
  });
  
  // Generate top overruns
  const top_overruns = Array.from({ length: 15 }, (_, i) => {
    const year_suffix = String(year).slice(-2).padStart(2, '0');
    const job_number = `J${year_suffix}-${1000 + Math.floor(Math.random() * 9000)}`;
    const part_name = `Part-${['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)]}${100 + Math.floor(Math.random() * 900)}`;
    const work_center = ["Assembly", "Machining", "Welding", "Inspection", "CNC", "Testing"][Math.floor(Math.random() * 6)];
    const task_descriptions = [
      "Final Assembly", "Surface Finishing", "Quality Inspection",
      "Component Machining", "Subassembly", "Heat Treatment",
      "Precision Grinding", "Dimensional Inspection"
    ];
    const task_description = task_descriptions[Math.floor(Math.random() * task_descriptions.length)];
    
    const planned_hours = 5 + Math.random() * 55;
    const actual_hours = planned_hours * (1.2 + Math.random() * 1.3); // Significant overruns
    const overrun_hours = actual_hours - planned_hours;
    
    return {
      job_number,
      part_name,
      work_center,
      task_description,
      planned_hours,
      actual_hours,
      overrun_hours,
      overrun_cost: overrun_hours * hourly_rate
    };
  });
  
  // Sort overruns by cost
  top_overruns.sort((a, b) => b.overrun_cost - a.overrun_cost);
  
  // Generate work center summary
  const work_centers = ["Assembly", "Machining", "Welding", "Inspection", "Painting", "Testing", "CNC", "Quality Control"];
  const workcenter_summary = [];
  
  let wc_remaining_planned = planned_hours;
  let wc_remaining_actual = actual_hours;
  
  work_centers.forEach((wc, i) => {
    let wc_planned, wc_actual;
    
    if (i < work_centers.length - 1) {
      const wc_ratio = 0.05 + Math.random() * 0.2;
      wc_planned = planned_hours * wc_ratio;
      wc_actual = actual_hours * wc_ratio;
      
      wc_remaining_planned -= wc_planned;
      wc_remaining_actual -= wc_actual;
    } else {
      wc_planned = wc_remaining_planned;
      wc_actual = wc_remaining_actual;
    }
    
    const wc_overrun = Math.max(0, wc_actual - wc_planned);
    
    workcenter_summary.push({
      work_center: wc,
      planned_hours: wc_planned,
      actual_hours: wc_actual,
      overrun_hours: wc_overrun,
      overrun_cost: wc_overrun * hourly_rate
    });
  });
  
  // Sort work centers by overrun cost
  workcenter_summary.sort((a, b) => b.overrun_cost - a.overrun_cost);
  
  // Generate job adjustments
  const job_adjustments = Array.from({ length: 12 }, () => {
    const year_suffix = String(year).slice(-2).padStart(2, '0');
    const job_number = `J${year_suffix}-${1000 + Math.floor(Math.random() * 9000)}`;
    
    const planned_hours = 20 + Math.random() * 100;
    const actual_hours = planned_hours * (1.1 + Math.random() * 0.4);
    const adjustment_percent = ((actual_hours / planned_hours) - 1) * 100;
    const suggested_hours = planned_hours * (1 + adjustment_percent / 100);
    
    return {
      job_number,
      planned_hours,
      actual_hours,
      suggested_hours,
      adjustment_percent
    };
  });
  
  // Sort job adjustments by adjustment percentage
  job_adjustments.sort((a, b) => b.adjustment_percent - a.adjustment_percent);
  
  const yearDataResult = {
    summary: {
      total_planned_hours: planned_hours,
      total_actual_hours: actual_hours,
      total_overrun_hours: overrun_hours,
      ghost_hours,
      total_ncr_hours: ncr_hours,
      total_planned_cost: planned_cost,
      total_actual_cost: actual_cost,
      opportunity_cost_dollars: opportunity_cost,
      recommended_buffer_percent: recommended_buffer,
      total_jobs: job_count,
      total_operations: operation_count,
      total_unique_parts: unique_parts
    },
    quarterly_summary: quarterly_data,
    top_overruns,
    workcenter_summary,
    job_adjustments,
    avg_adjustment_percent: job_adjustments.reduce((sum, job) => sum + job.adjustment_percent, 0) / job_adjustments.length
  };
  
  return fetchWithDelay(yearDataResult);
};

// Load metric data
export const loadMetricData = async (metric) => {
  console.log(`Loading data for metric: ${metric}`);
  
  // Yearly breakdown data
  const yearlyData = await loadYearlySummary();
  
  if (!yearlyData || yearlyData.length === 0) {
    console.log("No yearly data available");
    return null;
  }
  
  // Function to extract yearly values based on metric
  const extractYearlyValues = (metricName) => {
    switch (metricName) {
      case "planned_hours":
        return yearlyData.map(item => parseFloat(item.planned_hours));
      case "actual_hours":
        return yearlyData.map(item => parseFloat(item.actual_hours));
      case "overrun_hours":
        return yearlyData.map(item => parseFloat(item.overrun_hours));
      case "ncr_hours":
        return yearlyData.map(item => parseFloat(item.ncr_hours));
      case "job_count":
      case "total_jobs":
        return yearlyData.map(item => parseFloat(item.job_count));
      case "operation_count":
      case "total_operations":
        return yearlyData.map(item => parseFloat(item.operation_count));
      case "customer_count":
      case "total_customers":
        return yearlyData.map(item => parseFloat(item.customer_count));
      case "planned_cost":
        return yearlyData.map(item => parseFloat(item.planned_hours) * 199);
      case "actual_cost":
        return yearlyData.map(item => parseFloat(item.actual_hours) * 199);
      case "overrun_cost":
        return yearlyData.map(item => parseFloat(item.overrun_hours) * 199);
      case "overrun_percent":
        return yearlyData.map(item => {
          const planned = parseFloat(item.planned_hours);
          return planned > 0 ? (parseFloat(item.overrun_hours) / planned * 100) : 0;
        });
      case "avg_cost_per_hour":
        return yearlyData.map(() => 199); // Default hourly rate
      default:
        return yearlyData.map(() => 0); // Default fallback
    }
  };
  
  // Extract values and create yearly trend
  const yearlyValues = extractYearlyValues(metric);
  const yearlyTrend = yearlyData.map((item, index) => ({
    year: item.year,
    value: yearlyValues[index]
  }));
  
  // Calculate total value
  const totalValue = yearlyValues.reduce((sum, value) => sum + value, 0);
  
  // Get customer data
  const { profit_data } = await loadCustomerProfitability();
  
  // Generate customer metric data
  const customerData = profit_data.map(customer => {
    const ratio = Math.random() * 0.5 + 0.5; // Random ratio between 0.5 and 1
    return {
      name: customer.customer,
      list_name: customer.list_name,
      value: totalValue * ratio / profit_data.length,
      percent_of_total: ratio * 100 / profit_data.length
    };
  });
  
  // Sort by value
  customerData.sort((a, b) => b.value - a.value);
  
  // Get work center data
  const { work_center_data } = await loadWorkcenterTrends();
  
  // Generate work center metric data
  const workcenterData = work_center_data.map(wc => {
    const ratio = Math.random() * 0.5 + 0.5; // Random ratio between 0.5 and 1
    return {
      workcenter: wc.work_center,
      value: totalValue * ratio / work_center_data.length,
      percent_of_total: ratio * 100 / work_center_data.length
    };
  });
  
  // Sort by value
  workcenterData.sort((a, b) => b.value - a.value);
  
  // Generate monthly data
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyData = months.map(month => ({
    month,
    value: totalValue / 12 * (0.7 + Math.random() * 0.6) // Random variation
  }));
  
  // Generate correlations with other metrics
  const allMetrics = [
    "planned_hours", "actual_hours", "overrun_hours", "overrun_percent",
    "ncr_hours", "planned_cost", "actual_cost", "overrun_cost",
    "avg_cost_per_hour", "total_jobs", "total_operations", "total_customers"
  ];
  
  const correlations = allMetrics
    .filter(m => m !== metric)
    .map(corr_metric => {
      const strength = Math.random() * 2 - 1; // Random between -1 and 1
      let strengthDesc;
      
      if (strength > 0.7) strengthDesc = "Strong positive";
      else if (strength > 0.3) strengthDesc = "Moderate positive";
      else if (strength > 0) strengthDesc = "Weak positive";
      else if (strength < -0.7) strengthDesc = "Strong negative";
      else if (strength < -0.3) strengthDesc = "Moderate negative";
      else strengthDesc = "Weak negative";
      
      return {
        metric: corr_metric,
        correlation: strength,
        strength: strengthDesc
      };
    });
  
  // Return formatted data
  const metricDataResult = {
    summary: {
      total: totalValue,
      yearly_avg: totalValue / yearlyValues.length,
      yoy_change: yearlyValues.length > 1 && yearlyValues[yearlyValues.length - 2] !== 0
        ? (yearlyValues[yearlyValues.length - 1] / yearlyValues[yearlyValues.length - 2] - 1) * 100
        : 0,
      trend_direction: yearlyValues[yearlyValues.length - 1] > yearlyValues[0] ? "Increasing" : "Decreasing",
      trend_strength: yearlyValues.length > 0 && Math.abs(yearlyValues[yearlyValues.length - 1] / yearlyValues[0] - 1) > 0.3
        ? "Strong trend"
        : "Moderate trend"
    },
    yearly_data: yearlyTrend,
    customer_data: customerData,
    workcenter_data: workcenterData,
    monthly_data: monthlyData,
    correlations
  };
  
  return fetchWithDelay(metricDataResult);
};