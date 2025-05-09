// API endpoints for fetching data from the Flask backend
// Use relative URL to avoid CORS issues in Replit environment
const API_BASE_URL = '/api';

// Helper to handle API errors
const handleApiError = (error, defaultValue) => {
  console.error('API Error:', error);
  return defaultValue;
};

// Load yearly summary data
export const loadYearlySummary = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/yearly-summary`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    return handleApiError(error, []);
  }
};

// Load summary metrics
export const loadSummaryMetrics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/summary-metrics`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    return handleApiError(error, {
      total_planned_hours: 0,
      total_actual_hours: 0,
      total_overrun_hours: 0,
      total_ncr_hours: 0,
      total_planned_cost: 0,
      total_actual_cost: 0,
      overrun_percent: 0,
      total_jobs: 0,
      total_operations: 0,
      total_customers: 0
    });
  }
};

// Load customer profitability data
export const loadCustomerProfitability = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/customer-profitability`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    return handleApiError(error, {
      top_customer: 'N/A',
      top_customer_list_name: 'N/A',
      overrun_customer: 'N/A',
      overrun_customer_list_name: 'N/A',
      repeat_rate: 0,
      avg_margin: 0,
      profit_data: []
    });
  }
};

// Load work center trends
export const loadWorkcenterTrends = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/workcenter-trends`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    return handleApiError(error, {
      most_used_wc: 'N/A',
      overrun_wc: 'N/A',
      avg_util: 0,
      total_wc_hours: 0,
      work_center_data: []
    });
  }
};

// Load year data
export const loadYearData = async (year) => {
  console.log(`Loading data for year ${year}`);
  try {
    const response = await fetch(`${API_BASE_URL}/year-data/${year}`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    return handleApiError(error, {
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
    });
  }
};

// Load metric data
export const loadMetricData = async (metric) => {
  console.log(`Loading data for metric: ${metric}`);
  try {
    const response = await fetch(`${API_BASE_URL}/metric-data/${metric}`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    return handleApiError(error, null);
  }
};

// Upload work history data
export const uploadWorkHistory = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/upload-workhistory`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Unknown error');
    }
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to upload file'
    };
  }
};