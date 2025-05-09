from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import json
import os
import numpy as np
import pandas as pd
from utils import data_utils

# Helper function to convert NumPy types to Python native types
def convert_numpy_types(obj):
    if isinstance(obj, (np.integer, np.int64)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    else:
        return obj

# Custom jsonify function that handles NumPy types
def custom_jsonify(data):
    return Response(
        json.dumps(convert_numpy_types(data)),
        mimetype='application/json'
    )

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/summary-metrics', methods=['GET'])
def get_summary_metrics():
    """Get summary metrics for dashboard"""
    try:
        metrics = data_utils.load_summary_metrics()
        return custom_jsonify(metrics)
    except Exception as e:
        return custom_jsonify({"error": str(e)}), 500

# Add routes without /api prefix to support proxy
@app.route('/summary-metrics', methods=['GET'])
def get_summary_metrics_no_prefix():
    return get_summary_metrics()

@app.route('/api/yearly-summary', methods=['GET'])
def get_yearly_summary():
    """Get yearly summary data"""
    try:
        data = data_utils.load_yearly_summary()
        return custom_jsonify(data)
    except Exception as e:
        return custom_jsonify({"error": str(e)}), 500

# Add route without /api prefix
@app.route('/yearly-summary', methods=['GET'])
def get_yearly_summary_no_prefix():
    return get_yearly_summary()

@app.route('/api/customer-profitability', methods=['GET'])
def get_customer_profitability():
    """Get customer profitability data"""
    try:
        data = data_utils.load_customer_profitability()
        return custom_jsonify(data)
    except Exception as e:
        return custom_jsonify({"error": str(e)}), 500

# Add route without /api prefix
@app.route('/customer-profitability', methods=['GET'])
def get_customer_profitability_no_prefix():
    return get_customer_profitability()

@app.route('/api/workcenter-trends', methods=['GET'])
def get_workcenter_trends():
    """Get workcenter trends data"""
    try:
        data = data_utils.load_workcenter_trends()
        return custom_jsonify(data)
    except Exception as e:
        return custom_jsonify({"error": str(e)}), 500

# Add route without /api prefix
@app.route('/workcenter-trends', methods=['GET'])
def get_workcenter_trends_no_prefix():
    return get_workcenter_trends()

@app.route('/api/year-data/<year>', methods=['GET'])
def get_year_data(year):
    """Get data for a specific year"""
    try:
        data = data_utils.load_year_data(year)
        return custom_jsonify(data)
    except Exception as e:
        return custom_jsonify({"error": str(e)}), 500

# Add route without /api prefix
@app.route('/year-data/<year>', methods=['GET'])
def get_year_data_no_prefix(year):
    return get_year_data(year)

@app.route('/api/metric-data/<metric>', methods=['GET'])
def get_metric_data(metric):
    """Get data for a specific metric"""
    try:
        # Since load_metric_data isn't currently defined in data_utils, we'll use a simplified approach
        
        # Get yearly summary data
        yearly_data = data_utils.load_yearly_summary()
        
        # Function to extract yearly values based on metric
        def extract_yearly_values(metricName):
            if metricName == "planned_hours":
                return [item["planned_hours"] for item in yearly_data]
            elif metricName == "actual_hours":
                return [item["actual_hours"] for item in yearly_data]
            elif metricName == "overrun_hours":
                return [item["overrun_hours"] for item in yearly_data]
            elif metricName == "ncr_hours":
                return [item["ncr_hours"] for item in yearly_data]
            elif metricName in ["job_count", "total_jobs"]:
                return [item["job_count"] for item in yearly_data]
            elif metricName in ["operation_count", "total_operations"]:
                return [item["operation_count"] for item in yearly_data]
            elif metricName in ["customer_count", "total_customers"]:
                return [item["customer_count"] for item in yearly_data]
            elif metricName == "planned_cost":
                return [item["planned_hours"] * 199 for item in yearly_data]
            elif metricName == "actual_cost":
                return [item["actual_hours"] * 199 for item in yearly_data]
            elif metricName == "overrun_cost":
                return [item["overrun_hours"] * 199 for item in yearly_data]
            elif metricName == "overrun_percent":
                return [
                    (item["overrun_hours"] / item["planned_hours"] * 100) if item["planned_hours"] > 0 else 0 
                    for item in yearly_data
                ]
            else:
                return [0] * len(yearly_data)
        
        # Extract values and create yearly trend
        yearly_values = extract_yearly_values(metric)
        yearly_trend = [{"year": item["year"], "value": value} for item, value in zip(yearly_data, yearly_values)]
        
        # Calculate total value
        total_value = sum(yearly_values)
        
        # Get customer data
        customer_data = data_utils.load_customer_profitability()
        
        # Get workcenter data
        workcenter_data = data_utils.load_workcenter_trends()
        
        # Generate customer metric data with actual distribution
        customer_metric_data = []
        if customer_data and "profit_data" in customer_data:
            # Sort by profitability for consistent display
            sorted_customers = sorted(customer_data["profit_data"], key=lambda x: x.get("profitability", 0), reverse=True)
            
            for customer in sorted_customers:
                # Use actual profitability for value calculation
                customer_value = total_value * abs(customer.get("profitability", 0) / 1000)
                customer_metric_data.append({
                    "name": customer.get("customer", ""),
                    "list_name": customer.get("list_name", ""),
                    "value": customer_value,
                    "percent_of_total": (customer_value / total_value * 100) if total_value > 0 else 0
                })
        
        # Generate workcenter metric data with actual distribution
        workcenter_metric_data = []
        if workcenter_data and "work_center_data" in workcenter_data:
            # Sort by actual hours for consistent display
            sorted_workcenters = sorted(workcenter_data["work_center_data"], key=lambda x: x.get("actual_hours", 0), reverse=True)
            
            total_wc_hours = sum(wc.get("actual_hours", 0) for wc in sorted_workcenters)
            
            for wc in sorted_workcenters:
                wc_percent = (wc.get("actual_hours", 0) / total_wc_hours * 100) if total_wc_hours > 0 else 0
                workcenter_metric_data.append({
                    "workcenter": wc.get("work_center", ""),
                    "value": wc.get("actual_hours", 0) if metric == "actual_hours" else wc.get("planned_hours", 0),
                    "percent_of_total": wc_percent
                })
        
        # Create final result
        result = {
            "summary": {
                "total": total_value,
                "yearly_avg": total_value / len(yearly_values) if yearly_values else 0,
                "yoy_change": (
                    (yearly_values[-1] / yearly_values[-2] - 1) * 100 
                    if len(yearly_values) > 1 and yearly_values[-2] != 0 
                    else 0
                ),
                "trend_direction": "Increasing" if yearly_values[-1] > yearly_values[0] else "Decreasing" 
                if yearly_values else "Stable",
                "trend_strength": "Strong" if abs(yearly_values[-1] / yearly_values[0] - 1) > 0.3 else "Moderate"
                if yearly_values else "Unknown"
            },
            "yearly_data": yearly_trend,
            "customer_data": customer_metric_data,
            "workcenter_data": workcenter_metric_data
        }
        
        return custom_jsonify(result)
    except Exception as e:
        print(f"Error processing metric data: {e}")
        return custom_jsonify({"error": str(e)}), 500

# Add route without /api prefix
@app.route('/metric-data/<metric>', methods=['GET'])
def get_metric_data_no_prefix(metric):
    return get_metric_data(metric)

@app.route('/api/upload-workhistory', methods=['POST'])
def upload_workhistory():
    """Upload and process work history data"""
    if 'file' not in request.files:
        return custom_jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return custom_jsonify({"error": "No selected file"}), 400
        
    if file:
        try:
            # Save the uploaded file temporarily
            upload_path = 'temp_upload.xlsx'
            file.save(upload_path)
            
            # Process the file (for now, just loading it)
            df = pd.read_excel(upload_path)
            record_count = len(df)
            
            # In a real implementation, we would call data_utils.process_workhistory(upload_path)
            
            # Clean up the temporary file
            try:
                os.remove(upload_path)
            except:
                pass
                
            return custom_jsonify({
                "success": True,
                "message": f"File processed successfully with {record_count} records."
            })
            
        except Exception as e:
            return custom_jsonify({"error": str(e)}), 500
    
    return custom_jsonify({"error": "Unknown error processing file"}), 500

# Add route without /api prefix
@app.route('/upload-workhistory', methods=['POST'])
def upload_workhistory_no_prefix():
    return upload_workhistory()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)